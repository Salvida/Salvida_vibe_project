from pydantic import BaseModel
from typing import Literal, Optional

BookingStatus = Literal["Approved", "Pending", "Completed", "Cancelled"]
ServiceReason = Literal[
    "medical_appointment",
    "physiotherapy",
    "dialysis",
    "hospital_admission",
    "administrative",
    "other",
]


class BookingBase(BaseModel):
    prmId: str
    startTime: str          # 'HH:MM'
    endTime: str            # 'HH:MM'
    date: str               # 'YYYY-MM-DD'
    address: str = ""
    service_reason: Optional[ServiceReason] = None
    service_reason_notes: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    date: Optional[str] = None
    address: Optional[str] = None
    status: Optional[BookingStatus] = None
    service_reason: Optional[ServiceReason] = None
    service_reason_notes: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    status: BookingStatus


class BookingCancel(BaseModel):
    reason: Optional[str] = None


class Booking(BookingBase):
    id: str
    prmName: str
    prmAvatar: Optional[str] = None
    status: BookingStatus = "Pending"
    is_demo: bool = False
    created_by_admin: bool = False
    owner_name: Optional[str] = None

    model_config = {"from_attributes": True}
