from datetime import datetime, timezone

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.modules.notes.model import Assignee, Note, Subtask


def list_assignees(db: Session, *, user_id: str, include_inactive: bool = True) -> list[Assignee]:
    statement: Select[tuple[Assignee]] = select(Assignee).where(
        Assignee.user_id == user_id,
        Assignee.deleted_at.is_(None),
    )
    if not include_inactive:
        statement = statement.where(Assignee.is_active.is_(True))
    return list(db.execute(statement.order_by(Assignee.name.asc())).scalars().all())


def get_assignee(db: Session, *, user_id: str, assignee_id: str) -> Assignee | None:
    return db.execute(
        select(Assignee).where(
            Assignee.id == assignee_id,
            Assignee.user_id == user_id,
            Assignee.deleted_at.is_(None),
        )
    ).scalar_one_or_none()


def get_assignee_by_name(
    db: Session,
    *,
    user_id: str,
    name: str,
    exclude_assignee_id: str | None = None,
) -> Assignee | None:
    statement = select(Assignee).where(
        Assignee.user_id == user_id,
        Assignee.name == name,
        Assignee.deleted_at.is_(None),
    )
    if exclude_assignee_id:
        statement = statement.where(Assignee.id != exclude_assignee_id)
    return db.execute(statement).scalar_one_or_none()


def create_assignee(db: Session, *, user_id: str, name: str, phone: str | None, email: str | None, note: str | None) -> Assignee:
    assignee = Assignee(user_id=user_id, name=name, phone=phone, email=email, note=note, is_active=True)
    db.add(assignee)
    db.flush()
    return assignee


def is_assignee_in_use(db: Session, *, user_id: str, assignee_id: str) -> bool:
    note_exists = db.execute(
        select(Note.id).where(
            Note.user_id == user_id,
            Note.main_assignee_id == assignee_id,
            Note.deleted_at.is_(None),
        )
    ).first()
    if note_exists:
        return True
    return db.execute(
        select(Subtask.id).where(
            Subtask.user_id == user_id,
            Subtask.assignee_id == assignee_id,
            Subtask.deleted_at.is_(None),
        )
    ).first() is not None


def soft_delete_assignee(assignee: Assignee) -> None:
    assignee.deleted_at = datetime.now(timezone.utc)


def deactivate_assignee(assignee: Assignee) -> None:
    assignee.is_active = False


def activate_assignee(assignee: Assignee) -> None:
    assignee.is_active = True
