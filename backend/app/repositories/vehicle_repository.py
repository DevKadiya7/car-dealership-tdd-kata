from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle


def list_vehicles(db: Session):
    return db.query(Vehicle).all()
