"""Admin customer management endpoints."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.database import get_db
from app.repositories.user_repository import UserRepository
from app.schemas.user import CustomerOut, CustomerStatusUpdate, UserOut
from app.services.customer_service import CustomerService
from app.utils.exceptions import CustomerNotFoundError

router = APIRouter(prefix="/api/admin/customers", tags=["customers"])


def get_customer_service(db: Session = Depends(get_db)) -> CustomerService:
    return CustomerService(UserRepository(db))


def _to_customer_out(row: dict) -> CustomerOut:
    user = row["user"]
    return CustomerOut(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        mobile_number=user.mobile_number,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        is_active=user.is_active if user.is_active is not None else True,
        total_purchases=row["total_purchases"],
        total_spent=row["total_spent"],
    )


@router.get("", response_model=list[CustomerOut])
def list_customers(
    current_user=Depends(require_admin),
    customer_service: CustomerService = Depends(get_customer_service),
):
    return [_to_customer_out(row) for row in customer_service.list_customers()]


@router.patch("/{customer_id}/status", response_model=UserOut)
def set_customer_status(
    customer_id: uuid.UUID,
    payload: CustomerStatusUpdate,
    current_user=Depends(require_admin),
    customer_service: CustomerService = Depends(get_customer_service),
):
    try:
        return customer_service.set_status(customer_id, payload.is_active)
    except CustomerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: uuid.UUID,
    current_user=Depends(require_admin),
    customer_service: CustomerService = Depends(get_customer_service),
):
    try:
        customer_service.delete_customer(customer_id)
    except CustomerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
