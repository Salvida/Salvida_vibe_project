from fastapi import HTTPException, status


def get_user_role(user: dict) -> str:
    """Extract role from the pre-fetched user dict (set by get_current_user)."""
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
