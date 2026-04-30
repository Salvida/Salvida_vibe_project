from pydantic import BaseModel, field_validator
from typing import Literal, Optional

AddressValidationStatus = Literal["pending", "validated", "rejected"]


class AddressBase(BaseModel):
    full_address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    validation_status: AddressValidationStatus = "pending"
    validation_notes: Optional[str] = None
    is_accessible: Optional[bool] = None
    alias: str = ""
    prm_id: Optional[str] = None

    @field_validator("full_address")
    @classmethod
    def validate_full_address(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("full_address cannot be empty")
        if len(v) > 500:
            raise ValueError("full_address is too long (max 500 characters)")
        return v

    @field_validator("lat")
    @classmethod
    def validate_lat(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (-90 <= v <= 90):
            raise ValueError("lat must be between -90 and 90")
        return v

    @field_validator("lng")
    @classmethod
    def validate_lng(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (-180 <= v <= 180):
            raise ValueError("lng must be between -180 and 180")
        return v


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    full_address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_accessible: Optional[bool] = None
    alias: Optional[str] = None


class AddressValidationUpdate(BaseModel):
    """Used by admins to assess whether an address is apt for service.
    is_accessible: True = apt, False = not apt, None = reset to pending review."""
    is_accessible: Optional[bool] = None


class PrmAddressCreate(BaseModel):
    """Used when adding an address directly to a PRM."""
    full_address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_accessible: Optional[bool] = None  # None = pending review
    alias: str = ""


class Address(AddressBase):
    id: str
    user_id: Optional[str] = None
    created_by: Optional[str] = None
    prm_name: Optional[str] = None
    owner_name: Optional[str] = None

    model_config = {"from_attributes": True}


class AddressValidationResponse(BaseModel):
    """Response model for the validate endpoint — includes inherited sibling count."""
    address: Address
    inherited_count: int = 0
