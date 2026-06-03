from datetime import datetime, time
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.dashboard.schema import DashboardSummary
from app.modules.notes.model import Note, NotePriority, NoteStatus
from app.modules.users.model import User


def get_summary(db: Session, current_user: User) -> DashboardSummary:
    user_id = str(current_user.id)
    tz = ZoneInfo("Asia/Ho_Chi_Minh")
    today = datetime.now(tz).date()
    start = datetime.combine(today, time.min, tzinfo=tz)
    end = datetime.combine(today, time.max, tzinfo=tz)
    now = datetime.now(tz)

    def count(*conditions) -> int:
        return int(
            db.execute(
                select(func.count(Note.id)).where(
                    Note.user_id == user_id,
                    Note.deleted_at.is_(None),
                    *conditions,
                )
            ).scalar_one()
        )

    return DashboardSummary(
        today_count=count(Note.deadline_at.is_not(None), Note.deadline_at >= start, Note.deadline_at <= end),
        overdue_count=count(Note.deadline_at.is_not(None), Note.deadline_at < now, Note.status != NoteStatus.DONE),
        doing_count=count(Note.status == NoteStatus.DOING),
        pending_count=count(Note.status == NoteStatus.PENDING),
        done_count=count(Note.status == NoteStatus.DONE),
        high_priority_count=count(Note.priority == NotePriority.HIGH),
        critical_count=count(Note.priority == NotePriority.CRITICAL),
    )
