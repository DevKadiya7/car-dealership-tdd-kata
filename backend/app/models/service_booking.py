"""Vehicle service/maintenance booking model."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.database import Base, GUID


class ServiceBooking(Base):
    __tablename__ = "service_bookings"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    customer_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    vehicle_id = Column(GUID(), ForeignKey("vehicles.id"), nullable=False, index=True)
    service_type = Column(String, nullable=False)
    preferred_date = Column(Date, nullable=False)
    notes = Column(String, nullable=True)
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    customer = relationship("User")
    vehicle = relationship("Vehicle")
