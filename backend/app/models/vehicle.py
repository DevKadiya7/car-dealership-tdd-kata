"""Vehicle model: represents a single vehicle listing in the dealership."""
import uuid

from sqlalchemy import Column, String, Numeric, Integer

from app.database import Base, GUID


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    make = Column(String, nullable=False, index=True)
    model = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    image_url = Column(String, nullable=True)
