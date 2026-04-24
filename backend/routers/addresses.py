from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from db.supabase_client import get_supabase
from models.address import Address, AddressCreate, AddressUpdate, AddressValidationUpdate
from auth.dependencies import get_current_user
from auth.roles import is_admin, require_admin

router = APIRouter()


def _assert_address_access(address_id: str, user: dict, supabase) -> dict:
    """Fetches address row and asserts the caller owns it (or is admin).
    Returns the row data for reuse."""
    row = supabase.table("addresses").select("*").eq("id", address_id).single().execute()
    if not row.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    if not is_admin(user):
        if row.data.get("user_id") != user["sub"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return row.data


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


@router.get("", response_model=list[Address])
async def list_addresses(
    validation_status: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    require_admin(user)
    query = supabase.table("addresses").select("*").order("created_at", desc=True)
    if validation_status:
        query = query.eq("validation_status", validation_status)
    result = query.execute()
    return [_row_to_address(r) for r in (result.data or [])]


@router.get("/{address_id}", response_model=Address)
async def get_address(address_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    row = _assert_address_access(address_id, user, supabase)
    return _row_to_address(row)


@router.post("", response_model=Address, status_code=status.HTTP_201_CREATED)
async def create_address(body: AddressCreate, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    payload = body.model_dump()
    payload["user_id"] = user["sub"]
    result = supabase.table("addresses").insert(payload).single().execute()
    return _row_to_address(result.data)


@router.put("/{address_id}", response_model=Address)
async def update_address(
    address_id: str,
    body: AddressUpdate,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    _assert_address_access(address_id, user, supabase)
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        return await get_address(address_id, user)

    result = (
        supabase.table("addresses")
        .update(updates)
        .eq("id", address_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return _row_to_address(result.data[0])


@router.patch("/{address_id}/validate", response_model=Address)
async def validate_address(
    address_id: str,
    body: AddressValidationUpdate,
    user: dict = Depends(get_current_user),
):
    """Update only the validation status and notes of an address."""
    supabase = get_supabase()
    require_admin(user)
    updates = {"validation_status": body.validation_status}
    if body.validation_notes is not None:
        updates["validation_notes"] = body.validation_notes

    result = (
        supabase.table("addresses")
        .update(updates)
        .eq("id", address_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return _row_to_address(result.data[0])


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(address_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    _assert_address_access(address_id, user, supabase)

    # Check no prms are linked to this address via prm_id
    linked = (
        supabase.table("addresses")
        .select("prm_id")
        .eq("id", address_id)
        .single()
        .execute()
    )
    if linked.data and linked.data.get("prm_id"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete address: it is linked to a PRM. Remove it from the PRM first.",
        )

    supabase.table("addresses").delete().eq("id", address_id).execute()
