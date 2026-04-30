import logging
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, jwk, JWTError
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import get_settings, Settings

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

_jwks_cache: dict | None = None


async def _get_public_key_for_token(token: str, supabase_url: str):
    """Fetch JWKS from Supabase and return the key matching the token's kid."""
    global _jwks_cache

    async def _fetch_jwks() -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{supabase_url}/auth/v1/.well-known/jwks.json")
            resp.raise_for_status()
            return resp.json()

    if _jwks_cache is None:
        _jwks_cache = await _fetch_jwks()

    header = jwt.get_unverified_header(token)
    kid = header.get("kid")

    def _find_key(keys: list) -> dict | None:
        return next((k for k in keys if k.get("kid") == kid), None)

    key_data = _find_key(_jwks_cache.get("keys", []))
    if key_data is None:
        # Kid not in cache — refresh once in case of key rotation
        _jwks_cache = await _fetch_jwks()
        key_data = _find_key(_jwks_cache.get("keys", []))

    if key_data is None:
        raise JWTError(f"No JWKS key found for kid={kid}")

    return jwk.construct(key_data)

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
            alg = jwt.get_unverified_header(credentials.credentials).get("alg", "ES256")
            if alg == "HS256":
                # Legacy tokens signed with the shared secret
                payload = jwt.decode(
                    credentials.credentials,
                    settings.supabase_jwt_secret,
                    algorithms=["HS256"],
                    options={"verify_aud": False},
                )
            else:
                # Current tokens signed with Supabase asymmetric key (ES256)
                public_key = await _get_public_key_for_token(
                    credentials.credentials, settings.supabase_url
                )
                payload = jwt.decode(
                    credentials.credentials,
                    public_key,
                    algorithms=["ES256"],
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
