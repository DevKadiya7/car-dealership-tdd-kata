"""Vehicle loan model. A loan always belongs to exactly one Purchase (the
underlying vehicle sale, financed rather than paid in full up front)."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, ForeignKey, Integer, Numeric, DateTime, String
from sqlalchemy.orm import relationship

from app.database import Base, GUID


class Loan(Base):
    __tablename__ = "loans"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    purchase_id = Column(GUID(), ForeignKey("purchases.id"), nullable=False, index=True)
    customer_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    vehicle_id = Column(GUID(), ForeignKey("vehicles.id"), nullable=False, index=True)
    vehicle_price = Column(Numeric(10, 2), nullable=False)
    down_payment = Column(Numeric(10, 2), nullable=False)
    loan_amount = Column(Numeric(10, 2), nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=False)
    duration_years = Column(Integer, nullable=False)
    monthly_emi = Column(Numeric(10, 2), nullable=False)
    total_interest = Column(Numeric(10, 2), nullable=False)
    total_payable = Column(Numeric(10, 2), nullable=False)
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    purchase = relationship("Purchase")
    customer = relationship("User")
    vehicle = relationship("Vehicle")
