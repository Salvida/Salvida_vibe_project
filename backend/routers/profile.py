from fastapi import APIRouter, HTTPException, status, Depends
from postgrest import APIError as PostgrestAPIError
from db.supabase_client import get_supabase
from models.profile import (
    UserProfile,
    ProfileUpdate,
    NotificationPrefs,
    DemoModeUpdate,
    UserCreateRequest,
    UserDemoUpdate,
)
from auth.dependencies import get_current_user
from auth.roles import require_admin, require_superadmin

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
        role=row.get("role", "user"),
        avatar=row.get("avatar"),
        notification_prefs=prefs,
        isActive=row.get("is_active", True),
        demoModeActive=row.get("demo_mode_active", False),
        isDemo=row.get("is_demo", False),
    )


@router.get("/users", response_model=list[UserProfile])
async def get_users(user: dict = Depends(get_current_user)):
    """Get all profiles. Requires the caller to be an admin."""
    supabase = get_supabase()
    require_admin(user)
    demo_filter = user.get("demo_mode_active", False)
    result = supabase.table("profiles").select("*").eq("is_demo", demo_filter).execute()
    return [_row_to_profile(row) for row in result.data]


@router.post("/users", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
async def create_user(body: UserCreateRequest, user: dict = Depends(get_current_user)):
    """Create a new user (invite or direct). Requires admin. Superadmin-only for role != 'user' or is_demo."""
    require_admin(user)

    if body.role != "user":
        require_superadmin(user)
    if body.is_demo:
        require_superadmin(user)
    if body.method == "direct" and not body.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="password es requerido para el método 'direct'")

    supabase = get_supabase()

    try:
        if body.method == "invite":
            auth_response = supabase.auth.admin.invite_user_by_email(body.email)
        else:
            auth_response = supabase.auth.admin.create_user({
                "email": body.email,
                "password": body.password,
                "email_confirm": True,
            })
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    new_user_id = auth_response.user.id

    profile_row = {
        "id": new_user_id,
        "email": body.email,
        "first_name": body.firstName,
        "last_name": body.lastName,
        "phone": body.phone,
        "organization": body.organization,
        "role": body.role,
        "is_demo": body.is_demo,
    }

    # Upsert to safely handle any trigger-created stub row
    result = supabase.table("profiles").upsert(profile_row).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo crear el perfil")

    return _row_to_profile(result.data[0])


@router.get("", response_model=UserProfile)
async def get_profile(user: dict = Depends(get_current_user)):
    """Get the authenticated user's profile, creating or enriching it from user_metadata if needed."""
    supabase = get_supabase()
    try:
        result = supabase.table("profiles").select("*").eq("id", user["sub"]).execute()
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch profile")

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
        "role": "user",
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


@router.patch("/{user_id}/archive", response_model=UserProfile)
async def toggle_user_archive(user_id: str, user: dict = Depends(get_current_user)):
    """Toggle is_active for a user. Requires admin."""
    supabase = get_supabase()
    require_admin(user)

    result = supabase.table("profiles").select("is_active").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    current_active = result.data.get("is_active", True)
    updated = (
        supabase.table("profiles")
        .update({"is_active": not current_active})
        .eq("id", user_id)
        .execute()
    )
    if not updated.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return _row_to_profile(updated.data[0])


@router.patch("/{user_id}/demo", response_model=UserProfile)
async def toggle_user_demo(user_id: str, body: UserDemoUpdate, user: dict = Depends(get_current_user)):
    """Toggle is_demo on a user and cascade to all their PRMs and bookings. Requires superadmin."""
    require_superadmin(user)
    supabase = get_supabase()

    result = (
        supabase.table("profiles")
        .update({"is_demo": body.is_demo})
        .eq("id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Cascade to all records owned by this user
    supabase.table("prms").update({"is_demo": body.is_demo}).eq("created_by", user_id).execute()
    supabase.table("bookings").update({"is_demo": body.is_demo}).eq("created_by", user_id).execute()

    return _row_to_profile(result.data[0])


@router.put("/{user_id}", response_model=UserProfile)
async def update_user_profile(user_id: str, body: ProfileUpdate, user: dict = Depends(get_current_user)):
    """Update any user's profile. Requires the caller to be an admin."""
    supabase = get_supabase()
    require_admin(user)

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
    if body.notification_prefs is not None:
        updates["notification_prefs"] = body.notification_prefs.model_dump()

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


@router.post("/demo-mode", response_model=UserProfile)
async def toggle_demo_mode(body: DemoModeUpdate, user: dict = Depends(get_current_user)):
    """Toggle demo mode for the calling superadmin. Requires superadmin role."""
    supabase = get_supabase()
    require_superadmin(user)

    result = (
        supabase.table("profiles")
        .update({"demo_mode_active": body.active})
        .eq("id", user["sub"])
        .execute()
    )
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
