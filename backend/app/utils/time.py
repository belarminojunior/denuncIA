from datetime import datetime, timezone


def utc_now() -> datetime:
    """Naive UTC timestamp, matching the timezone-less DateTime columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
