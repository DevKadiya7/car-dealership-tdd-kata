"""Request/response schemas for vehicle inventory."""
import uuid
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class VehicleCreate(BaseModel):
    make: str
    model: str
    category: str
    price: Decimal = Field(gt=0)
    quantity: int = Field(ge=0)
    image_url: Optional[str] = None


class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    category: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, gt=0)
    quantity: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = None


class VehicleOut(BaseModel):
    id: uuid.UUID
    make: str
    model: str
    category: str
    price: Decimal
    quantity: int
    image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
