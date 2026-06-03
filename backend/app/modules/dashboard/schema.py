from pydantic import BaseModel


class DashboardSummary(BaseModel):
    today_count: int
    overdue_count: int
    doing_count: int
    pending_count: int
    done_count: int
    high_priority_count: int
    critical_count: int
