from pydantic import BaseModel
from typing import Optional


class ProfileUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    dni: Optional[str] = None
    avatar: Optional[str] = None


class UserProfile(BaseModel):
    id: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    dni: Optional[str] = None
    role: Optional[str] = None
    avatar: Optional[str] = None

    model_config = {"from_attributes": True}
