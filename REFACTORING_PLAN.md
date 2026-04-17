# Salvida — Plan de Refactoring Integral

> Documento de referencia para el MR de refactoring. Cada sección tiene prioridad, archivos afectados, y descripción técnica del cambio.

---

## Tabla de Contenidos

- [1. SEGURIDAD (Backend)](#1-seguridad-backend)
- [2. ARQUITECTURA (Backend)](#2-arquitectura-backend)
- [3. COMPONENTIZACIÓN (Frontend)](#3-componentización-frontend)
- [4. STATE MANAGEMENT (Frontend)](#4-state-management-frontend)
- [5. HOOKS & LÓGICA COMPARTIDA (Frontend)](#5-hooks--lógica-compartida-frontend)
- [6. STYLING & DESIGN TOKENS (Frontend)](#6-styling--design-tokens-frontend)
- [7. ACCESIBILIDAD (Frontend)](#7-accesibilidad-frontend)
- [8. i18n — STRINGS HARDCODEADOS (Frontend)](#8-i18n--strings-hardcodeados-frontend)
- [9. PERFORMANCE & OPTIMIZACIÓN (Full Stack)](#9-performance--optimización-full-stack)
- [10. ERROR HANDLING (Full Stack)](#10-error-handling-full-stack)
- [11. CONFIGURACIÓN & INFRAESTRUCTURA](#11-configuración--infraestructura)
- [12. TESTING](#12-testing)
- [13. CLEANUP & DEUDA TÉCNICA](#13-cleanup--deuda-técnica)

---

## 1. SEGURIDAD (Backend)

### 1.1 [CRÍTICO] Inyección PostgREST en búsqueda de PRMs

**Archivo:** `backend/routers/prms.py` ~línea 147

**Problema:** El parámetro `q` se interpola directamente en el filtro `.or_()` de PostgREST sin escapear. Un atacante puede inyectar operadores PostgREST adicionales.

```python
# ACTUAL (VULNERABLE)
if q:
    query = query.or_(f"name.ilike.%{q}%,email.ilike.%{q}%,phone.ilike.%{q}%")
```

**Solución:** Escapear caracteres especiales de PostgREST antes de interpolar, o usar filtros individuales encadenados.

```python
# PROPUESTO
import re

def _sanitize_postgrest_value(value: str) -> str:
    """Escape special PostgREST characters to prevent filter injection."""
    return re.sub(r'[,.()\\/]', '', value.strip())

if q:
    safe_q = _sanitize_postgrest_value(q)
    query = query.or_(
        f"name.ilike.%{safe_q}%,email.ilike.%{safe_q}%,phone.ilike.%{safe_q}%"
    )
```

---

### 1.2 [CRÍTICO] DEBUG=True como default bypasea toda la autenticación

**Archivo:** `backend/config.py` línea 12

**Problema:** `debug: bool = True` como default. Cuando debug=True:
- Requests sin token devuelven `DEV_USER` (auth/dependencies.py:31-32)
- La firma del JWT NO se verifica (auth/dependencies.py:40-43)
- Un error de configuración en producción expone TODA la API sin autenticación

**Solución:**

```python
# backend/config.py
class Settings(BaseSettings):
    debug: bool = False  # NUNCA True por default
    supabase_jwt_secret: str = ""  # Se valida en startup

# backend/main.py — agregar validación en startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.debug:
        logger.warning("⚠️  DEBUG MODE ACTIVE — auth is relaxed. DO NOT use in production.")
    if not settings.debug and not settings.supabase_jwt_secret:
        raise RuntimeError(
            "FATAL: supabase_jwt_secret is required when DEBUG=false. "
            "Set it in .env or disable debug mode only for local development."
        )
    # ... rest of lifespan
```

---

### 1.3 [ALTO] Validación de input faltante en endpoints

**Archivos afectados:**
- `backend/models/booking.py`
- `backend/models/address.py`
- `backend/models/prm.py`

**Problema:** Los modelos Pydantic no validan formato ni rangos de datos. Se acepta cualquier string para fechas, horas, coordenadas, teléfonos, etc.

**Solución:** Agregar `field_validator` en cada modelo:

```python
# backend/models/booking.py
from pydantic import field_validator
from datetime import datetime

class BookingCreate(BaseModel):
    prmId: str
    date: str
    startTime: str
    endTime: str
    address: str
    service_reason: ServiceReason
    service_reason_notes: str | None = None

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("date must be YYYY-MM-DD format")
        return v

    @field_validator("startTime", "endTime")
    @classmethod
    def validate_time_format(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            raise ValueError("time must be HH:MM format")
        return v

    @model_validator(mode="after")
    def validate_time_order(self) -> "BookingCreate":
        if self.startTime >= self.endTime:
            raise ValueError("startTime must be before endTime")
        return self
```

```python
# backend/models/address.py
class AddressCreate(BaseModel):
    full_address: str
    lat: float
    lng: float
    is_accessible: bool = False
    alias: str | None = None

    @field_validator("full_address")
    @classmethod
    def validate_address_length(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5 or len(v) > 500:
            raise ValueError("full_address must be between 5 and 500 characters")
        return v

    @field_validator("lat")
    @classmethod
    def validate_latitude(cls, v: float) -> float:
        if not -90 <= v <= 90:
            raise ValueError("lat must be between -90 and 90")
        return v

    @field_validator("lng")
    @classmethod
    def validate_longitude(cls, v: float) -> float:
        if not -180 <= v <= 180:
            raise ValueError("lng must be between -180 and 180")
        return v
```

```python
# backend/models/prm.py — agregar validaciones
class PrmCreate(BaseModel):
    # ...existing fields...

    @field_validator("birthDate")
    @classmethod
    def validate_birth_date(cls, v: str | None) -> str | None:
        if v is None:
            return v
        try:
            parsed = datetime.strptime(v, "%Y-%m-%d")
            if parsed > datetime.now():
                raise ValueError("birthDate cannot be in the future")
        except ValueError as e:
            if "cannot be in the future" in str(e):
                raise
            raise ValueError("birthDate must be YYYY-MM-DD format")
        return v

    @field_validator("height", "weight")
    @classmethod
    def validate_positive_number(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("must be a positive number")
        return v
```

---

### 1.4 [ALTO] Rate limiting en endpoints públicos

**Archivos afectados:**
- `backend/main.py`
- `backend/routers/global_kpis.py`
- `backend/routers/reviews.py`
- `backend/routers/social_links.py`
- `backend/routers/push_subscriptions.py`

**Problema:** Los endpoints públicos no tienen limitación de requests. `/api/reviews` puede disparar sync con Google Places API en cada request si la tabla está vacía — vector de DoS directo.

**Solución:** Agregar `slowapi` como middleware:

```python
# backend/requirements.txt — agregar
slowapi==0.1.9

# backend/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# backend/routers/global_kpis.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.get("")
@limiter.limit("30/minute")
async def get_kpis(request: Request):
    # ...

# backend/routers/reviews.py
@router.get("")
@limiter.limit("10/minute")
async def get_reviews(request: Request):
    # ...
```

---

### 1.5 [ALTO] Cachear rol de usuario para evitar N+1 en auth checks

**Archivos afectados:**
- `backend/auth/dependencies.py`
- `backend/auth/roles.py`

**Problema:** Cada llamada a `is_admin()` o `get_user_role()` hace un query a la base de datos. En un endpoint que verifica permisos + lista recursos, esto genera queries extras por cada item.

**Solución:** Incluir el rol en el diccionario `user` que devuelve `get_current_user`:

```python
# backend/auth/dependencies.py
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    # ... existing JWT validation ...

    # Fetch role ONCE and include in user dict
    role = _fetch_role(payload["sub"])
    return {
        "sub": payload["sub"],
        "email": payload.get("email", ""),
        "role": role,
    }

def _fetch_role(user_id: str) -> str:
    supabase = get_supabase()
    try:
        result = supabase.table("profiles").select("role").eq("id", user_id).single().execute()
        return result.data.get("role", "user") if result.data else "user"
    except Exception:
        return "user"

# backend/auth/roles.py — simplificar
def is_admin(user: dict) -> bool:
    """Check admin role from pre-fetched user dict."""
    return user.get("role") == "admin"

def require_admin(user: dict) -> None:
    """Raise 403 if user is not admin."""
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required")
```

**Impacto:** Cambiar TODOS los routers que usen `is_admin(user["sub"])` a `is_admin(user)`.

---

### 1.6 [ALTO] CORS regex demasiado permisivo con credentials

**Archivo:** `backend/main.py`

**Problema actual:**
```python
allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?"
allow_credentials=True
```

**Solución:** Usar lista explícita en producción, regex solo en development:

```python
if settings.debug:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,  # Lista explícita
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )
```

---

### 1.7 [MEDIO] Error handling expone detalles internos

**Archivos afectados:** Todos los routers

**Problema:** Los bloques `except Exception as e` devuelven `type(e).__name__: {e}` al cliente, exponiendo nombres de clases internas y mensajes de error que pueden revelar infraestructura.

**Solución:** Loguear detalles internamente, devolver mensajes genéricos al cliente:

```python
import logging
logger = logging.getLogger(__name__)

try:
    result = supabase.table("profiles").select("*").eq("id", user["sub"]).execute()
except Exception as e:
    logger.error("Failed to fetch profile for user %s: %s", user["sub"], e, exc_info=True)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not process request"
    )
```

Aplicar este patrón en:
- `backend/routers/profile.py` — líneas ~52-53, ~96, ~142
- `backend/routers/bookings.py` — líneas ~159-160
- `backend/routers/prms.py` — líneas ~185, ~210
- `backend/routers/addresses.py` — líneas ~69, ~92

---

### 1.8 [MEDIO] Structured logging para operaciones admin

**Archivos afectados:** Todos los routers

**Problema:** No hay logging de operaciones admin (quién cambió qué, cuándo). Si hay un incidente de seguridad, no hay audit trail.

**Solución:** Agregar logging estructurado en operaciones sensibles:

```python
logger.info(
    "admin_action",
    extra={
        "action": "archive_user",
        "admin_id": user["sub"],
        "target_user_id": user_id,
        "new_status": not current_status,
    }
)
```

**Endpoints que necesitan audit logging:**
- `PATCH /api/profile/{user_id}/archive` — archival de usuarios
- `PUT /api/profile/{user_id}` — edición de perfil por admin
- `PATCH /api/addresses/{id}/validate` — validación de direcciones
- `PATCH /api/bookings/{id}/status` — cambio de estado de bookings
- `DELETE /api/prms/{id}` — eliminación de PRMs
- `POST /api/reviews/sync` — forzar sync de reviews

---

### 1.9 [MEDIO] Review sync como background job, no lazy load

**Archivo:** `backend/routers/reviews.py`

**Problema:** La primera llamada a `GET /api/reviews` con tabla vacía triggerea `sync_google_reviews()` sincrónicamente. Esto puede tardar 10+ segundos y es un vector de DoS.

**Solución:**
```python
# En vez de sync síncrono en GET, usar background task
@router.get("", response_model=list[Review])
async def get_reviews(request: Request, background_tasks: BackgroundTasks):
    supabase = get_supabase()
    result = supabase.table("reviews").select("*").order("published_at", desc=True).limit(6).execute()

    if not result.data:
        # Trigger async sync, return empty for now
        background_tasks.add_task(sync_google_reviews)
        return []

    return result.data
```

---

## 2. ARQUITECTURA (Backend)

### 2.1 [ALTO] Refactorizar funciones largas en routers

**Archivo:** `backend/routers/prms.py` — `list_prms()` ~59 líneas

**Solución:** Extraer helpers:

```python
# Crear backend/routers/_helpers/prm_helpers.py
def build_prm_query(supabase, user: dict, q: str | None, status_filter: str | None) -> ...:
    """Build the base PRM query with filters."""
    ...

def enrich_with_owners(supabase, rows: list[dict]) -> dict[str, str]:
    """Batch-fetch owner names for PRM list."""
    ...

def enrich_with_booking_stats(supabase, prm_ids: list[str]) -> dict[str, dict]:
    """Batch-fetch booking counts and last dates for PRMs."""
    ...
```

**Archivo:** `backend/routers/bookings.py` — `list_bookings()` también necesita el mismo tratamiento.

---

### 2.2 [MEDIO] Agregar docstrings a TODOS los endpoints públicos

**Archivos afectados:** Todos los archivos en `backend/routers/`

**Problema:** 16+ endpoints no tienen docstring. FastAPI usa los docstrings para generar la documentación en `/docs`.

**Solución:** Agregar docstrings descriptivos:

```python
@router.get("/{address_id}", response_model=Address)
async def get_address(address_id: str, user: dict = Depends(get_current_user)):
    """Fetch a single address by ID.

    - Regular users can only access their own addresses.
    - Admins can access any address.
    """
```

**Endpoints sin docstring que necesitan uno:**
- `routers/profile.py`: `get_users`, `get_profile`, `update_notification_prefs`, `toggle_user_archive`, `update_user_profile`, `update_profile`
- `routers/addresses.py`: `list_addresses`, `get_address`, `create_address`, `update_address`, `validate_address`, `delete_address`
- `routers/bookings.py`: `list_bookings`, `get_booking`, `create_booking`, `cancel_booking`
- `routers/prms.py`: `list_prms`, `get_prm`, `create_prm`, `update_prm`, `delete_prm`, todos los de emergency contacts y addresses
- `routers/push_subscriptions.py`: `get_vapid_key`, `subscribe`, `unsubscribe`
- `routers/social_links.py`: todos los endpoints

---

### 2.3 [MEDIO] Pinear todas las dependencias

**Archivo:** `backend/requirements.txt`

**Problema:**
- `supabase>=2.15.0` — versión abierta, puede romper con breaking changes
- `py_vapid>=1.9.0` — ídem
- `python-jose==3.3.0` — paquete de 2020, considerar migrar a PyJWT

**Solución:**
```
supabase==2.15.0
py_vapid==1.9.0
# Considerar para futuro: reemplazar python-jose por PyJWT>=2.8.0
```

---

## 3. COMPONENTIZACIÓN (Frontend)

### 3.1 [ALTO] Descomponer LandingPage.tsx (~700 líneas)

**Archivo:** `frontend/src/pages/LandingPage/LandingPage.tsx`

**Estructura actual:** Un solo componente con Hero, Stats, Video, Testimonials, Social Footer, Quote Popup, Intersection Observer, y navbar highlighting.

**Estructura propuesta:**

```
src/pages/LandingPage/
├── LandingPage.tsx              ← orquestador (~80 líneas)
├── LandingPage.css              ← estilos compartidos del layout
├── components/
│   ├── LandingNavbar.tsx        ← navbar con scroll spy
│   ├── LandingNavbar.css
│   ├── HeroSection.tsx          ← hero con CTA buttons
│   ├── HeroSection.css
│   ├── StatsSection.tsx         ← counters animados
│   ├── StatsSection.css
│   ├── VideoSection.tsx         ← video con overlay
│   ├── VideoSection.css
│   ├── TestimonialsSection.tsx  ← Swiper carousel + fallback mocks
│   ├── TestimonialsSection.css
│   ├── BookingSection.tsx       ← sección de reservas (si existe)
│   ├── BookingSection.css
│   ├── SocialFooter.tsx         ← footer con social links
│   ├── SocialFooter.css
│   ├── QuotePopup.tsx           ← popup dinámico al hover
│   └── QuotePopup.css
└── hooks/
    └── useScrollSpy.ts          ← Intersection Observer logic
```

**Responsabilidades:**
- `LandingPage.tsx`: layout, sección refs, composición de sub-componentes
- `useScrollSpy.ts`: Intersection Observer, tracking de sección activa
- Cada `*Section.tsx`: renderiza su sección, recibe datos como props

---

### 3.2 [ALTO] Descomponer AuthCard.tsx (~328 líneas)

**Archivo:** `frontend/src/components/AuthCard/AuthCard.tsx`

**Problema:** Login y Register en el mismo componente con 13+ useState calls.

**Estructura propuesta:**

```
src/components/AuthCard/
├── AuthCard.tsx            ← wrapper con tab switch (~40 líneas)
├── AuthCard.css
├── LoginForm.tsx           ← formulario de login
├── RegisterForm.tsx        ← formulario de registro
├── SocialAuthButtons.tsx   ← botones OAuth (si aplica)
└── useAuthForm.ts          ← lógica compartida (validation, submit)
```

**Beneficio adicional:** Eliminar `useAuthFormStore.ts` (Zustand store dedicado solo para este form). El estado del formulario es LOCAL, no necesita un store global. Usar `useReducer` o react-hook-form.

---

### 3.3 [ALTO] Descomponer PrmDetail.tsx (~700 líneas)

**Archivo:** `frontend/src/pages/PrmDetail/PrmDetail.tsx`

**Problema:** Mezcla edición de PRM, gestión de contactos de emergencia, gestión de direcciones, y upload de avatar en un solo componente.

**Estructura propuesta:**

```
src/pages/PrmDetail/
├── PrmDetail.tsx                    ← orquestador (~100 líneas)
├── PrmDetail.css
├── components/
│   ├── PrmProfileCard.tsx           ← datos principales del PRM
│   ├── PrmProfileCard.css
│   ├── PrmEditForm.tsx              ← formulario de edición
│   ├── PrmEditForm.css
│   ├── EmergencyContactList.tsx     ← lista + CRUD de contactos
│   ├── EmergencyContactList.css
│   ├── EmergencyContactForm.tsx     ← formulario de contacto individual
│   ├── PrmAddressList.tsx           ← lista + CRUD de direcciones
│   ├── PrmAddressList.css
│   └── AvatarUpload.tsx             ← upload + preview de avatar
└── hooks/
    └── usePrmDetail.ts              ← fetch + mutations del PRM
```

---

### 3.4 [ALTO] Descomponer NewBooking.tsx (~500 líneas)

**Archivo:** `frontend/src/pages/NewBooking/NewBooking.tsx`

**Estructura propuesta:**

```
src/pages/NewBooking/
├── NewBooking.tsx              ← orquestador con stepper (~80 líneas)
├── NewBooking.css
├── components/
│   ├── PrmSelectionStep.tsx    ← selección de PRM con search
│   ├── DateTimeStep.tsx        ← fecha + hora inicio/fin
│   ├── AddressStep.tsx         ← selección de dirección
│   ├── ServiceReasonStep.tsx   ← razón del servicio + notas
│   └── BookingSummary.tsx      ← resumen antes de confirmar
└── hooks/
    └── useBookingForm.ts       ← estado del formulario multi-step
```

---

### 3.5 [ALTO] Descomponer Settings.tsx (~500 líneas)

**Archivo:** `frontend/src/pages/Settings/Settings.tsx`

**Problema:** 6 secciones distintas en un componente, con estados de formulario que causan re-renders en cascada.

**Estructura propuesta:**

```
src/pages/Settings/
├── Settings.tsx                    ← layout con tabs/secciones (~60 líneas)
├── Settings.css
├── components/
│   ├── ProfileSettings.tsx         ← datos personales
│   ├── NotificationSettings.tsx    ← preferencias de notificación
│   ├── SecuritySettings.tsx        ← cambio de contraseña
│   ├── AppearanceSettings.tsx      ← tema/idioma (placeholder actual)
│   └── LanguageSettings.tsx        ← configuración de idioma
```

---

### 3.6 [ALTO] Descomponer Dashboard.tsx (~250 líneas)

**Archivo:** `frontend/src/pages/Dashboard/Dashboard.tsx`

**Problema:** Contiene un `BookingCard` inline y mezcla layout con lógica de filtrado.

**Estructura propuesta:**

```
src/pages/Dashboard/
├── Dashboard.tsx               ← layout grid: calendar + list (~60 líneas)
├── Dashboard.css
├── components/
│   ├── BookingCard.tsx         ← card individual de booking
│   ├── BookingCard.css
│   ├── BookingList.tsx         ← lista con filtros + paginación
│   ├── BookingList.css
│   ├── BookingSummary.tsx      ← tarjeta resumen (total, pending, completed)
│   ├── BookingFilters.tsx      ← filtros de estado + fecha
│   └── BookingActions.tsx      ← dropdown con acciones admin
```

---

### 3.7 [MEDIO] Descomponer Prms.tsx (página de lista)

**Archivo:** `frontend/src/pages/Prms/Prms.tsx`

**Estructura propuesta:**

```
src/pages/Prms/
├── Prms.tsx                    ← orquestador (~50 líneas)
├── Prms.css
├── components/
│   ├── PrmTable.tsx            ← tabla responsiva
│   ├── PrmTableRow.tsx         ← fila individual con acciones
│   ├── PrmFilters.tsx          ← search + status tabs
│   └── PrmTableSkeleton.tsx    ← skeleton loader
```

---

### 3.8 [MEDIO] Descomponer Addresses.tsx (admin)

**Archivo:** `frontend/src/pages/Addresses/Addresses.tsx`

```
src/pages/Addresses/
├── Addresses.tsx
├── Addresses.css
├── components/
│   ├── AddressTable.tsx
│   ├── AddressTableRow.tsx
│   ├── AddressValidationForm.tsx   ← formulario de validación admin
│   └── AddressFilters.tsx          ← filtros por status
```

---

### 3.9 [MEDIO] Extraer componentes reutilizables de UI

Patrones repetidos que se deben extraer a `src/components/ui/`:

```
src/components/ui/
├── StatusBadge.tsx          ← badge de estado (usado en bookings, addresses, prms)
├── SearchInput.tsx          ← input de búsqueda con debounce integrado
├── SkeletonLoader.tsx       ← skeleton genérico (usado en Prms, Dashboard)
├── EmptyState.tsx           ← estado vacío con ícono y mensaje
├── PageHeader.tsx           ← header de página con título + acciones
├── DataTable.tsx            ← tabla responsiva genérica (opcional, si hay patrón claro)
└── FormField.tsx            ← wrapper de campo con label + error
```

---

## 4. STATE MANAGEMENT (Frontend)

### 4.1 [ALTO] Eliminar duplicación de estado de usuario

**Archivos afectados:**
- `frontend/src/store/useAuthStore.ts`
- `frontend/src/store/useCurrentUserStore.ts`

**Problema:** `useAuthStore.user` y `useCurrentUserStore.currentUser` almacenan el mismo dato (UserProfile). Dos fuentes de verdad = inconsistencias.

**Solución:** Eliminar `useCurrentUserStore` completamente. El perfil del usuario se maneja con React Query (ya existe `useCurrentUser` hook). El store de auth solo guarda `session` + `isInitialized`:

```typescript
// useAuthStore.ts — simplificado
interface AuthState {
  session: Session | null;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setInitialized: (v: boolean) => void;
  logout: () => void;
}
```

El perfil se obtiene via `useCurrentUser()` (React Query) — single source of truth.

---

### 4.2 [MEDIO] Eliminar useAuthFormStore.ts

**Archivo:** `frontend/src/store/useAuthFormStore.ts`

**Problema:** Un Zustand store global para estado de formulario que es inherentemente LOCAL al componente AuthCard.

**Solución:** Eliminar el store. Mover el estado al componente (o al nuevo `useAuthForm.ts` hook local tras la componentización de AuthCard).

---

## 5. HOOKS & LÓGICA COMPARTIDA (Frontend)

### 5.1 [ALTO] Extraer useDebounce compartido

**Problema:** `useDebounce` está implementado 3 veces en archivos diferentes (Prms.tsx, AddressSelector.tsx, NewBooking.tsx).

**Además:** La implementación en `Prms.tsx` tiene un BUG — usa `useState` donde debería usar `useEffect`:

```typescript
// ACTUAL (BUGGY en Prms.tsx)
function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useState(() => {  // ← BUG: useState no ejecuta side effects
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  });
  return debounced;
}
```

**Solución:** Crear un hook compartido correcto:

```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

Reemplazar las 3 implementaciones locales por el import compartido.

---

### 5.2 [ALTO] Agregar AbortController a fetch en AddressSelector

**Archivo:** `frontend/src/components/AddressSelector.tsx` ~líneas 82-116

**Problema:** Los `useEffect` que hacen fetch no abortan requests al desmontarse. Esto causa:
- Memory leaks (setState en componente desmontado)
- Race conditions (respuestas antiguas sobreescriben nuevas)

**Solución:**

```typescript
useEffect(() => {
  if (!query) return;
  const controller = new AbortController();

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return;
      const data = await res.json();
      setSuggestions(data.features ?? []);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Geocoding error:", err);
    }
  };

  fetchSuggestions();
  return () => controller.abort();
}, [query]);
```

---

### 5.3 [MEDIO] AddressSelector debe usar apiClient, no fetch directo

**Archivo:** `frontend/src/components/AddressSelector.tsx` ~línea 101

**Problema:** Usa `fetch()` directo en vez del `apiClient` del proyecto. Inconsistente con el resto de la app.

**Nota:** Si el fetch es a un servicio externo (Geoapify), está bien usar fetch directo — pero necesita AbortController y error handling.

---

### 5.4 [MEDIO] PrmAddressPicker — dependency array incompleto

**Archivo:** `frontend/src/components/PrmAddressPicker.tsx` ~línea 30-43

**Problema:** useEffect con dependency array que no incluye `onChange` — puede causar stale closures.

**Solución:** Agregar `onChange` al dependency array o usar `useCallback` en el parent para estabilizar la referencia.

---

## 6. STYLING & DESIGN TOKENS (Frontend)

### 6.1 [MEDIO] Establecer convención única: Tailwind vs CSS files

**Estado actual:** Mezcla inconsistente de Tailwind utilities en JSX + archivos .css separados. Algunos componentes usan 100% Tailwind, otros 100% CSS, otros ambos.

**Decisión requerida (elegir UNA):**

**Opción A — Tailwind-first:** Usar Tailwind para todo. Los archivos .css solo para animaciones complejas o overrides de librerías externas (Swiper, Leaflet).

**Opción B — CSS-first con Tailwind para layout:** Usar .css files para estilos de componentes, Tailwind solo para utilities de layout (flex, grid, padding, margin).

**Recomendación:** Opción A (Tailwind-first) dado que ya están usando Tailwind v4 + `tailwind-merge`. Documentar la convención.

---

### 6.2 [MEDIO] Sistema de z-index

**Problema:** z-index arbitrarios: 200 (ConfirmDialog), 100 (AddressSelector), 50 (DropdownMenu). Sin sistema.

**Solución:** Crear variables CSS de z-index:

```css
/* src/index.css */
:root {
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-overlay: 300;
  --z-modal: 400;
  --z-toast: 500;
}
```

Reemplazar todos los z-index hardcodeados.

---

### 6.3 [BAJO] Eliminar inline styles

**Archivos afectados:**
- `PrmAddressPicker.tsx` ~línea 150 — objeto de style inline masivo
- `NewBooking.tsx` ~línea 138
- Varios componentes de Settings

**Solución:** Mover a clases CSS.

---

## 7. ACCESIBILIDAD (Frontend)

### 7.1 [ALTO] Agregar aria-labels a botones de solo ícono

**Archivos afectados:**
- `Header.tsx` — botón de notificaciones (bell icon)
- `Sidebar.tsx` — botón de toggle
- `Dashboard.tsx` — botones de acción en booking cards
- `Prms.tsx` — botones de status toggle

**Solución:**

```tsx
// Ejemplo: Header.tsx
<button aria-label={t("notifications.title")} onClick={...}>
  <Bell size={20} />
</button>
```

---

### 7.2 [ALTO] Agregar landmarks y heading hierarchy

**Archivos afectados:** Todos los layouts de página

**Problemas:**
- No hay `<main>`, `<nav>`, `<aside>` semánticos
- Los números de sección en NewBooking (1, 2, 3) son solo visuales, no semánticos

**Solución:**
- Layout.tsx: `<aside>` para sidebar, `<main>` para contenido
- NewBooking.tsx: `<fieldset>` + `<legend>` para cada step
- LandingPage.tsx: `<section aria-labelledby="...">` para cada sección

---

### 7.3 [MEDIO] CalendarWidget — ARIA labels para fechas

**Archivo:** `frontend/src/components/CalendarWidget/CalendarWidget.tsx`

**Problema:** Los botones de día no tienen aria-label. Un usuario de screen reader no sabe qué fecha está seleccionando.

**Solución:**

```tsx
<button
  aria-label={`${dayNumber} de ${monthName} de ${year}`}
  aria-selected={isSelected}
  role="gridcell"
>
  {dayNumber}
</button>
```

---

### 7.4 [MEDIO] Keyboard navigation en Testimonials carousel

**Archivo:** Nuevo `TestimonialsSection.tsx` (post-componentización)

**Problema:** El carousel de Swiper no tiene hints de navegación por teclado.

**Solución:** Agregar `a11y` config de Swiper + tabIndex en slides.

---

## 8. i18n — STRINGS HARDCODEADOS (Frontend)

### 8.1 [MEDIO] Mover todos los strings hardcodeados a es.json

**Archivos afectados y strings encontrados:**

| Archivo | String hardcodeado | Key propuesta |
|---------|-------------------|---------------|
| `AddressSelector.tsx` | `"Escribe la dirección con número..."` | `address.placeholder` |
| `AddressSelector.tsx` | `"Sin resultados para..."` | `address.noResults` |
| `AddressSelector.tsx` | `"Usar... como dirección"` | `address.useAsAddress` |
| `AddressSelector.tsx` | `"Accesible para PMR"` | `address.accessibleForPrm` |
| `PrmAddressPicker.tsx` | `"Nueva dirección"` | `prm.newAddress` |
| `NewBooking.tsx` | `"Usar... como dirección"` | `booking.useAsAddress` |
| `DropdownMenu.tsx` | `"Más opciones"` | `common.moreOptions` |
| `ConfirmDialog.tsx` | `"Confirmar"` / `"Cancelar"` | `common.confirm` / `common.cancel` |
| `Dashboard.tsx` | Status labels (`"Approved"`, etc.) | `booking.status.approved`, etc. |
| `Prms.tsx` | `"Activo"` / `"Inactivo"` | `prm.status.active` / `prm.status.inactive` |
| `Settings.tsx` | `"Esta sección está en desarrollo"` | `settings.underDevelopment` |

**Total estimado:** ~25-30 strings para migrar.

---

## 9. PERFORMANCE & OPTIMIZACIÓN (Full Stack)

### 9.1 [ALTO] Backend — N+1 en endpoint de PRMs

**Archivo:** `backend/routers/prms.py` ~líneas 127-185

**Problema actual:** Para enriquecer la lista de PRMs, hace queries separadas para owners y booking stats. Si bien los owners ya están batched con `.in_()`, el cálculo de stats se puede optimizar.

**Solución:** Crear una vista en Supabase o usar un query más eficiente:

```sql
-- Vista materializada en Supabase
CREATE VIEW prm_with_stats AS
SELECT
  p.*,
  COUNT(b.id) as booking_count,
  MAX(b.date) as last_booking_date
FROM prms p
LEFT JOIN bookings b ON b.prm_id = p.id
GROUP BY p.id;
```

Si no se puede crear vista, al menos batchar el cálculo de stats con un solo query:

```python
# En vez de iterar, hacer un solo query agrupado
stats = (
    supabase.table("bookings")
    .select("prm_id, id, date")
    .in_("prm_id", prm_ids)
    .execute()
)
# Agrupar en Python
```

---

### 9.2 [ALTO] Frontend — Virtualización de listas largas

**Archivos afectados:**
- `Dashboard.tsx` (lista de bookings)
- `Prms.tsx` (tabla de PRMs)

**Problema:** Renderiza TODAS las filas en el DOM. Con 50 items está bien. Con 500, el DOM tiene 500+ nodos y la performance degrada.

**Solución:** Implementar `@tanstack/react-virtual` para listas largas:

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

// En BookingList.tsx
const virtualizer = useVirtualizer({
  count: bookings.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 80, // altura estimada de cada card
});
```

**Nota:** Solo vale la pena si la cantidad de items justifica el overhead. Si hay paginación server-side con máximo ~50 items, no es necesario.

---

### 9.3 [MEDIO] Frontend — Lazy load de Swiper en LandingPage

**Problema:** Swiper se carga aunque el usuario no llegue a la sección de testimonios.

**Solución:** Lazy load del componente de testimonios:

```typescript
const TestimonialsSection = lazy(() => import("./components/TestimonialsSection"));

// En LandingPage
<Suspense fallback={<TestimonialsSkeleton />}>
  <TestimonialsSection reviews={reviews} />
</Suspense>
```

---

### 9.4 [MEDIO] Frontend — Image lazy loading

**Archivos afectados:**
- LandingPage (avatars de testimonios)
- Prms (avatars de PRMs)
- PrmDetail (avatar del PRM)

**Solución:** Agregar `loading="lazy"` a todas las imágenes que no estén above-the-fold:

```tsx
<img src={avatar} alt={name} loading="lazy" />
```

---

### 9.5 [MEDIO] Frontend — Memoización en Settings.tsx

**Problema:** 6+ `useState` calls en Settings causan re-renders en cascada al cargar el perfil. Cada setState triggerea un render.

**Solución:** Reemplazar múltiples `useState` con `useReducer` o un solo estado:

```typescript
const [form, setForm] = useState<ProfileFormState>({
  firstName: "",
  lastName: "",
  phone: "",
  organization: "",
  dni: "",
  avatar: "",
});

// Update todo de una vez
useEffect(() => {
  if (profile) {
    setForm({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      // ...
    });
  }
}, [profile]);
```

---

### 9.6 [BAJO] Backend — Cache KPIs endpoint

**Archivo:** `backend/routers/global_kpis.py`

**Problema:** 3 COUNT queries por request, sin cache.

**Solución:** Cache con TTL simple:

```python
from functools import lru_cache
from time import time

_kpi_cache: dict = {}
_kpi_cache_ttl = 300  # 5 minutos

@router.get("")
async def get_kpis(request: Request):
    now = time()
    if _kpi_cache.get("ts", 0) + _kpi_cache_ttl > now:
        return _kpi_cache["data"]

    # ...compute kpis...
    _kpi_cache["data"] = kpis
    _kpi_cache["ts"] = now
    return kpis
```

---

## 10. ERROR HANDLING (Full Stack)

### 10.1 [ALTO] Frontend — Agregar Error Boundary

**Problema:** Si una ruta lazy-loaded falla (red lenta, chunk corrupto), el usuario ve pantalla blanca.

**Solución:** Crear un Error Boundary genérico:

```
src/components/ErrorBoundary/
├── ErrorBoundary.tsx
└── ErrorFallback.tsx
```

```tsx
// ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

```tsx
// App.tsx — wrappear las lazy routes
<ErrorBoundary>
  <Suspense fallback={<AppLoader />}>
    <Routes>
      {/* ... */}
    </Routes>
  </Suspense>
</ErrorBoundary>
```

---

### 10.2 [MEDIO] Backend — Mejorar manejo de errores de Supabase

**Archivos:** Todos los routers

**Problema:** `except Exception` captura TODO, incluyendo errores de programación. Debería capturar errores específicos de Supabase/PostgREST.

**Solución:**

```python
from postgrest.exceptions import APIError as PostgrestError

try:
    result = supabase.table("bookings").select("*").execute()
except PostgrestError as e:
    logger.error("Database error: %s", e.message)
    raise HTTPException(status_code=502, detail="Database unavailable")
except Exception as e:
    logger.error("Unexpected error: %s", e, exc_info=True)
    raise HTTPException(status_code=500, detail="Internal server error")
```

---

## 11. CONFIGURACIÓN & INFRAESTRUCTURA

### 11.1 [ALTO] Agregar ESLint + Prettier

**Estado actual:** No hay ESLint ni Prettier configurado.

**Solución:**

```bash
# Frontend
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks
npm install -D prettier eslint-config-prettier
```

Crear `frontend/eslint.config.js` con reglas para:
- React hooks rules
- TypeScript strict
- No unused variables
- Import order

Crear `frontend/.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

---

### 11.2 [MEDIO] Agregar pre-commit hooks

**Solución:**

```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json (root)
{
  "lint-staged": {
    "frontend/src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "backend/**/*.py": ["ruff check --fix", "ruff format"]
  }
}
```

---

### 11.3 [MEDIO] Backend — Agregar ruff para linting Python

```bash
pip install ruff
```

Crear `backend/pyproject.toml`:
```toml
[tool.ruff]
target-version = "py312"
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP", "S", "B"]
ignore = ["S101"]  # allow assert in tests
```

---

### 11.4 [BAJO] Agregar GitHub Actions CI/CD

Crear `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci --prefix frontend
      - run: npm run lint --prefix frontend
      - run: npm run build --prefix frontend

  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r backend/requirements.txt ruff pytest
      - run: ruff check backend/
      - run: pytest backend/tests/ -v
```

---

### 11.5 [BAJO] Agregar Dockerfile (opcional, para deployment)

Si se va a deployear en contenedores, crear:
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml` para desarrollo local

---

## 12. TESTING

### 12.1 [ALTO] Backend — Tests mínimos para endpoints críticos

**Prioridad de testing (de mayor a menor impacto):**

1. **Auth bypass scenarios** — Verificar que sin token no se accede a endpoints protegidos
2. **PostgREST injection** — Verificar que la sanitización funciona
3. **Booking creation/update** — Validación de fechas/horas
4. **PRM CRUD** — Acceso solo a propios PRMs para non-admins
5. **Address validation** — Solo admin puede validar

```python
# backend/tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_protected_endpoint_requires_auth():
    response = client.get("/api/profile")
    assert response.status_code in (401, 403)

def test_admin_endpoint_requires_admin_role():
    # con token de usuario regular
    response = client.get("/api/profile/users", headers={"Authorization": f"Bearer {regular_token}"})
    assert response.status_code == 403
```

---

### 12.2 [MEDIO] Frontend — Tests mínimos para hooks críticos

```typescript
// src/hooks/__tests__/useDebounce.test.ts
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../useDebounce";

test("debounces value changes", async () => {
  const { result, rerender } = renderHook(
    ({ value }) => useDebounce(value, 300),
    { initialProps: { value: "hello" } }
  );

  expect(result.current).toBe("hello");

  rerender({ value: "world" });
  expect(result.current).toBe("hello"); // Still old value

  await act(() => new Promise((r) => setTimeout(r, 300)));
  expect(result.current).toBe("world"); // Now updated
});
```

---

## 13. CLEANUP & DEUDA TÉCNICA

### 13.1 [BAJO] Eliminar `@google/genai` de dependencies

**Archivo:** `frontend/package.json`

**Problema:** `@google/genai` está en dependencies pero no se usa en ningún archivo del src/.

**Además:** `GEMINI_API_KEY` se expone en vite.config.ts via `process.env.GEMINI_API_KEY` — si no se usa, eliminar esa línea también.

---

### 13.2 [BAJO] Eliminar `express` de frontend dependencies

**Archivo:** `frontend/package.json`

**Problema:** `express` está listado como dependency del frontend. Un frontend SPA con Vite no necesita express.

---

### 13.3 [BAJO] Eliminar `dotenv` de frontend dependencies

**Archivo:** `frontend/package.json`

**Problema:** Vite ya maneja variables de entorno nativamente con `import.meta.env`. No se necesita `dotenv` en el frontend.

---

### 13.4 [BAJO] Unificar nombre del package

**Archivo:** `frontend/package.json`

**Problema:** `"name": "react-example"` — debería ser `"salvida-frontend"` o similar.

---

### 13.5 [BAJO] TypeScript strict mode

**Archivo:** `frontend/tsconfig.json`

**Problema:** No tiene `"strict": true` explícito. Agregar:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

---

## Resumen de Cambios por Prioridad

### CRÍTICO (hacer PRIMERO)
| # | Cambio | Área |
|---|--------|------|
| 1.1 | Fix inyección PostgREST en búsqueda de PRMs | Backend Security |
| 1.2 | Cambiar DEBUG default a False + validación en startup | Backend Security |

### ALTO (hacer antes del MR)
| # | Cambio | Área |
|---|--------|------|
| 1.3 | Validación de input en modelos Pydantic | Backend Security |
| 1.4 | Rate limiting en endpoints públicos | Backend Security |
| 1.5 | Cachear rol de usuario en auth middleware | Backend Performance |
| 1.6 | CORS restrictivo en producción | Backend Security |
| 3.1 | Descomponer LandingPage.tsx | Frontend Components |
| 3.2 | Descomponer AuthCard.tsx | Frontend Components |
| 3.3 | Descomponer PrmDetail.tsx | Frontend Components |
| 3.4 | Descomponer NewBooking.tsx | Frontend Components |
| 3.5 | Descomponer Settings.tsx | Frontend Components |
| 3.6 | Descomponer Dashboard.tsx | Frontend Components |
| 4.1 | Eliminar duplicación de estado de usuario | Frontend State |
| 5.1 | Extraer useDebounce compartido + fix bug | Frontend Hooks |
| 5.2 | AbortController en AddressSelector | Frontend Hooks |
| 9.1 | Optimizar N+1 en endpoint de PRMs | Backend Performance |
| 10.1 | Agregar Error Boundary | Frontend Error Handling |
| 11.1 | Agregar ESLint + Prettier | Infra |
| 12.1 | Tests mínimos para endpoints críticos | Backend Testing |

### MEDIO
| # | Cambio | Área |
|---|--------|------|
| 1.7 | Error handling no exponga detalles internos | Backend Security |
| 1.8 | Structured logging para operaciones admin | Backend Security |
| 1.9 | Review sync como background job | Backend Performance |
| 2.1 | Refactorizar funciones largas en routers | Backend Architecture |
| 2.2 | Agregar docstrings a endpoints | Backend Docs |
| 2.3 | Pinear todas las dependencias | Backend Deps |
| 3.7 | Descomponer Prms.tsx | Frontend Components |
| 3.8 | Descomponer Addresses.tsx | Frontend Components |
| 3.9 | Extraer componentes reutilizables de UI | Frontend Components |
| 4.2 | Eliminar useAuthFormStore | Frontend State |
| 5.3 | AddressSelector use apiClient consistency | Frontend Hooks |
| 5.4 | Fix dependency array en PrmAddressPicker | Frontend Hooks |
| 6.1 | Establecer convención Tailwind vs CSS | Frontend Styling |
| 6.2 | Sistema de z-index | Frontend Styling |
| 7.1 | aria-labels en botones de ícono | Frontend A11y |
| 7.2 | Landmarks y heading hierarchy | Frontend A11y |
| 7.3 | CalendarWidget ARIA labels | Frontend A11y |
| 7.4 | Keyboard navigation en carousel | Frontend A11y |
| 8.1 | Migrar strings hardcodeados a i18n | Frontend i18n |
| 9.2 | Virtualización de listas (si aplica) | Frontend Performance |
| 9.3 | Lazy load de Swiper | Frontend Performance |
| 9.4 | Image lazy loading | Frontend Performance |
| 9.5 | Memoización en Settings | Frontend Performance |
| 10.2 | Mejorar manejo de errores de Supabase | Backend Error Handling |
| 11.2 | Pre-commit hooks | Infra |
| 11.3 | Ruff para linting Python | Infra |
| 12.2 | Tests mínimos para hooks frontend | Frontend Testing |

### BAJO
| # | Cambio | Área |
|---|--------|------|
| 6.3 | Eliminar inline styles | Frontend Styling |
| 9.6 | Cache KPIs endpoint | Backend Performance |
| 11.4 | GitHub Actions CI/CD | Infra |
| 11.5 | Dockerfiles | Infra |
| 13.1 | Eliminar @google/genai | Frontend Cleanup |
| 13.2 | Eliminar express | Frontend Cleanup |
| 13.3 | Eliminar dotenv | Frontend Cleanup |
| 13.4 | Renombrar package | Frontend Cleanup |
| 13.5 | TypeScript strict mode | Frontend Config |

---

> **Total de cambios identificados: 52**
> - Críticos: 2
> - Altos: 18
> - Medios: 24
> - Bajos: 8
