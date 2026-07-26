"""Admin user management endpoints - lets an existing admin create and
manage other admin accounts."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.database import get_db
from app.repositories.user_repository import UserRepository
from app.schemas.user import AdminCreate, AdminPasswordReset, AdminStatusUpdate, UserOut, UserUpdate
from app.services.admin_service import AdminService
from app.utils.exceptions import AdminNotFoundError, CannotDeactivateSelfError, DuplicateEmailError

router = APIRouter(prefix="/api/admin/admins", tags=["admin-users"])


def get_admin_service(db: Session = Depends(get_db)) -> AdminService:
    return AdminService(UserRepository(db))


@router.get("", response_model=list[UserOut])
def list_admins(
    current_user=Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    return admin_service.list_admins()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_admin(
    payload: AdminCreate,
    current_user=Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    try:
        return admin_service.create_admin(**payload.model_dump())
    except DuplicateEmailError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.patch("/{admin_id}", response_model=UserOut)
def update_admin(
    admin_id: uuid.UUID,
    payload: UserUpdate,
    current_user=Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    try:
        return admin_service.update_admin(admin_id, **payload.model_dump(exclude_unset=True))
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post("/{admin_id}/reset-password", response_model=UserOut)
def reset_admin_password(
    admin_id: uuid.UUID,
    payload: AdminPasswordReset,
    current_user=Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    try:
        return admin_service.reset_password(admin_id, payload.new_password)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.patch("/{admin_id}/status", response_model=UserOut)
def set_admin_status(
    admin_id: uuid.UUID,
    payload: AdminStatusUpdate,
    current_user=Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    try:
        return admin_service.set_status(admin_id, payload.is_active, current_user.id)
    except CannotDeactivateSelfError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
