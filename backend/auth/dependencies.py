from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import get_settings, Settings

security = HTTPBearer(auto_error=False)

DEV_USER = {
    "sub": "dev-user-id",
    "email": "dev@salvida.com",
    "role": "authenticated",
}


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
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Convenience alias — use in all routers:
# async def my_route(user: dict = CurrentUser): ...
CurrentUser = Depends(get_current_user)
