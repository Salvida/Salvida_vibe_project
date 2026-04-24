from fastapi import HTTPException, status

_ADMIN_ROLES = {"admin", "superadmin"}


def get_user_role(user: dict) -> str:
    """Extract role from the pre-fetched user dict (set by get_current_user)."""
    return user.get("role", "user")


def is_admin(user: dict) -> bool:
    """Returns True if the user has admin or superadmin role."""
    return get_user_role(user) in _ADMIN_ROLES


def require_admin(user: dict) -> None:
    """Raises HTTP 403 if the user is not an admin or superadmin."""
    if not is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


def is_superadmin(user: dict) -> bool:
    """Returns True if the user has the superadmin role."""
    return get_user_role(user) == "superadmin"


def require_superadmin(user: dict) -> None:
    """Raises HTTP 403 if the user is not a superadmin."""
    if not is_superadmin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required",
        )
