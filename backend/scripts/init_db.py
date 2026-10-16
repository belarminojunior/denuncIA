"""Create the database tables and the demo technician account.

Usage:
    python scripts/init_db.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import User, UserRole  # noqa: E402
from app.utils.security import hash_password  # noqa: E402

# Development-only credentials, documented in the README.
DEMO_NAME = "Técnico GCCC"
DEMO_EMAIL = "tecnico@gccc.gov.mz"
DEMO_PASSWORD = "Admin123!"


def ensure_demo_user() -> bool:
    """Create the demo technician if missing; returns True when it was created."""
    with SessionLocal() as db:
        if db.query(User.id).filter(User.email == DEMO_EMAIL).first() is not None:
            return False
        db.add(User(name=DEMO_NAME, email=DEMO_EMAIL, password_hash=hash_password(DEMO_PASSWORD), role=UserRole.TECHNICIAN))
        db.commit()
        return True


def main() -> None:
    Base.metadata.create_all(bind=engine)
    print("Tabelas criadas/verificadas com sucesso.")

    if ensure_demo_user():
        print(f"Utilizador de demonstração criado: {DEMO_EMAIL} / {DEMO_PASSWORD}")
    else:
        print("Utilizador de demonstração já existe.")


if __name__ == "__main__":
    main()
