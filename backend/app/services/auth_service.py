from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import ALGORITHM, SECRET_KEY
from app.models.user import User
from app.schemas.user import UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_user(db: Session, user: UserCreate) -> User:
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise ValueError("User already exists")
    db_user = User(
        email=str(user.email),
        hashed_password=get_password_hash(user.password),
        full_name=user.full_name,
        role="customer",
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
