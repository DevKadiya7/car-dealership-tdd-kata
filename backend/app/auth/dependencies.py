from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.config import ALGORITHM, SECRET_KEY
from app.database import SessionLocal
from app.models.user import User


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = None
    try:
        token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == token.get("sub")).first()
    if user is None:
        raise credentials_exception
    return user
