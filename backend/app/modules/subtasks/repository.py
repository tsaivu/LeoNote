from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.notes.model import Assignee, Subtask


def get_subtask(db: Session, *, user_id: str, subtask_id: str, include_deleted: bool = False) -> Subtask | None:
    statement = select(Subtask).where(Subtask.id == subtask_id, Subtask.user_id == user_id)
    if not include_deleted:
        statement = statement.where(Subtask.deleted_at.is_(None))
    return db.execute(statement).scalar_one_or_none()


def get_active_assignee(db: Session, *, user_id: str, assignee_id: str) -> Assignee | None:
    return db.execute(
        select(Assignee).where(
            Assignee.id == assignee_id,
            Assignee.user_id == user_id,
            Assignee.is_active.is_(True),
            Assignee.deleted_at.is_(None),
        )
    ).scalar_one_or_none()


def soft_delete(subtask: Subtask) -> None:
    subtask.deleted_at = datetime.now(timezone.utc)


def restore(subtask: Subtask) -> None:
    subtask.deleted_at = None
