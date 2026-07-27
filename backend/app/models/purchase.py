"""Purchase history model."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, ForeignKey, Integer, Numeric, DateTime, String
from sqlalchemy.orm import relationship

from app.database import Base, GUID


class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    vehicle_id = Column(GUID(), ForeignKey("vehicles.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    # Vehicle's per-unit price at the moment of purchase, before the Today
    # Only 10% discount - captured historically so invoices/receipts stay
    # accurate even if the vehicle's catalog price changes later. Nullable
    # since purchases made before this column existed won't have it.
    unit_price = Column(Numeric(10, 2), nullable=True)
    purchased_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Admin order-management fields, added in Phase 4. total_price stays
    # pre-GST (unchanged, matches historical records and Total Revenue
    # reporting) - GST/grand total are derived for display only, the same
    # way the customer-facing Invoice already computes them.
    payment_method = Column(String, nullable=True)
    status = Column(String, nullable=False, default="completed")

    user = relationship("User")
    vehicle = relationship("Vehicle")
