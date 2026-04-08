from fastapi import APIRouter, HTTPException, status, Depends
from postgrest import APIError as PostgrestAPIError
from db.supabase_client import get_supabase
from models.profile import UserProfile, ProfileUpdate, NotificationPrefs
from auth.dependencies import get_current_user

router = APIRouter()


def _row_to_profile(row: dict) -> UserProfile:
    raw_prefs = row.get("notification_prefs") or {}
    if isinstance(raw_prefs, dict):
        prefs = NotificationPrefs(
            email=raw_prefs.get("email", False),
            push=raw_prefs.get("push", True),
            booking_reminder=raw_prefs.get("booking_reminder", True),
        )
    else:
        prefs = NotificationPrefs()

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
        notification_prefs=prefs,
    )


@router.get("/users", response_model=list[UserProfile])
async def get_users(user: dict = Depends(get_current_user)):
    """Get all non-admin profiles. Requires the caller to be an admin."""
    supabase = get_supabase()

    caller = supabase.table("profiles").select("role").eq("id", user["sub"]).single().execute()
    if not caller.data or caller.data.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    result = supabase.table("profiles").select("*").neq("role", "admin").execute()
    return [_row_to_profile(row) for row in result.data]


@router.get("", response_model=UserProfile)
async def get_profile(user: dict = Depends(get_current_user)):
    """Get the authenticated user's profile, creating or enriching it from user_metadata if needed."""
    supabase = get_supabase()
    try:
        result = supabase.table("profiles").select("*").eq("id", user["sub"]).execute()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {type(e).__name__}: {e}")

    # user_metadata is populated when options.data is passed to supabase.auth.signUp()
    user_meta = user.get("user_metadata", {})

    if result.data:
        profile = result.data[0]
        # Supabase triggers often create an empty profile row on signup.
        # Enrich any empty fields from user_metadata on first authenticated request.
        updates: dict = {}
        if not profile.get("first_name") and user_meta.get("first_name"):
            updates["first_name"] = user_meta["first_name"]
        if not profile.get("last_name") and user_meta.get("last_name"):
            updates["last_name"] = user_meta["last_name"]
        if not profile.get("phone") and user_meta.get("phone"):
            updates["phone"] = user_meta["phone"]
        if not profile.get("dni") and user_meta.get("dni"):
            updates["dni"] = user_meta["dni"]
        if not profile.get("email") and user.get("email"):
            updates["email"] = user["email"]
        if updates:
            supabase.table("profiles").update(updates).eq("id", user["sub"]).execute()
            profile.update(updates)
        return _row_to_profile(profile)

    # No profile row at all — create from JWT claims + user_metadata
    new_row = {
        "id": user["sub"],
        "email": user.get("email", ""),
        "first_name": user_meta.get("first_name", ""),
        "last_name": user_meta.get("last_name", ""),
        "phone": user_meta.get("phone", ""),
        "organization": "",
        "dni": user_meta.get("dni", ""),
        "role": "staff",
    }
    created = supabase.table("profiles").insert(new_row).execute()
    if not created.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create profile")

    return _row_to_profile(created.data[0])


@router.put("/notifications", response_model=UserProfile)
async def update_notification_prefs(body: NotificationPrefs, user: dict = Depends(get_current_user)):
    """Update the authenticated user's notification preferences."""
    supabase = get_supabase()

    prefs_dict = body.model_dump()

    try:
        result = (
            supabase.table("profiles")
            .update({"notification_prefs": prefs_dict})
            .eq("id", user["sub"])
            .execute()
        )
    except PostgrestAPIError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return _row_to_profile(result.data[0])


@router.put("/{user_id}", response_model=UserProfile)
async def update_user_profile(user_id: str, body: ProfileUpdate, user: dict = Depends(get_current_user)):
    """Update any user's profile. Requires the caller to be an admin."""
    supabase = get_supabase()

    caller = supabase.table("profiles").select("role").eq("id", user["sub"]).single().execute()
    if not caller.data or caller.data.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

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
        result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        return _row_to_profile(result.data)

    try:
        result = (
            supabase.table("profiles")
            .update(updates)
            .eq("id", user_id)
            .execute()
        )
    except PostgrestAPIError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return _row_to_profile(result.data[0])


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
    # Note: role is intentionally not included in user updates
    # Role can only be changed by database administrators

    if not updates:
        # Nothing to update — return current profile
        return await get_profile(user)

    try:
        result = (
            supabase.table("profiles")
            .update(updates)
            .eq("id", user["sub"])
            .execute()
        )
    except PostgrestAPIError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return _row_to_profile(result.data[0])
