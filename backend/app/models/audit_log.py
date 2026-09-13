import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    denuncia_id: Mapped[str] = mapped_column(String(36), ForeignKey("denuncias.id"))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    acao: Mapped[str] = mapped_column(String(255))
    estado_anterior: Mapped[str | None] = mapped_column(String(50), nullable=True)
    estado_novo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    denuncia = relationship("Denuncia", back_populates="audit_logs")
    user = relationship("User")
