"""Request/response schemas for login and JWT tokens."""
from pydantic import BaseModel, EmailStr, field_validator

from app.schemas.user import validate_password_strength


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def new_password_strength(cls, value: str) -> str:
        return validate_password_strength(value)
