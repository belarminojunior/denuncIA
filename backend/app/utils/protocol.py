from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Report
from app.utils.time import utc_now

PROTOCOL_PREFIX = "GCCC"


def generate_protocol(db: Session) -> str:
    """Next sequential protocol for the current year, e.g. GCCC-2026-000123."""
    year_prefix = f"{PROTOCOL_PREFIX}-{utc_now().year}-"
    sequence = (db.query(func.count(Report.id)).filter(Report.protocol.like(f"{year_prefix}%")).scalar() or 0) + 1

    # The count can collide if reports were deleted or created concurrently.
    while db.query(Report.id).filter(Report.protocol == f"{year_prefix}{sequence:06d}").first() is not None:
        sequence += 1
    return f"{year_prefix}{sequence:06d}"
