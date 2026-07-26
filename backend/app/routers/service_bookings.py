"""Vehicle service booking API endpoints."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_admin
from app.database import get_db
from app.repositories.purchase_repository import PurchaseRepository
from app.repositories.service_booking_repository import ServiceBookingRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.service_booking import (
    ServiceBookingCreate,
    ServiceBookingOut,
    ServiceBookingStatusUpdate,
)
from app.services.service_booking_service import ServiceBookingService
from app.utils.exceptions import (
    ServiceBookingNotFoundError,
    VehicleNotFoundError,
    VehicleNotOwnedError,
)

router = APIRouter(prefix="/api/service-bookings", tags=["service-bookings"])


def get_service_booking_service(db: Session = Depends(get_db)) -> ServiceBookingService:
    return ServiceBookingService(
        ServiceBookingRepository(db), VehicleRepository(db), PurchaseRepository(db)
    )


@router.post("", response_model=ServiceBookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: ServiceBookingCreate,
    current_user=Depends(get_current_user),
    booking_service: ServiceBookingService = Depends(get_service_booking_service),
):
    try:
        return booking_service.create_booking(
            current_user.id,
            payload.vehicle_id,
            payload.service_type,
            payload.preferred_date,
            payload.notes,
        )
    except VehicleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except VehicleNotOwnedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))


@router.get("/me", response_model=list[ServiceBookingOut])
def get_my_bookings(
    current_user=Depends(get_current_user),
    booking_service: ServiceBookingService = Depends(get_service_booking_service),
):
    return booking_service.list_customer_bookings(current_user.id)


@router.get("", response_model=list[ServiceBookingOut])
def get_all_bookings(
    current_user=Depends(require_admin),
    booking_service: ServiceBookingService = Depends(get_service_booking_service),
):
    return booking_service.list_all_bookings()


@router.patch("/{booking_id}/status", response_model=ServiceBookingOut)
def set_booking_status(
    booking_id: uuid.UUID,
    payload: ServiceBookingStatusUpdate,
    current_user=Depends(require_admin),
    booking_service: ServiceBookingService = Depends(get_service_booking_service),
):
    try:
        return booking_service.set_status(booking_id, payload.status)
    except ServiceBookingNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
