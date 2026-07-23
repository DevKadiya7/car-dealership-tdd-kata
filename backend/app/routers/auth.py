"""Auth endpoints: POST /api/auth/register, POST /api/auth/login."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.repositories.user_repository import UserRepository
from app.schemas.auth import ChangePasswordRequest, LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services.auth_service import AuthService
from app.utils.exceptions import DuplicateEmailError, InvalidCredentialsError

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(UserRepository(db))


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, auth_service: AuthService = Depends(get_auth_service)):
    try:
        return auth_service.register(**payload.model_dump())
    except DuplicateEmailError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):
    try:
        token = auth_service.login(email=payload.email, password=payload.password)
        return TokenResponse(access_token=token)
    except InvalidCredentialsError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))


@router.get("/me", response_model=UserOut)
def get_me(current_user=Depends(get_current_user)):
    """Returns the logged-in user's own profile, including role - the
    JWT itself only carries the user's ID, so the frontend needs this
    endpoint to know whether to show admin-only UI."""
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    current_user=Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    return auth_service.update_profile(current_user, **payload.model_dump(exclude_unset=True))


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        auth_service.change_password(current_user, payload.current_password, payload.new_password)
    except InvalidCredentialsError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    return {"detail": "Password updated successfully"}
