from jose import jwt
from app.config import ALGORITHM, SECRET_KEY


def create_token(data: dict) -> str:
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
