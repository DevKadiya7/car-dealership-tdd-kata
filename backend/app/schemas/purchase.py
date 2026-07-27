"""Request/response schemas for purchases."""
import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class PurchaseRequest(BaseModel):
    payment_method: str | None = None


class PurchaseOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    vehicle_id: uuid.UUID
    quantity: int
    unit_price: Decimal | None = None
    original_price: Decimal | None = None
    discount_amount: Decimal | None = None
    total_price: Decimal
    gst: Decimal
    grand_total: Decimal
    purchased_at: datetime
    payment_method: str
    status: str
    vehicle_make: str
    vehicle_model: str
    customer_email: str
    customer_name: str
