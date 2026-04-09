from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    # Required in production (debug=False). Found in Supabase Dashboard → Settings → API → JWT Secret
    supabase_jwt_secret: str = ""
    cors_origins: list[str] = ["http://localhost:3000"]
    debug: bool = True
    supabase_mcp_connection: str = ""

    # Email notifications (Resend)
    resend_api_key: str = ""
    email_from: str = "Salvida <hola@salvida.es>"

    # Web Push notifications (VAPID)
    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_subject: str = "mailto:hola@salvida.es"

    # Google Places API (for fetching public reviews)
    google_places_api_key: str = ""
    google_place_id: str = ""

    # Review request links shown in post-service emails
    facebook_review_url: str = "https://www.facebook.com/p/Salvida-61565788268475/reviews/"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
