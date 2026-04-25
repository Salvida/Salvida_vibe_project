from fastapi import APIRouter, BackgroundTasks, HTTPException, status, Depends, Query
from typing import Optional
from db.supabase_client import get_supabase
from models.booking import (
    Booking, BookingCreate, BookingUpdate,
    BookingStatusUpdate, BookingCancel,
)
from auth.dependencies import get_current_user
from auth.roles import is_admin, require_admin
from services.notifications import send_push_to_user
from services.email import send_review_request
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def _push_booking_update(user_id: str, title: str, body: str) -> None:
    """
    Sends a push notification to *user_id* if their notification_prefs.push is true.
    Designed to run as a FastAPI BackgroundTask (fire-and-forget).
    """
    supabase = get_supabase()
    profile_res = supabase.table("profiles").select("notification_prefs").eq("id", user_id).single().execute()
    if not profile_res.data:
        return
    prefs = profile_res.data.get("notification_prefs") or {}
    if prefs.get("push", False):
        send_push_to_user(user_id, title, body)


def _row_to_booking(row: dict, prm_name: str = "", prm_avatar: Optional[str] = None, owner_name: Optional[str] = None) -> Booking:
    return Booking(
        id=str(row["id"]),
        prmId=row["prm_id"],
        prmName=prm_name,
        prmAvatar=prm_avatar,
        startTime=row.get("start_time", ""),
        endTime=row.get("end_time", ""),
        date=str(row["date"]),
        address=row.get("address", ""),
        status=row.get("status", "Pending"),
        service_reason=row.get("service_reason"),
        service_reason_notes=row.get("service_reason_notes"),
        is_demo=row.get("is_demo", False),
        created_by_admin=row.get("created_by_admin", False),
        owner_name=owner_name,
    )


def _assert_booking_access(booking_id: str, user: dict, supabase) -> None:
    """Raises 403 if a non-admin user tries to access a booking they don't own."""
    if is_admin(user):
        return
    row = supabase.table("bookings").select("created_by").eq("id", booking_id).single().execute()
    if not row.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if row.data.get("created_by") != user["sub"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def _fetch_full_booking(booking_id: str, supabase) -> Booking:
    result = (
        supabase.table("bookings")
        .select("*, prms(name, avatar)")
        .eq("id", booking_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    row = result.data
    prm = row.get("prms") or {}
    return _row_to_booking(row, prm.get("name", ""), prm.get("avatar"))


# ---------------------------------------------------------------------------
# GET /api/bookings
# ---------------------------------------------------------------------------
@router.get("", response_model=list[Booking])
async def list_bookings(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    booking_status: Optional[str] = Query(None, alias="status"),
    prm_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    demo_filter = user.get("demo_mode_active", False)
    query = (
        supabase.table("bookings")
        .select("*, prms(name, avatar)")
        .order("start_time")
        .eq("is_demo", demo_filter)
    )

    if not is_admin(user):
        query = query.eq("created_by", user["sub"])

    if date:
        query = query.eq("date", date)
    if booking_status:
        query = query.eq("status", booking_status)
    if prm_id:
        query = query.eq("prm_id", prm_id)

    query = query.range(offset, offset + limit - 1)
    result = query.execute()

    rows = result.data or []

    # Enrich with owner names for admins
    owner_map: dict = {}
    if is_admin(user):
        created_by_ids = list({r["created_by"] for r in rows if r.get("created_by")})
        if created_by_ids:
            profiles_res = supabase.table("profiles").select("id, first_name, last_name").in_("id", created_by_ids).execute()
            for p in (profiles_res.data or []):
                parts = [p.get("first_name") or "", p.get("last_name") or ""]
                name = " ".join(x for x in parts if x).strip()
                if name:
                    owner_map[p["id"]] = name

    bookings = []
    for row in rows:
        prm = row.get("prms") or {}
        owner_name = owner_map.get(row.get("created_by")) if owner_map else None
        bookings.append(_row_to_booking(row, prm.get("name", ""), prm.get("avatar"), owner_name))

    return bookings


# ---------------------------------------------------------------------------
# GET /api/bookings/{id}
# ---------------------------------------------------------------------------
@router.get("/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    _assert_booking_access(booking_id, user, supabase)
    return _fetch_full_booking(booking_id, supabase)


# ---------------------------------------------------------------------------
# POST /api/bookings
# ---------------------------------------------------------------------------
@router.post("", response_model=Booking, status_code=status.HTTP_201_CREATED)
async def create_booking(body: BookingCreate, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    supabase = get_supabase()

    # Validate prm exists and get owner
    try:
        prm_res = supabase.table("prms").select("id, name, avatar, created_by").eq("id", body.prmId).single().execute()
        if not prm_res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prm not found")
        prm_data = prm_res.data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prm not found")

    caller_is_admin = is_admin(user)
    # When an admin creates a booking, assign ownership to the PRM's owner
    owner_id = prm_data.get("created_by") or user["sub"]
    booking_owner = owner_id if caller_is_admin else user["sub"]

    # Inherit is_demo from the booking owner's profile
    owner_profile = supabase.table("profiles").select("is_demo").eq("id", booking_owner).single().execute()
    inherited_is_demo = owner_profile.data.get("is_demo", False) if owner_profile.data else False

    payload = {
        "prm_id": body.prmId,
        "start_time": body.startTime,
        "end_time": body.endTime,
        "date": body.date,
        "address": body.address,
        "service_reason": body.service_reason,
        "service_reason_notes": body.service_reason_notes,
        "user_id": booking_owner,
        "created_by": booking_owner,
        "created_by_admin": caller_is_admin,
        "is_demo": inherited_is_demo,
    }

    result = supabase.table("bookings").insert(payload).execute()
    booking = _row_to_booking(result.data[0], prm_data["name"], prm_data.get("avatar"))

    background_tasks.add_task(
        _push_booking_update,
        user["sub"],
        "Nueva reserva creada",
        f"Reserva para {prm_data['name']} el {body.date} a las {body.startTime}.",
    )
    return booking


# ---------------------------------------------------------------------------
# PUT /api/bookings/{id}
# ---------------------------------------------------------------------------
@router.put("/{booking_id}", response_model=Booking)
async def update_booking(
    booking_id: str,
    body: BookingUpdate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    _assert_booking_access(booking_id, user, supabase)

    field_map = {
        "startTime": "start_time",
        "endTime": "end_time",
        "date": "date",
        "address": "address",
        "status": "status",
        "service_reason": "service_reason",
        "service_reason_notes": "service_reason_notes",
    }

    raw = body.model_dump(exclude_unset=True)
    updates = {field_map.get(k, k): v for k, v in raw.items()}

    if updates:
        supabase.table("bookings").update(updates).eq("id", booking_id).execute()

    booking = _fetch_full_booking(booking_id, supabase)
    background_tasks.add_task(
        _push_booking_update,
        user["sub"],
        "Reserva actualizada",
        f"La reserva para {booking.prmName} ha sido modificada.",
    )
    return booking


# ---------------------------------------------------------------------------
# PATCH /api/bookings/{id}/status
# ---------------------------------------------------------------------------
@router.patch("/{booking_id}/status", response_model=Booking)
async def update_booking_status(
    booking_id: str,
    body: BookingStatusUpdate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    require_admin(user)
    supabase.table("bookings").update({"status": body.status}).eq("id", booking_id).execute()
    booking = _fetch_full_booking(booking_id, supabase)

    background_tasks.add_task(
        _push_booking_update,
        user["sub"],
        "Estado de reserva actualizado",
        f"La reserva para {booking.prmName} ahora está {body.status}.",
    )

    # Send review request email when a service is marked as completed
    if body.status == "Completed":
        try:
            owner_result = (
                supabase.table("bookings")
                .select("created_by")
                .eq("id", booking_id)
                .single()
                .execute()
            )
            owner_id = (owner_result.data or {}).get("created_by")
            if owner_id:
                profile_result = (
                    supabase.table("profiles")
                    .select("email, first_name")
                    .eq("id", owner_id)
                    .single()
                    .execute()
                )
                profile = profile_result.data or {}
                if profile.get("email"):
                    send_review_request(
                        to_email=profile["email"],
                        user_name=profile.get("first_name") or "usuario",
                        booking_date=booking.date,
                    )
        except Exception as exc:
            logger.error("Could not send review request email for booking %s: %s", booking_id, exc)

    return booking


# ---------------------------------------------------------------------------
# POST /api/bookings/{id}/cancel
# ---------------------------------------------------------------------------
@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_booking(
    booking_id: str,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    _assert_booking_access(booking_id, user, supabase)
    supabase.table("bookings").delete().eq("id", booking_id).execute()


@router.post("/{booking_id}/cancel", response_model=Booking)
async def cancel_booking(
    booking_id: str,
    body: BookingCancel,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    _assert_booking_access(booking_id, user, supabase)
    updates: dict = {"status": "Cancelled"}
    if body.reason:
        updates["service_reason_notes"] = body.reason

    supabase.table("bookings").update(updates).eq("id", booking_id).execute()
    return _fetch_full_booking(booking_id, supabase)
