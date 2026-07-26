"""Vehicle loan API endpoints."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_admin
from app.database import get_db
from app.repositories.loan_repository import LoanRepository
from app.repositories.purchase_repository import PurchaseRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.loan import LoanCreate, LoanOut, LoanStatusUpdate
from app.services.loan_service import LoanService
from app.services.purchase_service import PurchaseService
from app.utils.exceptions import (
    DownPaymentExceedsPriceError,
    InsufficientDownPaymentError,
    InsufficientStockError,
    LoanNotFoundError,
    VehicleNotFoundError,
)

router = APIRouter(prefix="/api/loans", tags=["loans"])


def get_loan_service(db: Session = Depends(get_db)) -> LoanService:
    vehicle_repository = VehicleRepository(db)
    purchase_service = PurchaseService(PurchaseRepository(db), vehicle_repository)
    return LoanService(LoanRepository(db), vehicle_repository, purchase_service)


@router.post("", response_model=LoanOut, status_code=status.HTTP_201_CREATED)
def create_loan(
    payload: LoanCreate,
    current_user=Depends(get_current_user),
    loan_service: LoanService = Depends(get_loan_service),
):
    try:
        return loan_service.create_loan(
            current_user.id, payload.vehicle_id, payload.down_payment, payload.duration_years
        )
    except VehicleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (InsufficientDownPaymentError, DownPaymentExceedsPriceError, InsufficientStockError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/me", response_model=list[LoanOut])
def get_my_loans(
    current_user=Depends(get_current_user),
    loan_service: LoanService = Depends(get_loan_service),
):
    return loan_service.list_customer_loans(current_user.id)


@router.get("", response_model=list[LoanOut])
def get_all_loans(
    current_user=Depends(require_admin),
    loan_service: LoanService = Depends(get_loan_service),
):
    return loan_service.list_all_loans()


@router.patch("/{loan_id}/status", response_model=LoanOut)
def set_loan_status(
    loan_id: uuid.UUID,
    payload: LoanStatusUpdate,
    current_user=Depends(require_admin),
    loan_service: LoanService = Depends(get_loan_service),
):
    try:
        return loan_service.set_status(loan_id, payload.status)
    except LoanNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
