from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from db.supabase_client import get_supabase
from models.prm import (
    Prm, PrmListItem, PrmCreate, PrmUpdate,
    EmergencyContact, EmergencyContactCreate,
)
from models.address import Address, AddressCreate
from auth.dependencies import get_current_user

router = APIRouter()


def _row_to_list_item(row: dict) -> PrmListItem:
    return PrmListItem(
        id=row["id"],
        name=row["name"],
        email=row.get("email", ""),
        phone=row.get("phone", ""),
        status=row.get("status", "Activo"),
        avatar=row.get("avatar"),
        dni=row.get("dni"),
        is_demo=row.get("is_demo", False),
    )


def _row_to_prm(row: dict, address_row: Optional[dict], contacts: list[dict]) -> Prm:
    address = None
    if address_row:
        address = Address(
            id=str(address_row["id"]),
            full_address=address_row["full_address"],
            lat=address_row.get("lat"),
            lng=address_row.get("lng"),
            validation_status=address_row["validation_status"],
            validation_notes=address_row.get("validation_notes"),
            is_accessible=address_row.get("is_accessible", False),
        )

    emergency_contacts = [
        EmergencyContact(
            id=str(c["id"]),
            name=c["name"],
            phone=c["phone"],
            relationship=c.get("relationship", ""),
        )
        for c in contacts
    ]

    return Prm(
        id=row["id"],
        name=row["name"],
        email=row.get("email", ""),
        phone=row.get("phone", ""),
        birthDate=str(row["birth_date"]) if row.get("birth_date") else None,
        bloodType=row.get("blood_type", ""),
        height=row.get("height", ""),
        weight=row.get("weight", ""),
        status=row.get("status", "Activo"),
        avatar=row.get("avatar"),
        dni=row.get("dni"),
        is_demo=row.get("is_demo", False),
        address=address,
        emergency_contacts=emergency_contacts,
    )


def _fetch_full_prm(prm_id: str, supabase) -> Prm:
    row = supabase.table("prms").select("*").eq("id", prm_id).single().execute()
    if not row.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prm not found")

    address_row = None
    if row.data.get("address_id"):
        addr_result = (
            supabase.table("addresses")
            .select("*")
            .eq("id", row.data["address_id"])
            .single()
            .execute()
        )
        address_row = addr_result.data

    contacts_result = (
        supabase.table("emergency_contacts")
        .select("*")
        .eq("patient_id", prm_id)
        .execute()
    )
    contacts = contacts_result.data or []

    return _row_to_prm(row.data, address_row, contacts)


# ---------------------------------------------------------------------------
# GET /api/prms
# ---------------------------------------------------------------------------
@router.get("", response_model=list[PrmListItem])
async def list_prms(
    q: Optional[str] = Query(None, description="Search by name, email or phone"),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    query = supabase.table("prms").select("*").order("name")

    if status:
        query = query.eq("status", status)
    if q:
        # Supabase PostgREST text search across multiple columns
        query = query.or_(f"name.ilike.%{q}%,email.ilike.%{q}%,phone.ilike.%{q}%")

    query = query.range(offset, offset + limit - 1)
    result = query.execute()
    return [_row_to_list_item(r) for r in (result.data or [])]


# ---------------------------------------------------------------------------
# GET /api/prms/{id}
# ---------------------------------------------------------------------------
@router.get("/{prm_id}", response_model=Prm)
async def get_prm(prm_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    return _fetch_full_prm(prm_id, supabase)


# ---------------------------------------------------------------------------
# POST /api/prms
# ---------------------------------------------------------------------------
@router.post("", response_model=Prm, status_code=status.HTTP_201_CREATED)
async def create_prm(body: PrmCreate, user: dict = Depends(get_current_user)):
    supabase = get_supabase()

    prm_payload = {
        "name": body.name,
        "email": body.email,
        "phone": body.phone,
        "birth_date": body.birthDate,
        "blood_type": body.bloodType,
        "height": body.height,
        "weight": body.weight,
        "status": body.status,
        "avatar": body.avatar,
        "dni": body.dni,
        "is_demo": body.is_demo,
        "created_by": user["sub"],
    }

    result = supabase.table("prms").insert(prm_payload).single().execute()
    prm_id = result.data["id"]

    # Insert emergency contacts if provided
    for ec in body.emergency_contacts:
        supabase.table("emergency_contacts").insert({
            "patient_id": prm_id,
            "name": ec.name,
            "phone": ec.phone,
            "relationship": ec.relationship,
        }).execute()

    return _fetch_full_prm(prm_id, supabase)


# ---------------------------------------------------------------------------
# PUT /api/prms/{id}
# ---------------------------------------------------------------------------
@router.put("/{prm_id}", response_model=Prm)
async def update_prm(
    prm_id: str,
    body: PrmUpdate,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()

    # Map camelCase → snake_case for DB
    field_map = {
        "name": "name",
        "email": "email",
        "phone": "phone",
        "birthDate": "birth_date",
        "bloodType": "blood_type",
        "height": "height",
        "weight": "weight",
        "status": "status",
        "avatar": "avatar",
        "dni": "dni",
    }

    raw = body.model_dump(exclude_unset=True)
    updates = {field_map[k]: v for k, v in raw.items() if k in field_map}

    if updates:
        supabase.table("prms").update(updates).eq("id", prm_id).execute()

    return _fetch_full_prm(prm_id, supabase)


# ---------------------------------------------------------------------------
# DELETE /api/prms/{id}
# ---------------------------------------------------------------------------
@router.delete("/{prm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prm(prm_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()

    # Block deletion if prm has active bookings
    active = (
        supabase.table("bookings")
        .select("id")
        .eq("patient_id", prm_id)
        .in_("status", ["Approved", "Pending"])
        .execute()
    )
    if active.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete prm: has active bookings",
        )

    supabase.table("prms").delete().eq("id", prm_id).execute()


# ---------------------------------------------------------------------------
# POST /api/prms/{id}/address
# ---------------------------------------------------------------------------
@router.post("/{prm_id}/address", response_model=Prm)
async def assign_address(
    prm_id: str,
    body: AddressCreate,
    user: dict = Depends(get_current_user),
):
    """Create a new address and link it to this prm."""
    supabase = get_supabase()

    addr_payload = body.model_dump()
    addr_payload["created_by"] = user["sub"]
    addr_result = supabase.table("addresses").insert(addr_payload).execute()

    supabase.table("prms").update({"address_id": addr_result.data["id"]}).eq("id", prm_id).execute()

    return _fetch_full_prm(prm_id, supabase)


# ---------------------------------------------------------------------------
# POST /api/prms/{id}/emergency-contacts
# ---------------------------------------------------------------------------
@router.post(
    "/{prm_id}/emergency-contacts",
    response_model=EmergencyContact,
    status_code=status.HTTP_201_CREATED,
)
async def add_emergency_contact(
    prm_id: str,
    body: EmergencyContactCreate,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    result = supabase.table("emergency_contacts").insert({
        "patient_id": prm_id,
        "name": body.name,
        "phone": body.phone,
        "relationship": body.relationship,
    }).execute()

    row = result.data[0]
    return EmergencyContact(id=str(row["id"]), name=row["name"], phone=row["phone"], relationship=row["relationship"])


# ---------------------------------------------------------------------------
# DELETE /api/prms/{id}/emergency-contacts/{ec_id}
# ---------------------------------------------------------------------------
@router.delete(
    "/{prm_id}/emergency-contacts/{ec_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_emergency_contact(
    prm_id: str,
    ec_id: str,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    supabase.table("emergency_contacts").delete().eq("id", ec_id).eq("patient_id", prm_id).execute()
