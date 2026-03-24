from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from routers import profile, addresses, patients, bookings

settings = get_settings()

app = FastAPI(
    title="Salvida Management Portal API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router,   prefix="/api/profile",   tags=["profile"])
app.include_router(addresses.router, prefix="/api/addresses", tags=["addresses"])
app.include_router(patients.router,  prefix="/api/patients",  tags=["patients"])
app.include_router(bookings.router,  prefix="/api/bookings",  tags=["bookings"])


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": "salvida-api"}
