"""Request/response schemas for dashboard analytics."""
import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.schemas.vehicle import VehicleOut


class DashboardSummary(BaseModel):
    total_users: int
    total_vehicles: int
    total_stock: int
    total_purchases: int
    total_revenue: Decimal

    model_config = ConfigDict(from_attributes=True)


class RecentPurchaseOut(BaseModel):
    id: uuid.UUID
    vehicle: VehicleOut
    buyer_email: str
    quantity: int
    price: Decimal
    purchase_date: datetime

    model_config = ConfigDict(from_attributes=True)


class TopSellingVehicleOut(BaseModel):
    vehicle: VehicleOut
    total_sold: int
    total_revenue: Decimal

    model_config = ConfigDict(from_attributes=True)
