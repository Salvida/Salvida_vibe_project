from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from db.supabase_client import get_supabase
from models.address import Address, AddressCreate, AddressUpdate, AddressValidationUpdate
from auth.dependencies import get_current_user

router = APIRouter()


def _row_to_address(row: dict) -> Address:
    return Address(
        id=str(row["id"]),
        full_address=row["full_address"],
        lat=row.get("lat"),
        lng=row.get("lng"),
        validation_status=row["validation_status"],
        validation_notes=row.get("validation_notes"),
        is_accessible=row.get("is_accessible", False),
    )


@router.get("", response_model=list[Address])
async def list_addresses(
    validation_status: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    query = supabase.table("addresses").select("*").order("created_at", desc=True)
    if validation_status:
        query = query.eq("validation_status", validation_status)
    result = query.execute()
    return [_row_to_address(r) for r in (result.data or [])]


@router.get("/{address_id}", response_model=Address)
async def get_address(address_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("addresses").select("*").eq("id", address_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return _row_to_address(result.data)


@router.post("", response_model=Address, status_code=status.HTTP_201_CREATED)
async def create_address(body: AddressCreate, user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    payload = body.model_dump()
    payload["created_by"] = user["sub"]
    result = supabase.table("addresses").insert(payload).single().execute()
    return _row_to_address(result.data)


@router.put("/{address_id}", response_model=Address)
async def update_address(
    address_id: str,
    body: AddressUpdate,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        return await get_address(address_id, user)

    result = (
        supabase.table("addresses")
        .update(updates)
        .eq("id", address_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return _row_to_address(result.data)


@router.patch("/{address_id}/validate", response_model=Address)
async def validate_address(
    address_id: str,
    body: AddressValidationUpdate,
    user: dict = Depends(get_current_user),
):
    """Update only the validation status and notes of an address."""
    supabase = get_supabase()
    updates = {"validation_status": body.validation_status}
    if body.validation_notes is not None:
        updates["validation_notes"] = body.validation_notes

    result = (
        supabase.table("addresses")
        .update(updates)
        .eq("id", address_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return _row_to_address(result.data)


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(address_id: str, user: dict = Depends(get_current_user)):
    supabase = get_supabase()

    # Check no prms are linked to this address
    prms = (
        supabase.table("prms")
        .select("id")
        .eq("address_id", address_id)
        .execute()
    )
    if prms.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete address: it is linked to one or more prms",
        )

    supabase.table("addresses").delete().eq("id", address_id).execute()
