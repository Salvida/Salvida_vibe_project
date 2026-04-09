from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from routers import profile, addresses, prms, bookings, global_kpis, social_links, reviews

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
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router,   prefix="/api/profile",   tags=["profile"])
app.include_router(addresses.router, prefix="/api/addresses", tags=["addresses"])
app.include_router(prms.router,  prefix="/api/prms",  tags=["prms"])
app.include_router(bookings.router,    prefix="/api/bookings",  tags=["bookings"])
app.include_router(global_kpis.router,   prefix="/globalKpis",     tags=["landing"])
app.include_router(social_links.router, prefix="/api/social-links", tags=["landing"])
app.include_router(reviews.router,      prefix="/api/reviews",      tags=["landing"])


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": "salvida-api"}
