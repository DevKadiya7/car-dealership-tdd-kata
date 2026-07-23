"""Vehicle & inventory endpoints, all protected by JWT auth."""
import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_admin
from app.database import get_db
from app.repositories.purchase_repository import PurchaseRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.purchase import PurchaseRequest
from app.schemas.vehicle import VehicleCreate, VehicleOut, VehicleUpdate
from app.services.purchase_service import PurchaseService
from app.services.vehicle_service import VehicleService
from app.utils.exceptions import InsufficientStockError, VehicleNotFoundError

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


def get_vehicle_service(db: Session = Depends(get_db)) -> VehicleService:
    return VehicleService(VehicleRepository(db))


def get_purchase_service(db: Session = Depends(get_db)) -> PurchaseService:
    return PurchaseService(PurchaseRepository(db), VehicleRepository(db))


@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def add_vehicle(
    payload: VehicleCreate,
    vehicle_service: VehicleService = Depends(get_vehicle_service),
    current_user=Depends(get_current_user),
):
    return vehicle_service.create_vehicle(**payload.model_dump())


@router.get("", response_model=list[VehicleOut])
def list_vehicles(
    vehicle_service: VehicleService = Depends(get_vehicle_service),
    current_user=Depends(get_current_user),
):
    return vehicle_service.list_vehicles()


@router.get("/search", response_model=list[VehicleOut])
def search_vehicles(
    make: str | None = None,
    model: str | None = None,
    category: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    vehicle_service: VehicleService = Depends(get_vehicle_service),
    current_user=Depends(get_current_user),
):
    return vehicle_service.search_vehicles(make, model, category, min_price, max_price)


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(
    vehicle_id: uuid.UUID,
    vehicle_service: VehicleService = Depends(get_vehicle_service),
    current_user=Depends(get_current_user),
):
    try:
        return vehicle_service.get_vehicle(vehicle_id)
    except VehicleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.put("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: uuid.UUID,
    payload: VehicleUpdate,
    vehicle_service: VehicleService = Depends(get_vehicle_service),
    current_user=Depends(get_current_user),
):
    try:
        return vehicle_service.update_vehicle(vehicle_id, **payload.model_dump(exclude_unset=True))
    except VehicleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: uuid.UUID,
    vehicle_service: VehicleService = Depends(get_vehicle_service),
    current_user=Depends(require_admin),
):
    try:
        vehicle_service.delete_vehicle(vehicle_id)
    except VehicleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post("/{vehicle_id}/purchase", response_model=VehicleOut)
def purchase_vehicle(
    vehicle_id: uuid.UUID,
    payload: PurchaseRequest = PurchaseRequest(),
    purchase_service: PurchaseService = Depends(get_purchase_service),
    current_user=Depends(get_current_user),
):
    try:
        return purchase_service.purchase_vehicle(
            current_user.id, vehicle_id, payment_method=payload.payment_method
        )
    except VehicleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except InsufficientStockError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/{vehicle_id}/restock", response_model=VehicleOut)
def restock_vehicle(
    vehicle_id: uuid.UUID,
    vehicle_service: VehicleService = Depends(get_vehicle_service),
    current_user=Depends(require_admin),
):
    try:
        return vehicle_service.restock_vehicle(vehicle_id)
    except VehicleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
