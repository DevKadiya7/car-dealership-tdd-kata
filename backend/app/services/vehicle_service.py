from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate


def create_vehicle(db: Session, vehicle: VehicleCreate) -> Vehicle:
    db_vehicle = Vehicle(**vehicle.model_dump())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


def list_vehicles(db: Session):
    return db.query(Vehicle).all()


def get_vehicle(db: Session, vehicle_id: int):
    return db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
