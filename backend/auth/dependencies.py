import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import get_settings, Settings

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

DEV_USER = {
    "sub": "dev-user-id",
    "email": "dev@salvida.com",
    "role": "superadmin",  # superadmin in dev mode so all features are accessible
    "demo_mode_active": False,
}


def _fetch_profile_fields(user_id: str) -> dict:
    """Fetch role and demo_mode_active from profiles once per request."""
    if not user_id:
        return {"role": "user", "demo_mode_active": False}
    try:
        from db.supabase_client import get_supabase
        supabase = get_supabase()
        result = (
            supabase.table("profiles")
            .select("role, demo_mode_active")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if result.data:
            return {
                "role": result.data.get("role", "user"),
                "demo_mode_active": result.data.get("demo_mode_active", False),
            }
        return {"role": "user", "demo_mode_active": False}
    except Exception as e:
        logger.warning("Could not fetch profile fields for user %s: %s", user_id, e)
        return {"role": "user", "demo_mode_active": False}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    settings: Settings = Depends(get_settings),
) -> dict:
    """
    Validates a Supabase JWT token from the Authorization header.
    Fetches the user role once and includes it in the returned dict,
    so routers never need an extra DB query for role checks.

    In DEBUG mode (DEBUG=true in .env), unauthenticated requests
    are allowed and a dummy dev user is returned.
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
            # In debug mode, skip signature verification so you don't need the
            # JWT secret locally. Claims are still parsed from the token.
            payload = jwt.get_unverified_claims(credentials.credentials)
        else:
            payload = jwt.decode(
                credentials.credentials,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )

        # Fetch role + demo_mode_active once per request — routers use is_admin(user)
        user_id = payload.get("sub", "")
        profile_fields = _fetch_profile_fields(user_id)
        return {**payload, **profile_fields}

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Convenience alias — use in all routers:
# async def my_route(user: dict = CurrentUser): ...
CurrentUser = Depends(get_current_user)
