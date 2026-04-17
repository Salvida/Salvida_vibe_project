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
    "role": "admin",  # admin in dev mode so all features are accessible
}


def _fetch_role_safe(user_id: str) -> str:
    """Fetch user role from profiles table once per request. Returns 'user' on any error."""
    if not user_id:
        return "user"
    try:
        from db.supabase_client import get_supabase
        supabase = get_supabase()
        result = (
            supabase.table("profiles")
            .select("role")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return result.data.get("role", "user") if result.data else "user"
    except Exception as e:
        logger.warning("Could not fetch role for user %s: %s", user_id, e)
        return "user"


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

        # Fetch role once per request and attach — routers use is_admin(user)
        user_id = payload.get("sub", "")
        role = _fetch_role_safe(user_id)
        return {**payload, "role": role}

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Convenience alias — use in all routers:
# async def my_route(user: dict = CurrentUser): ...
CurrentUser = Depends(get_current_user)
