from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator

from app.models import UserRole

PASSWORD_MIN_LENGTH = 8


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class UserSummary(UserRead):
    is_active: bool
    last_login_at: datetime | None
    created_at: datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.TECHNICIAN

    @field_validator("name")
    @classmethod
    def require_full_name(cls, value: str) -> str:
        value = (value or "").strip()
        if len(value) < 2:
            raise ValueError("Indique o nome completo.")
        return value

    @field_validator("password")
    @classmethod
    def require_min_password_length(cls, value: str) -> str:
        if len(value or "") < PASSWORD_MIN_LENGTH:
            raise ValueError(f"A palavra-passe deve ter pelo menos {PASSWORD_MIN_LENGTH} caracteres.")
        return value
