"""Request/response schemas for vehicle service bookings."""
import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.utils.constants import SERVICE_TYPES

BOOKING_STATUSES = {"pending", "confirmed", "completed", "cancelled"}


class ServiceBookingCreate(BaseModel):
    vehicle_id: uuid.UUID
    service_type: str
    preferred_date: date
    notes: str | None = None

    @field_validator("service_type")
    @classmethod
    def service_type_must_be_allowed(cls, value: str) -> str:
        if value not in SERVICE_TYPES:
            raise ValueError(f"Service type must be one of {sorted(SERVICE_TYPES)}")
        return value

    @field_validator("preferred_date")
    @classmethod
    def preferred_date_cannot_be_in_the_past(cls, value: date) -> date:
        if value < date.today():
            raise ValueError("Preferred date cannot be in the past")
        return value


class ServiceBookingOut(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    vehicle_id: uuid.UUID
    service_type: str
    preferred_date: date
    notes: str | None = None
    status: str
    created_at: datetime
    vehicle_make: str
    vehicle_model: str
    customer_email: str
    customer_name: str

    model_config = ConfigDict(from_attributes=True)


class ServiceBookingStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, value: str) -> str:
        if value not in BOOKING_STATUSES:
            raise ValueError(f"Status must be one of {sorted(BOOKING_STATUSES)}")
        return value
