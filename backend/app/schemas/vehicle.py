from pydantic import BaseModel


class VehicleBase(BaseModel):
    make: str
    model: str
    year: int
    price: float
    color: str
    mileage: int
    status: str = "available"


class VehicleCreate(VehicleBase):
    pass


class VehicleRead(VehicleBase):
    id: int

    class Config:
        from_attributes = True
