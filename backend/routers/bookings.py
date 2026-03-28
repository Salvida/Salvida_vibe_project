from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from db.supabase_client import get_supabase
from models.booking import (
    Booking, BookingCreate, BookingUpdate,
    BookingStatusUpdate, BookingCancel,
)
from auth.dependencies import get_current_user

router = APIRouter()


def _row_to_booking(row: dict, patient_name: str = "", patient_avatar: Optional[str] = None) -> Booking:
    return Booking(
        id=str(row["id"]),
        patientId=row["patient_id"],
        patientName=patient_name,
        patientAvatar=patient_avatar,
        startTime=row.get("start_time", ""),
        endTime=row.get("end_time", ""),
        date=str(row["date"]),
        location=row.get("location", ""),
        destination=row.get("destination", ""),
        status=row.get("status", "Pending"),
        service_reason=row.get("service_reason"),
        service_reason_notes=row.get("service_reason_notes"),
        urgency=row.get("urgency", "routine"),
        is_demo=row.get("is_demo", False),
    )


def _fetch_full_booking(booking_id: str, supabase) -> Booking:
    result = (
        supabase.table("bookings")
        .select("*, patients(name, avatar)")
        .eq("id", booking_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    row = result.data
    patient = row.get("patients") or {}
    return _row_to_booking(row, patient.get("name", ""), patient.get("avatar"))


# ---------------------------------------------------------------------------
# GET /api/bookings
# ---------------------------------------------------------------------------
@router.get("", response_model=list[Booking])
async def list_bookings(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    booking_status: Optional[str] = Query(None, alias="status"),
    patient_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    query = (
        supabase.table("bookings")
        .select("*, patients(name, avatar)")
        .order("start_time")
    )

    if date:
        query = query.eq("date", date)
    if booking_status:
        query = query.eq("status", booking_status)
    if patient_id:
        query = query.eq("patient_id", patient_id)

    query = query.range(offset, offset + limit - 1)
    result = query.execute()

    bookings = []
    for row in (result.data or []):
        patient = row.get("patients") or {}
        bookings.append(_row_to_booking(row, patient.get("name", ""), patient.get("avatar")))

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
async def create_booking(body: BookingCreate, user: dict = Depends(get_current_user)):
    supabase = get_supabase()

    # Validate patient exists
    try:
        patient_res = supabase.table("patients").select("id, name, avatar").eq("id", body.patientId).single().execute()
        if not patient_res.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
        patient_data = patient_res.data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    payload = {
        "patient_id": body.patientId,
        "start_time": body.startTime,
        "end_time": body.endTime,
        "date": body.date,
        "location": body.location,
        "destination": body.destination,
        "service_reason": body.service_reason,
        "service_reason_notes": body.service_reason_notes,
        "urgency": body.urgency,
        "created_by": user["sub"],
    }

    result = supabase.table("bookings").insert(payload).single().execute()
    return _row_to_booking(result.data, patient_data["name"], patient_data.get("avatar"))


# ---------------------------------------------------------------------------
# PUT /api/bookings/{id}
# ---------------------------------------------------------------------------
@router.put("/{booking_id}", response_model=Booking)
async def update_booking(
    booking_id: str,
    body: BookingUpdate,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()

    field_map = {
        "startTime": "start_time",
        "endTime": "end_time",
        "date": "date",
        "location": "location",
        "destination": "destination",
        "status": "status",
        "service_reason": "service_reason",
        "service_reason_notes": "service_reason_notes",
        "urgency": "urgency",
    }

    raw = body.model_dump(exclude_unset=True)
    updates = {field_map.get(k, k): v for k, v in raw.items()}

    if updates:
        supabase.table("bookings").update(updates).eq("id", booking_id).execute()

    return _fetch_full_booking(booking_id, supabase)


# ---------------------------------------------------------------------------
# PATCH /api/bookings/{id}/status
# ---------------------------------------------------------------------------
@router.patch("/{booking_id}/status", response_model=Booking)
async def update_booking_status(
    booking_id: str,
    body: BookingStatusUpdate,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    supabase.table("bookings").update({"status": body.status}).eq("id", booking_id).execute()
    return _fetch_full_booking(booking_id, supabase)


# ---------------------------------------------------------------------------
# POST /api/bookings/{id}/cancel
# ---------------------------------------------------------------------------
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
