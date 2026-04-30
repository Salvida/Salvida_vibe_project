from pydantic import BaseModel, field_validator
from typing import Optional, Literal


class NotificationPrefs(BaseModel):
    email: bool = False
    push: bool = True
    booking_reminder: bool = True


class ProfileUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    dni: Optional[str] = None
    avatar: Optional[str] = None
    notification_prefs: Optional[NotificationPrefs] = None


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
    notification_prefs: Optional[NotificationPrefs] = None
    isActive: bool = True
    demoModeActive: bool = False
    isDemo: bool = False

    model_config = {"from_attributes": True}


class DemoModeUpdate(BaseModel):
    active: bool


class UserCreateRequest(BaseModel):
    email: str
    method: Literal["invite", "direct"]
    password: Optional[str] = None  # requerido solo si method="direct"
    firstName: str = ""
    lastName: str = ""
    phone: str = ""
    organization: str = ""
    role: str = "user"
    is_demo: bool = False

    @field_validator("email")
    @classmethod
    def email_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("El email es requerido")
        return v.strip().lower()


class UserDemoUpdate(BaseModel):
    is_demo: bool
