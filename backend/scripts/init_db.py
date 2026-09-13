"""Cria as tabelas na base de dados e o utilizador técnico de demonstração.

Uso:
    python scripts/init_db.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402
from app.utils.security import hash_password  # noqa: E402

DEMO_EMAIL = "tecnico@gccc.gov.mz"
DEMO_PASSWORD = "Admin123!"


def main() -> None:
    Base.metadata.create_all(bind=engine)
    print("Tabelas criadas/verificadas com sucesso.")

    db = SessionLocal()
    try:
        existente = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if existente is None:
            demo = User(
                name="Técnico GCCC",
                email=DEMO_EMAIL,
                password_hash=hash_password(DEMO_PASSWORD),
                role=UserRole.TECNICO,
            )
            db.add(demo)
            db.commit()
            print(f"Utilizador de demonstração criado: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        else:
            print("Utilizador de demonstração já existe.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
