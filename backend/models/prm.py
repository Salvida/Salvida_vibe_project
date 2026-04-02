from pydantic import BaseModel
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


class PrmCreate(PrmBase):
    emergency_contacts: list[EmergencyContactCreate] = []


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


class Prm(PrmBase):
    id: str
    created_by: Optional[str] = None
    addresses: list[Address] = []
    emergency_contacts: list[EmergencyContact] = []

    model_config = {"from_attributes": True}
