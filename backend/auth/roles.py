from fastapi import HTTPException, status
from db.supabase_client import get_supabase


def get_user_role(user_id: str) -> str:
    """
    Fetch the role for a given user ID from the profiles table.
    Returns the role string (e.g. 'admin', 'user').
    Raises HTTP 403 if the profile cannot be found.
    """
    supabase = get_supabase()
    result = (
        supabase.table("profiles")
        .select("role")
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User profile not found",
        )
    return result.data.get("role", "user")


def require_admin(user_id: str) -> None:
    """Raises HTTP 403 if the user is not an admin."""
    if get_user_role(user_id) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


def is_admin(user_id: str) -> bool:
    """Returns True if the user has the admin role."""
    return get_user_role(user_id) == "admin"
