from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from db.supabase_client import get_supabase
from models.address import Address, AddressCreate, AddressUpdate, AddressValidationUpdate, AddressValidationResponse
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


def _row_to_address(row: dict, prm_map: dict | None = None) -> Address:
    prm_info = (prm_map or {}).get(row.get("prm_id"), {})
    return Address(
        id=str(row["id"]),
        full_address=row["full_address"],
        lat=row.get("lat"),
        lng=row.get("lng"),
        validation_status=row.get("validation_status", "pending"),
        validation_notes=row.get("validation_notes"),
        is_accessible=row.get("is_accessible"),  # None = pending, True/False = assessed
        alias=row.get("alias", ""),
        prm_id=row.get("prm_id"),
        user_id=row.get("user_id"),
        created_by=row.get("created_by"),
        prm_name=prm_info.get("prm_name"),
        owner_name=prm_info.get("owner_name"),
    )


def _build_prm_map(supabase, rows: list[dict]) -> dict:
    """Batch-fetch PRM names and owner names for a list of address rows."""
    prm_ids = list({r["prm_id"] for r in rows if r.get("prm_id")})
    if not prm_ids:
        return {}

    prm_rows = (
        supabase.table("prms")
        .select("id, name, user_id")
        .in_("id", prm_ids)
        .execute()
        .data or []
    )

    owner_ids = list({p["user_id"] for p in prm_rows if p.get("user_id")})
    owner_map: dict = {}
    if owner_ids:
        profile_rows = (
            supabase.table("profiles")
            .select("id, first_name, last_name")
            .in_("id", owner_ids)
            .execute()
            .data or []
        )
        owner_map = {
            p["id"]: f"{p.get('first_name', '')} {p.get('last_name', '')}".strip()
            for p in profile_rows
        }

    return {
        p["id"]: {
            "prm_name": p["name"],
            "owner_name": owner_map.get(p.get("user_id", ""), None),
        }
        for p in prm_rows
    }


def _inherit_accessibility(supabase, lat: float, lng: float) -> bool | None:
    """Returns True if any validated (accessible) address exists at this lat/lng, else None."""
    result = (
        supabase.table("addresses")
        .select("is_accessible")
        .eq("lat", lat)
        .eq("lng", lng)
        .eq("is_accessible", True)
        .limit(1)
        .execute()
    )
    return True if result.data else None


@router.get("", response_model=list[Address])
async def list_addresses(
    accessibility: Optional[str] = Query(None),  # "pending" | "accessible" | "not_accessible"
    owner_id: Optional[List[str]] = Query(None),
    prm_id: Optional[List[str]] = Query(None),
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    require_admin(user)
    query = supabase.table("addresses").select("*").order("created_at", desc=True)
    if accessibility == "pending":
        query = query.is_("is_accessible", "null")
    elif accessibility == "accessible":
        query = query.eq("is_accessible", True)
    elif accessibility == "not_accessible":
        query = query.eq("is_accessible", False)
    if owner_id:
        query = query.in_("user_id", owner_id)
    if prm_id:
        query = query.in_("prm_id", prm_id)
    rows = query.execute().data or []
    prm_map = _build_prm_map(supabase, rows)
    return [_row_to_address(r, prm_map) for r in rows]


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

    # Inherit accessibility from an already-validated address at the same lat/lng
    if payload.get("lat") is not None and payload.get("lng") is not None:
        inherited = _inherit_accessibility(supabase, payload["lat"], payload["lng"])
        if inherited is not None:
            payload["is_accessible"] = inherited

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


@router.patch("/{address_id}/validate", response_model=AddressValidationResponse)
async def validate_address(
    address_id: str,
    body: AddressValidationUpdate,
    user: dict = Depends(get_current_user),
):
    """Assess whether an address is apt for service.
    is_accessible: True = apt, False = not apt, None = reset to pending.
    When set to True, pending siblings at the same lat/lng inherit the value."""
    supabase = get_supabase()
    require_admin(user)
    result = (
        supabase.table("addresses")
        .update({"is_accessible": body.is_accessible})
        .eq("id", address_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    updated_row = result.data[0]
    inherited_count = 0

    # Propagate only when marking as accessible — never for false/null
    if body.is_accessible is True:
        lat, lng = updated_row.get("lat"), updated_row.get("lng")
        if lat is not None and lng is not None:
            siblings = (
                supabase.table("addresses")
                .update({"is_accessible": True})
                .eq("lat", lat)
                .eq("lng", lng)
                .neq("id", address_id)
                .is_("is_accessible", "null")  # only pending siblings
                .execute()
            )
            inherited_count = len(siblings.data or [])

    return AddressValidationResponse(
        address=_row_to_address(updated_row),
        inherited_count=inherited_count,
    )


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
