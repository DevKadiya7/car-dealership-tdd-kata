from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserCreate, UserRead
from app.services.auth_service import authenticate_user, create_access_token, create_user

router = APIRouter(prefix="/auth", tags=["auth"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, user)


@router.post("/login", response_model=Token)
def login(user: LoginRequest, db: Session = Depends(get_db)):
    auth_user = authenticate_user(db, user.email, user.password)
    if not auth_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": auth_user.email})
    return {"access_token": access_token, "token_type": "bearer"}
