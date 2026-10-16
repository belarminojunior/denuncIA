from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUser, DbSession
from app.models import AuditAction, User
from app.schemas.user import LoginRequest, LoginResponse, UserRead
from app.services import audit_service
from app.utils.security import create_access_token, verify_password
from app.utils.time import utc_now

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: DbSession):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    # Same message for unknown email and wrong password, to avoid revealing which accounts exist.
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou password inválidos.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Esta conta encontra-se suspensa.")

    user.last_login_at = utc_now()
    audit_service.record(db, action=AuditAction.LOGIN, description=f"{user.name} iniciou sessão", user_id=user.id)
    db.commit()

    return LoginResponse(access_token=create_access_token(user.id), user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
def get_me(user: CurrentUser):
    return user
