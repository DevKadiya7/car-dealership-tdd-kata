"""Request/response schemas for vehicle loans."""
import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator

from app.utils.loan import ALLOWED_LOAN_DURATIONS

LOAN_STATUSES = {"pending", "approved", "rejected", "completed"}


class LoanCreate(BaseModel):
    vehicle_id: uuid.UUID
    down_payment: Decimal
    duration_years: int

    @field_validator("down_payment")
    @classmethod
    def down_payment_must_be_positive(cls, value: Decimal) -> Decimal:
        if value <= 0:
            raise ValueError("Down payment must be positive")
        return value

    @field_validator("duration_years")
    @classmethod
    def duration_must_be_allowed(cls, value: int) -> int:
        if value not in ALLOWED_LOAN_DURATIONS:
            raise ValueError("Loan duration must be between 1 and 7 years")
        return value


class LoanOut(BaseModel):
    id: uuid.UUID
    purchase_id: uuid.UUID
    customer_id: uuid.UUID
    vehicle_id: uuid.UUID
    vehicle_price: Decimal
    down_payment: Decimal
    loan_amount: Decimal
    interest_rate: Decimal
    duration_years: int
    monthly_emi: Decimal
    total_interest: Decimal
    total_payable: Decimal
    status: str
    created_at: datetime
    vehicle_make: str
    vehicle_model: str
    customer_email: str
    customer_name: str

    model_config = ConfigDict(from_attributes=True)


class LoanStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, value: str) -> str:
        if value not in LOAN_STATUSES:
            raise ValueError(f"Status must be one of {sorted(LOAN_STATUSES)}")
        return value
