from pydantic import BaseModel
from typing import Literal, Optional
from .address import Address

PatientStatus = Literal["Activo", "Inactivo"]


class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    relationship: str


class EmergencyContact(EmergencyContactCreate):
    id: str

    model_config = {"from_attributes": True}


class PatientBase(BaseModel):
    name: str
    email: str = ""
    phone: str = ""
    # Stored as ISO 'YYYY-MM-DD' in DB; frontend formats for display
    birthDate: Optional[str] = None
    bloodType: str = ""
    height: str = ""
    weight: str = ""
    status: PatientStatus = "Activo"
    avatar: Optional[str] = None
    dni: Optional[str] = None
    is_demo: bool = False


class PatientCreate(PatientBase):
    emergency_contacts: list[EmergencyContactCreate] = []


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    birthDate: Optional[str] = None
    bloodType: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    status: Optional[PatientStatus] = None
    avatar: Optional[str] = None
    dni: Optional[str] = None


class PatientListItem(BaseModel):
    """Lightweight model for list endpoints — no nested relations."""
    id: str
    name: str
    email: str
    phone: str
    status: PatientStatus
    avatar: Optional[str] = None
    dni: Optional[str] = None
    is_demo: bool = False


class Patient(PatientBase):
    id: str
    address: Optional[Address] = None
    emergency_contacts: list[EmergencyContact] = []

    model_config = {"from_attributes": True}
