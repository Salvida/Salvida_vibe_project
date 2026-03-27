from fastapi import APIRouter, HTTPException, status, Depends
from postgrest import APIError as PostgrestAPIError
from db.supabase_client import get_supabase
from models.profile import UserProfile, ProfileUpdate
from auth.dependencies import get_current_user

router = APIRouter()


def _row_to_profile(row: dict) -> UserProfile:
    return UserProfile(
        id=row["id"],
        firstName=row.get("first_name"),
        lastName=row.get("last_name"),
        email=row.get("email"),
        phone=row.get("phone"),
        organization=row.get("organization"),
        dni=row.get("dni"),
        role=row.get("role", "staff"),
        avatar=row.get("avatar"),
    )


@router.get("", response_model=UserProfile)
async def get_profile(user: dict = Depends(get_current_user)):
    """Get the authenticated user's profile, creating it if it doesn't exist yet."""
    supabase = get_supabase()
    try:
        result = supabase.table("profiles").select("*").eq("id", user["sub"]).single().execute()
    except PostgrestAPIError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Profile not found: {e}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {type(e).__name__}: {e}")

    if result.data:
        return _row_to_profile(result.data)

    # First login — auto-create a bare profile from JWT claims
    new_row = {
        "id": user["sub"],
        "email": user.get("email", ""),
        "first_name": "",
        "last_name": "",
        "phone": "",
        "organization": "",
        "role": "staff",
    }
    created = supabase.table("profiles").insert(new_row).execute()
    if not created.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create profile")

    return _row_to_profile(created.data[0])


@router.put("", response_model=UserProfile)
async def update_profile(body: ProfileUpdate, user: dict = Depends(get_current_user)):
    """Update the authenticated user's profile."""
    supabase = get_supabase()

    # Map camelCase API fields → snake_case DB columns
    updates: dict = {}
    if body.firstName is not None:
        updates["first_name"] = body.firstName
    if body.lastName is not None:
        updates["last_name"] = body.lastName
    if body.email is not None:
        updates["email"] = body.email
    if body.phone is not None:
        updates["phone"] = body.phone
    if body.organization is not None:
        updates["organization"] = body.organization
    if body.dni is not None:
        updates["dni"] = body.dni
    if body.avatar is not None:
        updates["avatar"] = body.avatar

    if not updates:
        # Nothing to update — return current profile
        return await get_profile(user)

    try:
        result = (
            supabase.table("profiles")
            .update(updates)
            .eq("id", user["sub"])
            .single()
            .execute()
        )
    except PostgrestAPIError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return _row_to_profile(result.data)
