from pydantic import BaseModel

from app.models import Category, Priority, ReportStatus


class DashboardStats(BaseModel):
    total: int
    pending_review: int
    under_review: int
    validated: int
    routed: int
    under_investigation: int
    archived: int
    rejected: int


class CategoryCount(BaseModel):
    category: Category
    total: int


class StatusCount(BaseModel):
    status: ReportStatus
    total: int


class PriorityCount(BaseModel):
    priority: Priority
    total: int


class MonthlyCount(BaseModel):
    month: str  # "YYYY-MM"; formatting is left to the client.
    total: int
