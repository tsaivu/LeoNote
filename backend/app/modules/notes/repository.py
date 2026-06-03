import uuid
from datetime import datetime, timezone

from sqlalchemy import Select, and_, delete, select
from sqlalchemy.orm import Session

from app.modules.notes.model import Assignee, Folder, Note, NoteAssignee, NoteTag, Subtask, Tag


def get_notes_for_user(
    db: Session,
    *,
    user_id: str,
    include_deleted: bool = False,
    q: str | None = None,
    folder_id: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    main_assignee_id: str | None = None,
    subtask_assignee_id: str | None = None,
    tag_ids: list[str] | None = None,
    deadline_from: datetime | None = None,
    deadline_to: datetime | None = None,
) -> list[Note]:
    statement: Select[tuple[Note]] = (
        select(Note)
        .where(
            Note.user_id == user_id,
        )
        .order_by(Note.created_at.desc())
    )
    if not include_deleted:
        statement = statement.where(Note.deleted_at.is_(None))
    if q:
        statement = statement.where(Note.search_text.ilike(f"%{q}%"))
    if folder_id:
        statement = statement.where(Note.folder_id == folder_id)
    if status:
        statement = statement.where(Note.status == status)
    if priority:
        statement = statement.where(Note.priority == priority)
    if main_assignee_id:
        statement = statement.where(Note.main_assignee_id == main_assignee_id)
    if subtask_assignee_id:
        statement = statement.join(Subtask, Subtask.note_id == Note.id).where(
            Subtask.user_id == user_id,
            Subtask.assignee_id == subtask_assignee_id,
            Subtask.deleted_at.is_(None),
        )
    if tag_ids:
        statement = statement.join(NoteTag, NoteTag.note_id == Note.id).where(
            NoteTag.user_id == user_id,
            NoteTag.tag_id.in_(tag_ids),
        )
    if deadline_from:
        statement = statement.where(Note.deadline_at >= deadline_from)
    if deadline_to:
        statement = statement.where(Note.deadline_at <= deadline_to)
    return list(db.execute(statement).scalars().all())


def get_note(db: Session, *, user_id: str, note_id: str, include_deleted: bool = False) -> Note | None:
    statement = select(Note).where(Note.id == note_id, Note.user_id == user_id)
    if not include_deleted:
        statement = statement.where(Note.deleted_at.is_(None))
    return db.execute(statement).scalar_one_or_none()


def get_folder(db: Session, *, user_id: str, folder_id: str) -> Folder | None:
    return db.execute(
        select(Folder).where(Folder.id == folder_id, Folder.user_id == user_id, Folder.deleted_at.is_(None))
    ).scalar_one_or_none()


def get_inbox(db: Session, *, user_id: str) -> Folder | None:
    return db.execute(
        select(Folder).where(Folder.user_id == user_id, Folder.name == "Inbox", Folder.is_system.is_(True), Folder.deleted_at.is_(None))
    ).scalar_one_or_none()


def get_assignee(db: Session, *, user_id: str, assignee_id: str, active_only: bool = False) -> Assignee | None:
    statement = select(Assignee).where(Assignee.id == assignee_id, Assignee.user_id == user_id, Assignee.deleted_at.is_(None))
    if active_only:
        statement = statement.where(Assignee.is_active.is_(True))
    return db.execute(statement).scalar_one_or_none()


def get_assignees(db: Session, *, user_id: str, assignee_ids: list[str], active_only: bool = False) -> list[Assignee]:
    if not assignee_ids:
        return []
    statement = select(Assignee).where(Assignee.id.in_(assignee_ids), Assignee.user_id == user_id, Assignee.deleted_at.is_(None))
    if active_only:
        statement = statement.where(Assignee.is_active.is_(True))
    return list(db.execute(statement).scalars().all())


def get_tags(db: Session, *, user_id: str, tag_ids: list[str]) -> list[Tag]:
    if not tag_ids:
        return []
    return list(
        db.execute(select(Tag).where(Tag.user_id == user_id, Tag.id.in_(tag_ids), Tag.deleted_at.is_(None))).scalars().all()
    )


def create_note(db: Session, note: Note) -> Note:
    db.add(note)
    db.flush()
    return note


def replace_note_tags(db: Session, *, user_id: str, note_id: str, tag_ids: list[str]) -> None:
    db.execute(delete(NoteTag).where(NoteTag.user_id == user_id, NoteTag.note_id == note_id))
    for tag_id in tag_ids:
        db.add(NoteTag(user_id=user_id, note_id=note_id, tag_id=tag_id))


def replace_note_assignees(db: Session, *, user_id: str, note_id: str, assignee_ids: list[str]) -> None:
    db.execute(delete(NoteAssignee).where(NoteAssignee.user_id == user_id, NoteAssignee.note_id == note_id))
    for assignee_id in assignee_ids:
        db.add(
            NoteAssignee(
                user_id=uuid.UUID(user_id),
                note_id=uuid.UUID(note_id),
                assignee_id=uuid.UUID(assignee_id),
            )
        )


def list_note_assignees(db: Session, *, user_id: str, note_id: str) -> list[Assignee]:
    return list(
        db.execute(
            select(Assignee)
            .join(NoteAssignee, NoteAssignee.assignee_id == Assignee.id)
            .where(NoteAssignee.user_id == user_id, NoteAssignee.note_id == note_id, Assignee.deleted_at.is_(None))
            .order_by(Assignee.name.asc())
        ).scalars().all()
    )


def list_note_tags(db: Session, *, user_id: str, note_id: str) -> list[Tag]:
    return list(
        db.execute(
            select(Tag)
            .join(NoteTag, NoteTag.tag_id == Tag.id)
            .where(NoteTag.user_id == user_id, NoteTag.note_id == note_id, Tag.deleted_at.is_(None))
            .order_by(Tag.name.asc())
        ).scalars().all()
    )


def list_subtasks(db: Session, *, user_id: str, note_id: str, include_deleted: bool = False) -> list[Subtask]:
    statement = select(Subtask).where(Subtask.user_id == user_id, Subtask.note_id == note_id)
    if not include_deleted:
        statement = statement.where(Subtask.deleted_at.is_(None))
    return list(db.execute(statement.order_by(Subtask.sort_order.asc(), Subtask.created_at.asc())).scalars().all())


def get_subtask(db: Session, *, user_id: str, note_id: str, subtask_id: str) -> Subtask | None:
    return db.execute(
        select(Subtask).where(
            Subtask.id == subtask_id,
            Subtask.user_id == user_id,
            Subtask.note_id == note_id,
            Subtask.deleted_at.is_(None),
        )
    ).scalar_one_or_none()


def soft_delete_missing_subtasks(db: Session, *, user_id: str, note_id: str, keep_ids: set[str]) -> None:
    now = datetime.now(timezone.utc)
    for subtask in list_subtasks(db, user_id=user_id, note_id=note_id):
        if str(subtask.id) not in keep_ids:
            subtask.deleted_at = now


def soft_delete_note(note: Note) -> None:
    note.deleted_at = datetime.now(timezone.utc)


def restore_note(note: Note) -> None:
    note.deleted_at = None
