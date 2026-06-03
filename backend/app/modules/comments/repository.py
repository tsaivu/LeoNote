import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.notes.model import NoteComment
from app.modules.users.model import User


def list_comments(db: Session, *, user_id: str, note_id: str) -> list[NoteComment]:
    return list(
        db.execute(
            select(NoteComment)
            .where(
                NoteComment.user_id == user_id,
                NoteComment.note_id == note_id,
                NoteComment.deleted_at.is_(None),
            )
            .order_by(NoteComment.created_at.desc())
        ).scalars().all()
    )


def create_comment(
    db: Session,
    *,
    user_id: str,
    note_id: str,
    author_user_id: str,
    content: str,
    kind: str,
) -> NoteComment:
    comment = NoteComment(
        user_id=uuid.UUID(user_id),
        note_id=uuid.UUID(note_id),
        author_user_id=uuid.UUID(author_user_id),
        content=content,
        kind=kind,
    )
    db.add(comment)
    db.flush()
    return comment


def get_user(db: Session, *, user_id: str) -> User | None:
    return db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None))).scalar_one_or_none()
