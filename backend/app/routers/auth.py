from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, LoginResponse, UserOut
from app.services import audit_service
from app.models.audit_log import TipoOperacao
from app.utils.security import create_access_token, get_current_user, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou password inválidos.")
    if not user.ativo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Esta conta encontra-se suspensa.")

    user.last_login_at = datetime.utcnow()
    audit_service.log_action(
        db,
        acao=f"{user.name} iniciou sessão",
        tipo=TipoOperacao.LOGIN,
        user_id=user.id,
    )
    db.commit()

    token = create_access_token(subject=user.id)
    return LoginResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
