import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    denuncia_id: Mapped[str] = mapped_column(String(36), ForeignKey("denuncias.id"))
    filename: Mapped[str] = mapped_column(String(255))
    filepath: Mapped[str] = mapped_column(String(500))
    mimetype: Mapped[str] = mapped_column(String(100))
    size: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    denuncia = relationship("Denuncia", back_populates="attachments")
