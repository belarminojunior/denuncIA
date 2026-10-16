from collections import Counter

from fastapi import APIRouter
from sqlalchemy import func

from app.dependencies import CurrentUser, DbSession
from app.models import Category, Priority, Report, ReportStatus
from app.schemas.dashboard import CategoryCount, DashboardStats, MonthlyCount, PriorityCount, StatusCount
from app.utils.time import utc_now

router = APIRouter(prefix="/api/admin/dashboard", tags=["dashboard"])

MONTHS_SHOWN = 7
PRIORITY_ORDER = [Priority.CRITICAL, Priority.HIGH, Priority.MEDIUM, Priority.LOW]


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: DbSession, _: CurrentUser):
    counts = dict(db.query(Report.status, func.count(Report.id)).group_by(Report.status).all())
    return DashboardStats(
        total=sum(counts.values()),
        pending_review=counts.get(ReportStatus.PENDING_REVIEW, 0),
        under_review=counts.get(ReportStatus.UNDER_REVIEW, 0),
        validated=counts.get(ReportStatus.VALIDATED, 0),
        routed=counts.get(ReportStatus.ROUTED, 0),
        under_investigation=counts.get(ReportStatus.UNDER_INVESTIGATION, 0),
        archived=counts.get(ReportStatus.ARCHIVED, 0),
        rejected=counts.get(ReportStatus.REJECTED, 0),
    )


@router.get("/categories", response_model=list[CategoryCount])
def get_categories(db: DbSession, _: CurrentUser):
    effective_category = func.coalesce(Report.validated_category, Report.ai_category)
    totals: Counter[Category] = Counter()
    # Reports still awaiting classification have no category yet and are counted as OTHER.
    for category, total in db.query(effective_category, func.count(Report.id)).group_by(effective_category):
        totals[category or Category.OTHER] += total
    return [CategoryCount(category=category, total=total) for category, total in totals.most_common()]


@router.get("/statuses", response_model=list[StatusCount])
def get_statuses(db: DbSession, _: CurrentUser):
    totals = dict(db.query(Report.status, func.count(Report.id)).group_by(Report.status).all())
    # Ordered along the workflow, so the chart reads from intake to closure.
    return [
        StatusCount(status=report_status, total=totals[report_status])
        for report_status in ReportStatus
        if report_status in totals
    ]


@router.get("/priorities", response_model=list[PriorityCount])
def get_priorities(db: DbSession, _: CurrentUser):
    effective_priority = func.coalesce(Report.validated_priority, Report.ai_priority)
    totals: Counter[Priority] = Counter()
    for priority, total in db.query(effective_priority, func.count(Report.id)).group_by(effective_priority):
        totals[priority or Priority.MEDIUM] += total
    return [PriorityCount(priority=priority, total=totals[priority]) for priority in PRIORITY_ORDER if totals[priority]]


@router.get("/monthly", response_model=list[MonthlyCount])
def get_monthly(db: DbSession, _: CurrentUser):
    # Grouped in Python: month extraction differs between SQLite and PostgreSQL.
    counts = Counter(created_at.strftime("%Y-%m") for (created_at,) in db.query(Report.created_at).all())
    # Months without reports are included as zero so the chart shows a continuous timeline.
    return [MonthlyCount(month=month, total=counts[month]) for month in _recent_months(MONTHS_SHOWN)]


def _recent_months(count: int) -> list[str]:
    """The last `count` calendar months as "YYYY-MM", oldest first, ending with the current one."""
    today = utc_now()
    months = []
    for offset in range(count - 1, -1, -1):
        year, month_index = divmod(today.year * 12 + today.month - 1 - offset, 12)
        months.append(f"{year}-{month_index + 1:02d}")
    return months
