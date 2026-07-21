from sqlalchemy import Column, Integer, String, Float
from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    color = Column(String, nullable=False)
    mileage = Column(Integer, nullable=False)
    status = Column(String, default="available")
