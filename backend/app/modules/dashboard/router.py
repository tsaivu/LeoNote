from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.dashboard.schema import DashboardSummary
from app.modules.dashboard.service import get_summary
from app.shared.dependencies.auth import CurrentUser
from app.shared.dependencies.db import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(current_user: CurrentUser, db: Session = Depends(get_db)) -> DashboardSummary:
    return get_summary(db, current_user)
