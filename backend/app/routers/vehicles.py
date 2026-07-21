from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas.vehicle import VehicleCreate, VehicleRead
from app.services.vehicle_service import create_vehicle, get_vehicle, list_vehicles

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
def create_vehicle_route(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    return create_vehicle(db, vehicle)


@router.get("/", response_model=list[VehicleRead])
def list_vehicles_route(db: Session = Depends(get_db)):
    return list_vehicles(db)


@router.get("/{vehicle_id}", response_model=VehicleRead)
def get_vehicle_route(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = get_vehicle(db, vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle
