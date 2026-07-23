"""Purchase history API endpoints."""
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_admin
from app.database import get_db
from app.repositories.purchase_repository import PurchaseRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.purchase import PurchaseOut
from app.services.purchase_service import PurchaseService
from app.services.vehicle_service import VehicleService

router = APIRouter(prefix="/api/purchases", tags=["purchases"])


def get_purchase_service(db: Session = Depends(get_db)) -> PurchaseService:
    return PurchaseService(PurchaseRepository(db), VehicleRepository(db))


@router.get("/me", response_model=list[PurchaseOut])
def get_my_purchases(current_user=Depends(get_current_user), purchase_service: PurchaseService = Depends(get_purchase_service)):
    return purchase_service.list_user_purchases(current_user.id)


@router.get("", response_model=list[PurchaseOut])
def get_all_purchases(current_user=Depends(require_admin), purchase_service: PurchaseService = Depends(get_purchase_service)):
    return purchase_service.list_all_purchases()
