from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUser, DbSession
from app.models import User
from app.schemas.user import UserCreate, UserSummary
from app.utils.security import hash_password

router = APIRouter(prefix="/api/admin/users", tags=["users"])


@router.get("", response_model=list[UserSummary])
def list_users(db: DbSession, _: CurrentUser):
    return db.query(User).order_by(User.created_at.asc()).all()


@router.post("", response_model=UserSummary, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: DbSession, _: CurrentUser):
    email = payload.email.lower()
    if db.query(User.id).filter(User.email == email).first() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Já existe um utilizador com este email.")

    user = User(name=payload.name, email=email, password_hash=hash_password(payload.password), role=payload.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
