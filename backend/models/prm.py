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


class PrmBase(BaseModel):
    name: str
    email: str = ""
    phone: str = ""
    # Stored as ISO 'YYYY-MM-DD' in DB; frontend formats for display
    birthDate: Optional[str] = None
    bloodType: str = ""
    height: str = ""
    weight: str = ""
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
    height: Optional[str] = None
    weight: Optional[str] = None
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


class Prm(PrmBase):
    id: str
    address: Optional[Address] = None
    emergency_contacts: list[EmergencyContact] = []

    model_config = {"from_attributes": True}
