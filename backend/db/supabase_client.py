from functools import lru_cache
from supabase import create_client, Client
import sys
import os

# Allow imports from parent directory when running directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import get_settings


@lru_cache
def get_supabase() -> Client:
    """
    Returns a Supabase client using the SERVICE ROLE KEY.
    The service role key bypasses RLS — auth is validated
    at the FastAPI layer via JWT before any DB operation.
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
