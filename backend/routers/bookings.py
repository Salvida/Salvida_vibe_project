from fastapi import APIRouter, BackgroundTasks, HTTPException, status, Depends, Query
from typing import Optional
from db.supabase_client import get_supabase
from models.booking import (
    Booking, BookingCreate, BookingUpdate,
    BookingStatusUpdate, BookingCancel,
)
from auth.dependencies import get_current_user
from services.notifications import send_push_to_user

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


def _row_to_booking(row: dict, prm_name: str = "", prm_avatar: Optional[str] = None) -> Booking:
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
        urgency=row.get("urgency", "routine"),
        is_demo=row.get("is_demo", False),
    )


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
    query = (
        supabase.table("bookings")
        .select("*, prms(name, avatar)")
        .order("start_time")
    )

    if date:
        query = query.eq("date", date)
    if booking_status:
        query = query.eq("status", booking_status)
    if prm_id:
        query = query.eq("prm_id", prm_id)

    query = query.range(offset, offset + limit - 1)
    result = query.execute()

    bookings = []
    for row in (result.data or []):
        prm = row.get("prms") or {}
        bookings.append(_row_to_booking(row, prm.get("name", ""), prm.get("avatar")))

    return bookings


# ---------------------------------------------------------------------------
# GET /api/bookings/{id}
# ---------------------------------------------------------------------------
@router.get("/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    return _fetch_full_booking(booking_id, supabase)


# ---------------------------------------------------------------------------
# POST /api/bookings
# ---------------------------------------------------------------------------
@router.post("", response_model=Booking, status_code=status.HTTP_201_CREATED)
async def create_booking(body: BookingCreate, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    supabase = get_supabase()

    # Validate prm exists
    try:
        prm_res = supabase.table("prms").select("id, name, avatar").eq("id", body.prmId).single().execute()
        if not prm_res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prm not found")
        prm_data = prm_res.data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prm not found")

    payload = {
        "prm_id": body.prmId,
        "start_time": body.startTime,
        "end_time": body.endTime,
        "date": body.date,
        "address": body.address,
        "service_reason": body.service_reason,
        "service_reason_notes": body.service_reason_notes,
        "urgency": body.urgency,
        "user_id": user["sub"],
        "created_by": user["sub"],
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

    field_map = {
        "startTime": "start_time",
        "endTime": "end_time",
        "date": "date",
        "address": "address",
        "status": "status",
        "service_reason": "service_reason",
        "service_reason_notes": "service_reason_notes",
        "urgency": "urgency",
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
    supabase.table("bookings").update({"status": body.status}).eq("id", booking_id).execute()
    booking = _fetch_full_booking(booking_id, supabase)
    background_tasks.add_task(
        _push_booking_update,
        user["sub"],
        "Estado de reserva actualizado",
        f"La reserva para {booking.prmName} ahora está {body.status}.",
    )
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
    supabase.table("bookings").delete().eq("id", booking_id).execute()


@router.post("/{booking_id}/cancel", response_model=Booking)
async def cancel_booking(
    booking_id: str,
    body: BookingCancel,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    updates: dict = {"status": "Cancelled"}
    if body.reason:
        updates["service_reason_notes"] = body.reason

    supabase.table("bookings").update(updates).eq("id", booking_id).execute()
    return _fetch_full_booking(booking_id, supabase)
