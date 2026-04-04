from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from db.supabase_client import get_supabase
from models.prm import (
    Prm, PrmListItem, PrmCreate, PrmUpdate,
    EmergencyContact, EmergencyContactCreate, EmergencyContactUpdate,
)
from models.address import Address, PrmAddressCreate
from auth.dependencies import get_current_user
from auth.roles import is_admin

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
        created_by=row.get("created_by"),
    )


def _row_to_address(row: dict) -> Address:
    return Address(
        id=str(row["id"]),
        full_address=row["full_address"],
        lat=row.get("lat"),
        lng=row.get("lng"),
        validation_status=row.get("validation_status", "pending"),
        validation_notes=row.get("validation_notes"),
        is_accessible=row.get("is_accessible", False),
        alias=row.get("alias", ""),
        prm_id=row.get("prm_id"),
        user_id=row.get("user_id"),
        created_by=row.get("created_by"),
    )


def _fetch_prm_addresses(prm_id: str, supabase) -> list[Address]:
    result = (
        supabase.table("addresses")
        .select("*")
        .eq("prm_id", prm_id)
        .order("created_at")
        .execute()
    )
    return [_row_to_address(r) for r in (result.data or [])]


def _row_to_prm(row: dict, addresses: list[Address], contacts: list[dict]) -> Prm:
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
        height=row.get("height"),
        weight=row.get("weight"),
        status=row.get("status", "Activo"),
        avatar=row.get("avatar"),
        dni=row.get("dni"),
        is_demo=row.get("is_demo", False),
        created_by=row.get("created_by"),
        addresses=addresses,
        emergency_contacts=emergency_contacts,
    )


def _assert_prm_access(prm_id: str, user_sub: str, supabase) -> None:
    """Raises 403 if a non-admin user tries to access a PRM they don't own."""
    if is_admin(user_sub):
        return
    row = supabase.table("prms").select("created_by").eq("id", prm_id).single().execute()
    if not row.data or row.data.get("created_by") != user_sub:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def _fetch_full_prm(prm_id: str, supabase) -> Prm:
    row = supabase.table("prms").select("*").eq("id", prm_id).single().execute()
    if not row.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prm not found")

    addresses = _fetch_prm_addresses(prm_id, supabase)

    contacts_result = (
        supabase.table("emergency_contacts")
        .select("*")
        .eq("prm_id", prm_id)
        .execute()
    )
    contacts = contacts_result.data or []

    return _row_to_prm(row.data, addresses, contacts)


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

    if not is_admin(user["sub"]):
        query = query.eq("created_by", user["sub"])

    if status:
        query = query.eq("status", status)
    if q:
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
    _assert_prm_access(prm_id, user["sub"], supabase)
    return _fetch_full_prm(prm_id, supabase)


# ---------------------------------------------------------------------------
# POST /api/prms
# ---------------------------------------------------------------------------
@router.post("", response_model=Prm, status_code=status.HTTP_201_CREATED)
async def create_prm(body: PrmCreate, user: dict = Depends(get_current_user)):
    supabase = get_supabase()

    prm_payload = {
        "name": body.name,
        "email": body.email or "",
        "phone": body.phone or "",
        "birth_date": body.birthDate or None,
        "blood_type": body.bloodType or "",
        "height": body.height,
        "weight": body.weight,
        "status": body.status,
        "avatar": body.avatar,
        "dni": body.dni,
        "is_demo": body.is_demo,
        "user_id": user["sub"],
        "created_by": user["sub"],
    }

    result = supabase.table("prms").insert(prm_payload).execute()
    prm_id = result.data[0]["id"]

    for ec in body.emergency_contacts:
        supabase.table("emergency_contacts").insert({
            "prm_id": prm_id,
            "name": ec.name,
            "phone": ec.phone,
            "relationship": ec.relationship or "",
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
    _assert_prm_access(prm_id, user["sub"], supabase)

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
    _assert_prm_access(prm_id, user["sub"], supabase)

    active = (
        supabase.table("bookings")
        .select("id")
        .eq("prm_id", prm_id)
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
# GET /api/prms/{id}/addresses
# ---------------------------------------------------------------------------
@router.get("/{prm_id}/addresses", response_model=list[Address])
async def list_prm_addresses(prm_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    _assert_prm_access(prm_id, user["sub"], supabase)
    return _fetch_prm_addresses(prm_id, supabase)


# ---------------------------------------------------------------------------
# POST /api/prms/{id}/addresses
# ---------------------------------------------------------------------------
@router.post("/{prm_id}/addresses", response_model=Address, status_code=status.HTTP_201_CREATED)
async def add_prm_address(
    prm_id: str,
    body: PrmAddressCreate,
    user: dict = Depends(get_current_user),
):
    """Create a new address linked to this PRM."""
    supabase = get_supabase()
    _assert_prm_access(prm_id, user["sub"], supabase)

    addr_payload = {
        "full_address": body.full_address,
        "lat": body.lat,
        "lng": body.lng,
        "is_accessible": body.is_accessible,
        "alias": body.alias,
        "prm_id": prm_id,
        "user_id": user["sub"],
        "validation_status": "pending",
    }
    result = supabase.table("addresses").insert(addr_payload).execute()
    return _row_to_address(result.data[0])


# ---------------------------------------------------------------------------
# DELETE /api/prms/{prm_id}/addresses/{address_id}
# ---------------------------------------------------------------------------
@router.delete("/{prm_id}/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prm_address(
    prm_id: str,
    address_id: str,
    user: dict = Depends(get_current_user),
):
    """Remove an address from a PRM (deletes the address record)."""
    supabase = get_supabase()
    _assert_prm_access(prm_id, user["sub"], supabase)
    supabase.table("addresses").delete().eq("id", address_id).eq("prm_id", prm_id).execute()


# ---------------------------------------------------------------------------
# POST /api/prms/{id}/address  (legacy — kept for backward compat)
# ---------------------------------------------------------------------------
@router.post("/{prm_id}/address", response_model=Address, status_code=status.HTTP_201_CREATED)
async def assign_address_legacy(
    prm_id: str,
    body: PrmAddressCreate,
    user: dict = Depends(get_current_user),
):
    return await add_prm_address(prm_id, body, user)


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
    _assert_prm_access(prm_id, user["sub"], supabase)
    result = supabase.table("emergency_contacts").insert({
        "prm_id": prm_id,
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
    _assert_prm_access(prm_id, user["sub"], supabase)
    supabase.table("emergency_contacts").delete().eq("id", ec_id).eq("prm_id", prm_id).execute()


# ---------------------------------------------------------------------------
# PATCH /api/prms/{id}/emergency-contacts/{ec_id}
# ---------------------------------------------------------------------------
@router.patch(
    "/{prm_id}/emergency-contacts/{ec_id}",
    response_model=EmergencyContact,
)
async def update_emergency_contact(
    prm_id: str,
    ec_id: str,
    body: EmergencyContactUpdate,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    _assert_prm_access(prm_id, user["sub"], supabase)
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    result = (
        supabase.table("emergency_contacts")
        .update(updates)
        .eq("id", ec_id)
        .eq("prm_id", prm_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    row = result.data[0]
    return EmergencyContact(id=str(row["id"]), name=row["name"], phone=row["phone"], relationship=row.get("relationship", ""))
