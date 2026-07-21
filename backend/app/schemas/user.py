from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True
