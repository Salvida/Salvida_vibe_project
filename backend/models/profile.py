from pydantic import BaseModel
from typing import Optional


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
