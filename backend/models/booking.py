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
BookingUrgency = Literal["routine", "urgent"]


class BookingBase(BaseModel):
    patientId: str
    startTime: str          # 'HH:MM'
    endTime: str            # 'HH:MM'
    date: str               # 'YYYY-MM-DD'
    location: str = ""
    destination: str = ""
    service_reason: Optional[ServiceReason] = None
    service_reason_notes: Optional[str] = None
    urgency: BookingUrgency = "routine"


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    date: Optional[str] = None
    location: Optional[str] = None
    destination: Optional[str] = None
    status: Optional[BookingStatus] = None
    service_reason: Optional[ServiceReason] = None
    service_reason_notes: Optional[str] = None
    urgency: Optional[BookingUrgency] = None


class BookingStatusUpdate(BaseModel):
    status: BookingStatus


class BookingCancel(BaseModel):
    reason: Optional[str] = None


class Booking(BookingBase):
    id: str
    patientName: str
    patientAvatar: Optional[str] = None
    status: BookingStatus = "Pending"
    is_demo: bool = False

    model_config = {"from_attributes": True}
