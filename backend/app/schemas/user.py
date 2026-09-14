from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator

from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserListItemOut(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    ativo: bool
    last_login_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.TECNICO

    @field_validator("name")
    @classmethod
    def nome_minimo(cls, v: str) -> str:
        v = (v or "").strip()
        if len(v) < 2:
            raise ValueError("Indique o nome completo.")
        return v

    @field_validator("password")
    @classmethod
    def password_minima(cls, v: str) -> str:
        if len(v or "") < 8:
            raise ValueError("A password deve ter pelo menos 8 caracteres.")
        return v
