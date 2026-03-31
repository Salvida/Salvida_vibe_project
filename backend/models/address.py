from pydantic import BaseModel
from typing import Literal, Optional

AddressValidationStatus = Literal["pending", "validated", "rejected"]


class AddressBase(BaseModel):
    full_address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    validation_status: AddressValidationStatus = "pending"
    validation_notes: Optional[str] = None
    is_accessible: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    full_address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    validation_status: Optional[AddressValidationStatus] = None
    validation_notes: Optional[str] = None
    is_accessible: Optional[bool] = None


class AddressValidationUpdate(BaseModel):
    """Used by coordinators to update only the validation status."""
    validation_status: AddressValidationStatus
    validation_notes: Optional[str] = None


class Address(AddressBase):
    id: str
    created_by: Optional[str] = None

    model_config = {"from_attributes": True}
