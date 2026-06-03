from datetime import datetime, timezone

from sqlalchemy import Select, delete, select
from sqlalchemy.orm import Session

from app.modules.notes.model import NoteTag, Tag


def list_tags(db: Session, *, user_id: str) -> list[Tag]:
    statement: Select[tuple[Tag]] = select(Tag).where(
        Tag.user_id == user_id,
        Tag.deleted_at.is_(None),
    )
    return list(db.execute(statement.order_by(Tag.name.asc())).scalars().all())


def get_tag(db: Session, *, user_id: str, tag_id: str) -> Tag | None:
    return db.execute(
        select(Tag).where(
            Tag.id == tag_id,
            Tag.user_id == user_id,
            Tag.deleted_at.is_(None),
        )
    ).scalar_one_or_none()


def get_tag_by_slug(
    db: Session,
    *,
    user_id: str,
    slug: str,
    exclude_tag_id: str | None = None,
) -> Tag | None:
    statement = select(Tag).where(
        Tag.user_id == user_id,
        Tag.slug == slug,
        Tag.deleted_at.is_(None),
    )
    if exclude_tag_id:
        statement = statement.where(Tag.id != exclude_tag_id)
    return db.execute(statement).scalar_one_or_none()


def create_tag(db: Session, *, user_id: str, name: str, slug: str) -> Tag:
    tag = Tag(user_id=user_id, name=name, slug=slug)
    db.add(tag)
    db.flush()
    return tag


def remove_note_tags_for_tag(db: Session, *, user_id: str, tag_id: str) -> None:
    db.execute(delete(NoteTag).where(NoteTag.user_id == user_id, NoteTag.tag_id == tag_id))


def soft_delete_tag(tag: Tag) -> None:
    tag.deleted_at = datetime.now(timezone.utc)
