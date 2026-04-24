# Salvida — Refactoring Integral

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolver los 50+ issues identificados en el code review de Fran + Alvaro, organizados en 6 commits atómicos de menor a mayor riesgo.

**Architecture:** Backend FastAPI + Supabase. Frontend React 19 + TanStack Query + Zustand + Vite. No hay tests aún — los cambios deben ser correctos por construcción ya que el proyecto aún no tiene test runner configurado.

**Tech Stack:** Python 3.12, FastAPI, Pydantic v2, Supabase SDK. TypeScript 5.8, React 19, TanStack Query v5, Zustand v5, react-toastify, Vite 6.

---

## Commit 1 — security-critical

Cambios que bloquean un incidente de seguridad si llegan a producción. Hacer primero, sin excepción.

### Task 1.1 — DEBUG=False como default

**Files:**
- Modify: `backend/config.py:12`
- Modify: `backend/main.py`

- [ ] **Cambiar DEBUG default a False en config.py**

```python
# backend/config.py — línea 12
debug: bool = False  # NUNCA True por default — activar solo en .env local
```

- [ ] **Agregar validación en startup en main.py**

```python
# backend/main.py — reemplazar el lifespan existente
import logging

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.debug:
        logger.warning("⚠️  DEBUG MODE ACTIVE — JWT signature verification is disabled. DO NOT use in production.")
    if not settings.debug and not settings.supabase_jwt_secret:
        raise RuntimeError(
            "FATAL: supabase_jwt_secret is required when debug=False. "
            "Set it in .env or set debug=True only for local development."
        )
    start_scheduler()
    yield
    stop_scheduler()
```

---

### Task 1.2 — Sanitizar parámetro q en búsqueda de PRMs (inyección PostgREST)

**Files:**
- Modify: `backend/routers/prms.py`

El parámetro `q` se interpola directamente en `.or_()` de PostgREST. Un atacante puede inyectar operadores adicionales. Línea actual (147): `query = query.or_(f"name.ilike.%{q}%,email.ilike.%{q}%,phone.ilike.%{q}%")`

- [ ] **Agregar función de sanitización y aplicarla en list_prms**

```python
# backend/routers/prms.py — agregar import al inicio
import re

# Agregar función antes de list_prms (línea ~124)
def _sanitize_search(value: str) -> str:
    """Strip PostgREST special characters to prevent filter injection."""
    return re.sub(r'[,.()\\/\'"]', '', value.strip())[:100]

# En list_prms, reemplazar línea 147:
# ANTES:
#     query = query.or_(f"name.ilike.%{q}%,email.ilike.%{q}%,phone.ilike.%{q}%")
# DESPUÉS:
    if q:
        safe_q = _sanitize_search(q)
        query = query.or_(
            f"name.ilike.%{safe_q}%,email.ilike.%{safe_q}%,phone.ilike.%{safe_q}%"
        )
```

---

### Task 1.3 — Eliminar GEMINI_API_KEY del bundle del cliente

**Files:**
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/package.json`

La clave está inyectada en el JS que se sirve al browser. Cualquier usuario puede extraerla.

- [ ] **Eliminar el bloque `define` de vite.config.ts**

```typescript
// frontend/vite.config.ts — eliminar las líneas 9-11:
// ELIMINAR:
//   define: {
//     'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
//   },

// El archivo quedará:
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-leaflet':  ['leaflet', 'react-leaflet'],
          'vendor-motion':   ['motion'],
          'vendor-tanstack': ['@tanstack/react-query'],
          'vendor-router':   ['react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
});
```

Nota: se elimina el `loadEnv` ya que no se usará más. También se simplifica la firma de `defineConfig`.

- [ ] **Eliminar `@google/genai` de package.json** (no se importa en ningún archivo)

```json
// frontend/package.json — eliminar estas líneas de "dependencies":
// "@google/genai": "^1.29.0",
// "express": "^4.21.2",
// "dotenv": "^17.2.3",
// "tailwind-merge": "^3.5.0",
// "@tailwindcss/vite": "^4.1.14",

// Y de "devDependencies":
// "@types/express": "^4.17.21",

// Renombrar "name":
// "name": "salvida-frontend",
```

---

### Task 1.4 — CORS restrictivo en producción

**Files:**
- Modify: `backend/config.py`
- Modify: `backend/main.py`

El CORS actual usa `allow_methods=["*"]` y `allow_headers=["*"]` siempre, incluso en producción.

- [ ] **Agregar `cors_origins` en config.py para producción** (ya existe el campo, solo hay que usar la lógica correcta)

```python
# backend/config.py — el campo cors_origins ya existe
# No hay que cambiar config.py, solo main.py
```

- [ ] **Actualizar middleware en main.py para ser estricto en producción**

```python
# backend/main.py — reemplazar el bloque app.add_middleware(CORSMiddleware, ...)

if settings.debug:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )
```

- [ ] **Commit**

```bash
git add backend/config.py backend/main.py backend/routers/prms.py frontend/vite.config.ts frontend/package.json
git commit -m "fix: security-critical — DEBUG default, PostgREST injection, GEMINI key exposure, CORS"
```

---

## Commit 2 — functional-bugs

Bugs funcionales activos que afectan el comportamiento del usuario en producción.

### Task 2.1 — Fix useDebounce en Prms.tsx

**Files:**
- Modify: `frontend/src/pages/Prms/Prms.tsx`
- Create: `frontend/src/hooks/useDebounce.ts`

La implementación actual usa `useState` como side effect. El debounce nunca funciona.

- [ ] **Crear hook compartido useDebounce.ts**

```typescript
// frontend/src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

- [ ] **Reemplazar el useDebounce local en Prms.tsx**

Eliminar las líneas 11-18 de `Prms.tsx`:
```typescript
// ELIMINAR:
// function useDebounce(value: string, delay: number) {
//   const [debounced, setDebounced] = useState(value);
//   useState(() => {
//     const timer = setTimeout(() => setDebounced(value), delay);
//     return () => clearTimeout(timer);
//   });
//   return debounced;
// }
```

Agregar el import al inicio del archivo:
```typescript
import { useDebounce } from '../../hooks/useDebounce';
```

- [ ] **Reemplazar el useDebounce local en AddressSelector.tsx (ya funciona pero duplica)**

En `frontend/src/components/AddressSelector.tsx`, líneas 31-38:
```typescript
// ELIMINAR la función local:
// function useDebounce<T>(value: T, delay: number): T { ... }
```

Agregar el import:
```typescript
import { useDebounce } from '../hooks/useDebounce';
```

---

### Task 2.2 — Fix catch vacío en NewBooking.tsx

**Files:**
- Modify: `frontend/src/pages/NewBooking/NewBooking.tsx`

El catch en `handleSubmit` (líneas 77-79) silencia todos los errores. El caso crítico: `addPrmAddress` guarda una dirección pero `createBooking` falla — el usuario no sabe qué pasó y la dirección queda huérfana.

- [ ] **Reemplazar el catch vacío con toast de error**

```typescript
// frontend/src/pages/NewBooking/NewBooking.tsx
// Agregar import al inicio:
import { toast } from 'react-toastify';

// Reemplazar líneas 77-79:
// ANTES:
//     } catch {
//       // error handled silently
//     }
// DESPUÉS:
    } catch {
      toast.error(t('booking.errorCreate'));
    }
```

Agregar la key al archivo de i18n:
```json
// frontend/src/i18n/es.json — dentro de "booking":
"errorCreate": "Error al crear la reserva. Inténtalo de nuevo."
```

Nota: `EditBooking.tsx` tiene `// error handled by mutation` — ese catch es correcto porque `useUpdateBooking` ya tiene `onError` con toast.

---

### Task 2.3 — Feedback en useDeleteBooking y emergency contacts

**Files:**
- Modify: `frontend/src/hooks/useBookings.ts`
- Modify: `frontend/src/hooks/usePrms.ts`

`useDeleteBooking` no tiene ni `onSuccess` ni `onError`. Las tres mutations de emergency contacts tampoco tienen feedback.

- [ ] **Agregar toasts a useDeleteBooking en useBookings.ts**

```typescript
// frontend/src/hooks/useBookings.ts — reemplazar useDeleteBooking (líneas 77-83):
export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/bookings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
      toast.success('Reserva eliminada correctamente');
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al eliminar la reserva')),
  });
}
```

- [ ] **Agregar toasts a las tres mutations de emergency contacts en usePrms.ts**

```typescript
// frontend/src/hooks/usePrms.ts

// useUpdateEmergencyContact (líneas 98-106):
export function useUpdateEmergencyContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ prmId, ecId, ...body }: UpdateEmergencyContactPayload) =>
      apiClient.patch<EmergencyContact>(`/api/prms/${prmId}/emergency-contacts/${ecId}`, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: prmKey(vars.prmId) });
      toast.success('Contacto de emergencia actualizado');
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al actualizar el contacto')),
  });
}

// useAddEmergencyContact (líneas 115-123):
export function useAddEmergencyContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ prmId, ...body }: AddEmergencyContactPayload) =>
      apiClient.post<EmergencyContact>(`/api/prms/${prmId}/emergency-contacts`, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: prmKey(vars.prmId) });
      toast.success('Contacto de emergencia agregado');
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al agregar el contacto')),
  });
}

// useDeleteEmergencyContact (líneas 125-133):
export function useDeleteEmergencyContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ prmId, ecId }: { prmId: string; ecId: string }) =>
      apiClient.delete<void>(`/api/prms/${prmId}/emergency-contacts/${ecId}`),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: prmKey(vars.prmId) });
      toast.success('Contacto de emergencia eliminado');
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al eliminar el contacto')),
  });
}
```

---

### Task 2.4 — Fix Fragment sin key en Addresses.tsx

**Files:**
- Modify: `frontend/src/pages/Addresses/Addresses.tsx`

La `key` está en el `<tr>` interior, no en el elemento raíz del array. React genera warnings y puede tener bugs de reconciliación.

- [ ] **Mover key al Fragment raíz (líneas 90-162)**

```tsx
// frontend/src/pages/Addresses/Addresses.tsx
// Reemplazar líneas 89-163:
{addresses.map((address) => (
  <React.Fragment key={address.id}>
    <tr className="addresses__row">
      {/* ... resto del contenido igual, quitar key={address.id} del <tr> ... */}
    </tr>
    {expandedId === address.id && address.lat && address.lng && (
      <tr className="addresses__map-row">
        {/* ... */}
      </tr>
    )}
  </React.Fragment>
))}
```

Agregar el import de React si no está:
```typescript
import React from 'react';
```

---

### Task 2.5 — AbortController en AddressSelector.tsx

**Files:**
- Modify: `frontend/src/components/AddressSelector.tsx`

El fetch a Geoapify no aborta si el componente se desmonta o si el query cambia rápido. Causa memory leaks y race conditions.

- [ ] **Agregar AbortController al useEffect del fetch (líneas 92-116)**

```typescript
// frontend/src/components/AddressSelector.tsx — reemplazar el useEffect del fetch:
useEffect(() => {
  if (selected || !debouncedQuery || debouncedQuery.length < 3) {
    setSuggestions([]);
    setNoResults(false);
    if (!selected) setOpen(false);
    return;
  }

  const controller = new AbortController();
  setLoading(true);

  fetch(
    `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(debouncedQuery)}&lang=es&filter=countrycode:es&limit=6&apiKey=${GEOAPIFY_KEY}`,
    { signal: controller.signal },
  )
    .then((r) => r.json())
    .then((data: { features?: GeoapifyFeature[] }) => {
      const items = data.features ?? [];
      setSuggestions(items);
      setNoResults(items.length === 0);
      setOpen(true);
    })
    .catch((err: unknown) => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setSuggestions([]);
      setNoResults(false);
    })
    .finally(() => setLoading(false));

  return () => controller.abort();
}, [debouncedQuery, selected]);
```

- [ ] **Commit**

```bash
git add frontend/src/hooks/useDebounce.ts frontend/src/pages/Prms/Prms.tsx frontend/src/components/AddressSelector.tsx frontend/src/pages/NewBooking/NewBooking.tsx frontend/src/hooks/useBookings.ts frontend/src/hooks/usePrms.ts frontend/src/pages/Addresses/Addresses.tsx frontend/src/i18n/es.json
git commit -m "fix: functional bugs — useDebounce, empty catch, missing toasts, Fragment key, AbortController"
```

---

## Commit 3 — state-architecture

Eliminar duplicación de estado de usuario y extraer `parseApiError` a `lib/api.ts`.

### Task 3.1 — Extraer parseApiError a lib/api.ts

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/hooks/useBookings.ts`
- Modify: `frontend/src/hooks/usePrms.ts`
- Modify: `frontend/src/hooks/useAddresses.ts`
- Modify: `frontend/src/hooks/useProfile.ts`

La misma función exacta está copiada en 4 hooks distintos.

- [ ] **Agregar parseApiError a lib/api.ts**

```typescript
// frontend/src/lib/api.ts — agregar al final del archivo:
export function parseApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    try {
      const parsed = JSON.parse(error.message);
      return parsed.detail ?? fallback;
    } catch {
      return error.message || fallback;
    }
  }
  return fallback;
}
```

- [ ] **Actualizar los 4 hooks para importar parseApiError desde lib/api.ts**

En cada uno de estos archivos:
- `frontend/src/hooks/useBookings.ts`
- `frontend/src/hooks/usePrms.ts`
- `frontend/src/hooks/useAddresses.ts`
- `frontend/src/hooks/useProfile.ts`

**Cambio en cada uno:**
1. Cambiar el import de `apiClient` para incluir `parseApiError`:
```typescript
import { apiClient, ApiError, parseApiError } from '../lib/api';
```

2. Eliminar la función `parseApiError` local (las ~10 líneas duplicadas en cada archivo).

Nota: en `useBookings.ts` y `useAddresses.ts` también se puede eliminar el import de `ApiError` si ya no se usa directamente.

---

### Task 3.2 — Eliminar useCurrentUserStore + useCurrentUser + useSyncCurrentUser

**Files:**
- Delete: `frontend/src/store/useCurrentUserStore.ts`
- Delete: `frontend/src/hooks/useCurrentUser.ts`
- Delete: `frontend/src/hooks/useSyncCurrentUser.ts`
- Modify: `frontend/src/store/useAuthStore.ts`
- Modify: any component that uses these

El perfil del usuario ya vive en React Query via `useProfile()` y en Zustand via `useAuthStore.user`. `useCurrentUserStore` + `useCurrentUser` + `useSyncCurrentUser` son un tercer y cuarto sistema paralelo para el mismo dato.

- [ ] **Identificar todos los consumidores**

Archivos que podrían usar estos hooks/store:
```bash
grep -r "useCurrentUser\|useCurrentUserStore\|useSyncCurrentUser" frontend/src --include="*.tsx" --include="*.ts" -l
```

- [ ] **Simplificar useAuthStore: eliminar el campo `user` y sus métodos**

El perfil debe venir solo de `useProfile()` (React Query). El store de auth solo guarda la sesión.

```typescript
// frontend/src/store/useAuthStore.ts — nuevo contenido:
import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthState {
  session: Session | null;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setInitialized: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isInitialized: false,
  setSession: (session) => set({ session }),
  setInitialized: () => set({ isInitialized: true }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
}));
```

- [ ] **Eliminar setUser + side effect de useProfile.ts**

```typescript
// frontend/src/hooks/useProfile.ts — useProfile sin side effect:
export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: PROFILE_KEY,
    queryFn: () => apiClient.get<UserProfile>('/api/profile'),
  });
}
```

Eliminar el import de `useAuthStore` de `useProfile.ts`.

- [ ] **Actualizar useUpdateProfile en useProfile.ts**

```typescript
// frontend/src/hooks/useProfile.ts — useUpdateProfile sin updateUser:
export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ targetUserId, ...body }: Partial<UserProfile> & { targetUserId?: string }) => {
      if (targetUserId) {
        return apiClient.put<UserProfile>(`/api/profile/${targetUserId}`, body);
      }
      return apiClient.put<UserProfile>('/api/profile', body);
    },
    onSuccess: (data, { targetUserId }) => {
      if (!targetUserId) {
        qc.setQueryData(PROFILE_KEY, data);
      } else {
        qc.invalidateQueries({ queryKey: USERS_KEY });
      }
      toast.success('Perfil actualizado correctamente');
    },
    onError: (error, { targetUserId }) => {
      if (!targetUserId) qc.invalidateQueries({ queryKey: PROFILE_KEY });
      toast.error(parseApiError(error, 'Error al actualizar el perfil'));
    },
  });
}
```

- [ ] **Buscar y reemplazar todos los usos de useCurrentUserStore/useCurrentUser en componentes**

En cualquier componente que use `useCurrentUserStore((s) => s.currentUser)` → reemplazar por `useProfile().data`.
En cualquier componente que use `useAuthStore((s) => s.user)` → reemplazar por `useProfile().data`.
En cualquier componente que use `useSyncCurrentUser()` → eliminar la llamada.

- [ ] **Eliminar los 3 archivos obsoletos**

```bash
rm frontend/src/store/useCurrentUserStore.ts
rm frontend/src/hooks/useCurrentUser.ts
rm frontend/src/hooks/useSyncCurrentUser.ts
```

---

### Task 3.3 — Fix UserSelector: eliminar import de Settings.css

**Files:**
- Modify: `frontend/src/components/UserSelector/UserSelector.tsx`
- Create: `frontend/src/components/UserSelector/UserSelector.css`

Un componente compartido no puede depender del CSS de una página específica.

- [ ] **Crear UserSelector.css con los estilos que necesita**

Los estilos `.settings-user-selector*` que usa `UserSelector.tsx` deben existir en `Settings.css`. Copiar solo las reglas que use el componente a un nuevo archivo:

```css
/* frontend/src/components/UserSelector/UserSelector.css */
/* Estilos del combobox de selección de usuario */
```

Revisar `Settings.css` para extraer las clases `.settings-user-selector*` al nuevo archivo.

- [ ] **Actualizar el import en UserSelector.tsx**

```typescript
// frontend/src/components/UserSelector/UserSelector.tsx — línea 4:
// ANTES: import '../../pages/Settings/Settings.css';
// DESPUÉS:
import './UserSelector.css';
```

- [ ] **Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/hooks/useBookings.ts frontend/src/hooks/usePrms.ts frontend/src/hooks/useAddresses.ts frontend/src/hooks/useProfile.ts frontend/src/store/useAuthStore.ts frontend/src/store/useCurrentUserStore.ts frontend/src/hooks/useCurrentUser.ts frontend/src/hooks/useSyncCurrentUser.ts frontend/src/components/UserSelector/UserSelector.tsx frontend/src/components/UserSelector/UserSelector.css
git commit -m "refactor: extract parseApiError, unify user state to useProfile(), fix UserSelector CSS isolation"
```

---

## Commit 4 — backend-security-high

Fixes de seguridad del backend que no son críticos pero deben resolverse antes del MR.

### Task 4.1 — Cachear rol de usuario en get_current_user (N+1)

**Files:**
- Modify: `backend/auth/dependencies.py`
- Modify: `backend/auth/roles.py`
- Modify: `backend/routers/prms.py`
- Modify: `backend/routers/addresses.py`
- Modify: `backend/routers/bookings.py`
- Modify: `backend/routers/profile.py`
- Modify: `backend/routers/reviews.py`

Actualmente cada llamada a `is_admin(user["sub"])` hace un query extra a Supabase. `get_current_user` ya valida el JWT — puede fetchear el rol de una vez y devolverlo en el dict.

- [ ] **Actualizar get_current_user para incluir el rol**

```python
# backend/auth/dependencies.py

# Agregar import
from db.supabase_client import get_supabase

# Reemplazar el return al final de get_current_user:
# ANTES: return payload
# DESPUÉS: incluir rol en el payload
async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    settings: Settings = Depends(get_settings),
) -> dict:
    """
    Validates a Supabase JWT token from the Authorization header.

    In DEBUG mode (DEBUG=true in .env), unauthenticated requests
    are allowed and a dummy dev user is returned. This lets you
    test the API without a Supabase Auth session.
    """
    if credentials is None:
        if settings.debug:
            return DEV_USER
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        if settings.debug:
            payload = jwt.get_unverified_claims(credentials.credentials)
        else:
            payload = jwt.decode(
                credentials.credentials,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )

        # Fetch role once per request and attach to payload
        user_id = payload.get("sub", "")
        role = _fetch_role_safe(user_id)
        return {**payload, "role": role}

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def _fetch_role_safe(user_id: str) -> str:
    """Fetch user role from profiles table. Returns 'user' on any error."""
    if not user_id:
        return "user"
    try:
        supabase = get_supabase()
        result = (
            supabase.table("profiles")
            .select("role")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return result.data.get("role", "user") if result.data else "user"
    except Exception:
        return "user"
```

- [ ] **Actualizar roles.py para usar el campo role del dict**

```python
# backend/auth/roles.py — reemplazar todo el archivo:
from fastapi import HTTPException, status


def get_user_role(user: dict) -> str:
    """Extract role from the pre-fetched user dict."""
    return user.get("role", "user")


def require_admin(user: dict) -> None:
    """Raises HTTP 403 if the user is not an admin."""
    if get_user_role(user) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


def is_admin(user: dict) -> bool:
    """Returns True if the user has the admin role."""
    return get_user_role(user) == "admin"
```

- [ ] **Actualizar todos los routers: cambiar is_admin(user["sub"]) → is_admin(user)**

En `backend/routers/prms.py`:
- `_assert_prm_access(prm_id, user_sub, supabase)` — la firma interna usa `user_sub: str`. Cambiar a `user: dict` y pasar el dict completo, o pasar `user["sub"]` según convenga.
- Línea 139: `if not is_admin(user["sub"]):` → `if not is_admin(user):`
- Línea 205: `caller_is_admin = is_admin(user["sub"])` → `caller_is_admin = is_admin(user)`
- `_assert_prm_access` en línea 88: `if is_admin(user_sub):` — cambiar firma para aceptar el dict

En `backend/routers/addresses.py`, `bookings.py`, `profile.py`, `reviews.py`:
- Buscar todas las llamadas a `is_admin(user["sub"])` y `require_admin(user["sub"])` → cambiar a `is_admin(user)` y `require_admin(user)`

---

### Task 4.2 — Validación de input en modelos Pydantic

**Files:**
- Modify: `backend/models/booking.py`
- Modify: `backend/models/address.py`
- Modify: `backend/models/prm.py`

Los modelos aceptan cualquier string para fechas, horas, coordenadas, etc.

- [ ] **Agregar validators en booking.py**

```python
# backend/models/booking.py — agregar imports y validators en BookingBase:
from pydantic import BaseModel, field_validator, model_validator
from typing import Literal, Optional
from datetime import datetime

class BookingBase(BaseModel):
    prmId: str
    startTime: str
    endTime: str
    date: str
    address: str = ""
    service_reason: Optional[ServiceReason] = None
    service_reason_notes: Optional[str] = None

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
    def validate_time_order(self) -> "BookingBase":
        if self.startTime and self.endTime and self.startTime > self.endTime:
            raise ValueError("startTime must be before or equal to endTime")
        return self
```

- [ ] **Agregar validators en address.py**

```python
# backend/models/address.py — agregar en AddressBase:
from pydantic import BaseModel, field_validator
from typing import Literal, Optional

class AddressBase(BaseModel):
    full_address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    validation_status: AddressValidationStatus = "pending"
    validation_notes: Optional[str] = None
    is_accessible: bool = False
    alias: str = ""
    prm_id: Optional[str] = None

    @field_validator("full_address")
    @classmethod
    def validate_address_length(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5 or len(v) > 500:
            raise ValueError("full_address must be between 5 and 500 characters")
        return v

    @field_validator("lat")
    @classmethod
    def validate_latitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (-90 <= v <= 90):
            raise ValueError("lat must be between -90 and 90")
        return v

    @field_validator("lng")
    @classmethod
    def validate_longitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (-180 <= v <= 180):
            raise ValueError("lng must be between -180 and 180")
        return v
```

- [ ] **Agregar validators en prm.py**

```python
# backend/models/prm.py — agregar en PrmBase:
from pydantic import BaseModel, field_validator
from typing import Literal, Optional
from datetime import datetime

class PrmBase(BaseModel):
    # ...campos existentes...

    @field_validator("birthDate")
    @classmethod
    def validate_birth_date(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            parsed = datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("birthDate must be YYYY-MM-DD format")
        if parsed > datetime.now():
            raise ValueError("birthDate cannot be in the future")
        return v

    @field_validator("height", "weight")
    @classmethod
    def validate_positive_number(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("must be a positive number")
        return v
```

---

### Task 4.3 — Error handling no expone internos + reviews como background task

**Files:**
- Modify: `backend/routers/reviews.py`
- Modify: `backend/routers/profile.py`
- Modify: `backend/routers/addresses.py`
- Modify: `backend/routers/bookings.py`
- Modify: `backend/routers/prms.py`

- [ ] **Convertir sync de reviews a background task**

```python
# backend/routers/reviews.py — reemplazar get_reviews:
from fastapi import APIRouter, Depends, status, BackgroundTasks

@router.get("", response_model=list[Review])
async def get_reviews(background_tasks: BackgroundTasks):
    """
    Returns cached reviews from DB. If the DB is empty, triggers a background
    sync from Google Places (returns empty list immediately).
    """
    supabase = get_supabase()
    try:
        result = (
            supabase.table("reviews")
            .select("*")
            .order("published_at", desc=True)
            .limit(6)
            .execute()
        )
        rows = result.data or []

        if not rows:
            background_tasks.add_task(sync_google_reviews)
            return []

        return _rows_to_reviews(rows)
    except Exception as exc:
        logger.error("Failed to fetch reviews: %s", exc)
        return []
```

- [ ] **Patrón de error handling genérico en todos los routers**

En cada router, reemplazar bloques `except Exception as e: raise HTTPException(detail=f"{type(e).__name__}: {e}")` por:

```python
except Exception as e:
    logger.error("Unexpected error in <endpoint_name>: %s", e, exc_info=True)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not process request",
    )
```

Revisar routers: `profile.py`, `addresses.py`, `bookings.py`, `prms.py` para catches que expongan `type(e).__name__`.

- [ ] **Commit**

```bash
git add backend/auth/dependencies.py backend/auth/roles.py backend/models/booking.py backend/models/address.py backend/models/prm.py backend/routers/prms.py backend/routers/addresses.py backend/routers/bookings.py backend/routers/profile.py backend/routers/reviews.py
git commit -m "refactor(backend): role caching in auth, Pydantic validators, safe error handling, reviews as background task"
```

---

## Commit 5 — cleanup

Eliminar deuda técnica acumulada sin riesgo de romper funcionalidad.

### Task 5.1 — Eliminar useAuthFormStore.ts

**Files:**
- Check: `frontend/src/components/AuthCard/AuthCard.tsx`
- Delete: `frontend/src/store/useAuthFormStore.ts`

Verificar si AuthCard.tsx usa el store. Si lo usa, migrar el estado a useState local dentro del componente.

- [ ] **Verificar uso en AuthCard**

```bash
grep -r "useAuthFormStore" frontend/src --include="*.tsx" --include="*.ts"
```

- [ ] **Si AuthCard usa el store: migrar a useState local**

El estado de un formulario de login no necesita vivir en Zustand global. Mover cada campo a `useState` dentro del componente.

- [ ] **Eliminar el archivo si ya no tiene consumidores**

---

### Task 5.2 — Cleanup de package.json

**Files:**
- Modify: `frontend/package.json`

(Completar lo iniciado en Task 1.3 — desinstalar los paquetes eliminados)

```bash
cd frontend && npm uninstall @google/genai express dotenv tailwind-merge @tailwindcss/vite @types/express
```

---

### Task 5.3 — Renombrar variable VITE_HERE_API_KEY

**Files:**
- Modify: `frontend/src/components/AddressSelector.tsx`

```typescript
// AddressSelector.tsx línea 15:
// ANTES: const GEOAPIFY_KEY = import.meta.env.VITE_HERE_API_KEY as string;
// DESPUÉS:
const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY as string;
```

Nota: Recordar actualizar el `.env` local para renombrar la variable.

---

### Task 5.4 — Sistema de z-index en CSS variables

**Files:**
- Modify: `frontend/src/index.css`

```css
/* frontend/src/index.css — agregar en :root: */
--z-dropdown: 100;
--z-sticky: 200;
--z-overlay: 300;
--z-modal: 400;
--z-toast: 500;
```

Buscar y reemplazar z-index hardcodeados:
- `ConfirmDialog` usa `z-index: 200` → `var(--z-sticky)`
- `AddressSelector` usa `z-index: 100` → `var(--z-dropdown)`
- `DropdownMenu` usa `z-index: 50` → ajustar

- [ ] **Commit**

```bash
git add frontend/src/store/useAuthFormStore.ts frontend/src/components/AuthCard/AuthCard.tsx frontend/src/components/AddressSelector.tsx frontend/src/index.css frontend/package.json
git commit -m "chore: remove dead stores, cleanup dependencies, z-index tokens, fix GEOAPIFY env var name"
```

---

## Commit 6 — componentization

Descomponer los 6 componentes gigantes. Este es el commit más grande y de más riesgo. Hacer ÚLTIMO, cuando los 5 anteriores estén en el MR.

### Scope

| Archivo actual | Líneas | Componentes a extraer |
|---|---|---|
| `LandingPage.tsx` | ~700 | HeroSection, StatsSection, VideoSection, TestimonialsSection, SocialFooter, QuotePopup, useScrollSpy |
| `PrmDetail.tsx` | ~700 | PrmProfileCard, PrmEditForm, EmergencyContactList, AvatarUpload, usePrmDetail |
| `AuthCard.tsx` | ~328 | LoginForm, RegisterForm, useAuthForm |
| `NewBooking.tsx` | ~320 | Contiene stepper ya estructurado, extraer UserSelectorStep |
| `Settings.tsx` | ~500 | ProfileSettings, NotificationSettings |
| `Dashboard.tsx` | ~250 | BookingCard, BookingList |

### Regla de oro

Cada componente extraído debe:
1. Recibir sus datos como props (no fetchear directamente a menos que sea un "smart" container)
2. Tener su propio archivo CSS si tiene estilos específicos
3. Seguir el patrón existente: `ComponentName/ComponentName.tsx` + `ComponentName/ComponentName.css`

**Nota:** La componentización del LandingPage, PrmDetail, AuthCard, Settings, Dashboard requiere cada uno su propia sesión de trabajo dado el tamaño. Crear un issue por componente antes de ejecutar.

- [ ] **Commit por cada componente descompuesto** (no un commit gigante)

```bash
git commit -m "refactor(frontend): decompose LandingPage into sub-components"
git commit -m "refactor(frontend): decompose PrmDetail into sub-components"
# etc.
```

---

## Notas de ejecución

1. Los commits 1-5 se pueden hacer en orden en la misma rama `refactor/34-gentle-ai-findings`.
2. El commit 6 (componentización) es el más arriesgado — preferible hacer en sub-ramas feature si se trabaja en equipo.
3. No hay tests que ejecutar actualmente. Verificar manualmente que la app compila (`npm run lint` en frontend, `python -c "from main import app"` en backend).
4. La variable `VITE_HERE_API_KEY` en el `.env` local debe renombrarse a `VITE_GEOAPIFY_API_KEY` antes de correr la app tras el commit 5.
