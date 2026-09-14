from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreateRequest, UserListItemOut
from app.utils.security import get_current_user, hash_password

router = APIRouter(prefix="/api/admin/utilizadores", tags=["utilizadores"])


@router.get("", response_model=list[UserListItemOut])
def listar_utilizadores(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    users = db.query(User).order_by(User.created_at.asc()).all()
    return [UserListItemOut.model_validate(u) for u in users]


@router.post("", response_model=UserListItemOut, status_code=status.HTTP_201_CREATED)
def criar_utilizador(
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    existente = db.query(User).filter(User.email == payload.email.lower()).first()
    if existente is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Já existe um utilizador com este email.")

    user = User(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserListItemOut.model_validate(user)
