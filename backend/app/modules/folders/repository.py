from datetime import datetime, timezone

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.modules.notes.model import Folder, Note


def list_folders(db: Session, *, user_id: str) -> list[Folder]:
    statement: Select[tuple[Folder]] = select(Folder).where(
        Folder.user_id == user_id,
        Folder.deleted_at.is_(None),
    )
    return list(db.execute(statement.order_by(Folder.sort_order.asc(), Folder.name.asc())).scalars().all())


def get_folder(db: Session, *, user_id: str, folder_id: str) -> Folder | None:
    return db.execute(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.user_id == user_id,
            Folder.deleted_at.is_(None),
        )
    ).scalar_one_or_none()


def get_inbox(db: Session, *, user_id: str) -> Folder | None:
    return db.execute(
        select(Folder).where(
            Folder.user_id == user_id,
            Folder.is_system.is_(True),
            Folder.name == "Inbox",
            Folder.deleted_at.is_(None),
        )
    ).scalar_one_or_none()


def get_folder_by_name_and_parent(
    db: Session,
    *,
    user_id: str,
    name: str,
    parent_id: str | None,
    exclude_folder_id: str | None = None,
) -> Folder | None:
    statement = select(Folder).where(
        Folder.user_id == user_id,
        Folder.name == name,
        Folder.parent_id == parent_id,
        Folder.deleted_at.is_(None),
    )
    if exclude_folder_id:
        statement = statement.where(Folder.id != exclude_folder_id)
    return db.execute(statement).scalar_one_or_none()


def create_folder(db: Session, *, user_id: str, name: str, parent_id: str | None, sort_order: int, is_system: bool = False) -> Folder:
    folder = Folder(user_id=user_id, name=name, parent_id=parent_id, sort_order=sort_order, is_system=is_system)
    db.add(folder)
    db.flush()
    return folder


def has_active_children(db: Session, *, user_id: str, folder_id: str) -> bool:
    return db.execute(
        select(Folder.id).where(
            Folder.user_id == user_id,
            Folder.parent_id == folder_id,
            Folder.deleted_at.is_(None),
        )
    ).first() is not None


def move_active_notes_to_folder(db: Session, *, user_id: str, from_folder_id: str, to_folder_id: str) -> None:
    notes = db.execute(
        select(Note).where(
            Note.user_id == user_id,
            Note.folder_id == from_folder_id,
            Note.deleted_at.is_(None),
        )
    ).scalars()
    for note in notes:
        note.folder_id = to_folder_id


def soft_delete_folder(folder: Folder) -> None:
    folder.deleted_at = datetime.now(timezone.utc)


def restore_folder(folder: Folder) -> None:
    folder.deleted_at = None
