import re
from pydantic import BaseModel, field_validator
from typing import Literal, Optional
from .address import Address

PrmStatus = Literal["Activo", "Inactivo"]


class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    relationship: str


class EmergencyContact(EmergencyContactCreate):
    id: str

    model_config = {"from_attributes": True}


class EmergencyContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    relationship: Optional[str] = None


class PrmBase(BaseModel):
    name: str
    email: str = ""
    phone: str = ""
    # Stored as ISO 'YYYY-MM-DD' in DB; frontend formats for display
    birthDate: Optional[str] = None
    bloodType: str = ""
    height: Optional[float] = None
    weight: Optional[float] = None
    status: PrmStatus = "Activo"
    avatar: Optional[str] = None
    dni: Optional[str] = None
    is_demo: bool = False

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name cannot be empty")
        return v

    @field_validator("birthDate")
    @classmethod
    def validate_birth_date(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
            raise ValueError("birthDate must be in YYYY-MM-DD format")
        return v


class PrmCreate(PrmBase):
    emergency_contacts: list[EmergencyContactCreate] = []
    owner_id: Optional[str] = None


class PrmUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    birthDate: Optional[str] = None
    bloodType: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    status: Optional[PrmStatus] = None
    avatar: Optional[str] = None
    dni: Optional[str] = None


class PrmListItem(BaseModel):
    """Lightweight model for list endpoints — no nested relations."""
    id: str
    name: str
    email: str
    phone: str
    status: PrmStatus
    avatar: Optional[str] = None
    dni: Optional[str] = None
    is_demo: bool = False
    created_by: Optional[str] = None
    owner_name: Optional[str] = None
    booking_count: int = 0
    last_booking_date: Optional[str] = None


class Prm(PrmBase):
    id: str
    created_by: Optional[str] = None
    owner_name: Optional[str] = None
    addresses: list[Address] = []
    emergency_contacts: list[EmergencyContact] = []

    model_config = {"from_attributes": True}
