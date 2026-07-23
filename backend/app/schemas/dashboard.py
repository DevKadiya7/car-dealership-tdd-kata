"""Request/response schemas for dashboard analytics."""
import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class DashboardSummary(BaseModel):
    total_customers: int
    total_vehicles: int
    total_stock: int
    total_sales: int
    total_revenue: Decimal
    low_stock_count: int

    model_config = ConfigDict(from_attributes=True)


class RecentPurchaseOut(BaseModel):
    id: uuid.UUID
    vehicle_id: uuid.UUID
    vehicle_make: str
    vehicle_model: str
    customer_email: str
    quantity: int
    price: Decimal
    purchase_date: datetime

    model_config = ConfigDict(from_attributes=True)


class TopSellingVehicleOut(BaseModel):
    vehicle_id: uuid.UUID
    make: str
    model: str
    units_sold: int
    revenue: Decimal

    model_config = ConfigDict(from_attributes=True)


class SalesByCategoryOut(BaseModel):
    category: str
    units_sold: int
    revenue: Decimal

    model_config = ConfigDict(from_attributes=True)


class MonthlySalesOut(BaseModel):
    month: str
    revenue: Decimal
    total_purchases: int

    model_config = ConfigDict(from_attributes=True)


class OrdersByStatusOut(BaseModel):
    status: str
    count: int

    model_config = ConfigDict(from_attributes=True)


class OrdersByPaymentMethodOut(BaseModel):
    payment_method: str
    count: int

    model_config = ConfigDict(from_attributes=True)
