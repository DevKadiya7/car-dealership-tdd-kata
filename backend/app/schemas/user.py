"""Request/response schemas for user data."""
import re
import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, ConfigDict, field_validator

from app.models.user import UserRole

MOBILE_NUMBER_PATTERN = re.compile(r"^\+?\d{10,15}$")


def validate_password_strength(value: str) -> str:
    if len(value) < 8 or not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
        raise ValueError("Password must be at least 8 characters and include a letter and a digit")
    return value


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    mobile_number: str
    terms_accepted: bool
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None

    @field_validator("first_name", "last_name", "mobile_number")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        return validate_password_strength(value)

    @field_validator("mobile_number")
    @classmethod
    def mobile_format(cls, value: str) -> str:
        if not MOBILE_NUMBER_PATTERN.match(value):
            raise ValueError("Mobile number must be 10-15 digits, with an optional leading +")
        return value

    @field_validator("terms_accepted")
    @classmethod
    def must_accept_terms(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Terms & Conditions must be accepted")
        return value


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: UserRole
    first_name: str | None = None
    last_name: str | None = None
    mobile_number: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    avatar_url: str | None = None
    created_at: datetime | None = None
    is_active: bool | None = None

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    mobile_number: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    avatar_url: str | None = None

    @field_validator("first_name", "last_name")
    @classmethod
    def not_blank_if_provided(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("mobile_number")
    @classmethod
    def mobile_format_if_provided(cls, value: str | None) -> str | None:
        if value is not None and not MOBILE_NUMBER_PATTERN.match(value):
            raise ValueError("Mobile number must be 10-15 digits, with an optional leading +")
        return value


class CustomerOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    mobile_number: str | None = None
    avatar_url: str | None = None
    created_at: datetime | None = None
    is_active: bool
    total_purchases: int
    total_spent: Decimal

    model_config = ConfigDict(from_attributes=True)


class CustomerStatusUpdate(BaseModel):
    is_active: bool
