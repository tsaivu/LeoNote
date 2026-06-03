from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.comments import repository
from app.modules.comments.schema import NoteCommentCreate, NoteCommentResponse
from app.modules.notes import repository as notes_repository
from app.modules.notes.model import NoteComment
from app.modules.users.model import User


def _author_name(db: Session, comment: NoteComment) -> str:
    author = repository.get_user(db, user_id=str(comment.author_user_id))
    if author is None:
        return "Unknown"
    return author.display_name or author.username


def _to_response(db: Session, comment: NoteComment) -> NoteCommentResponse:
    return NoteCommentResponse(
        id=str(comment.id),
        note_id=str(comment.note_id),
        author_user_id=str(comment.author_user_id),
        author_name=_author_name(db, comment),
        content=comment.content,
        kind=comment.kind,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        deleted_at=comment.deleted_at,
    )


def list_note_comments(db: Session, current_user: User, note_id: str) -> list[NoteCommentResponse]:
    note = notes_repository.get_note(db, user_id=str(current_user.id), note_id=note_id)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOTE_NOT_FOUND")
    comments = repository.list_comments(db, user_id=str(current_user.id), note_id=note_id)
    return [_to_response(db, comment) for comment in comments]


def create_note_comment(db: Session, current_user: User, note_id: str, payload: NoteCommentCreate) -> NoteCommentResponse:
    note = notes_repository.get_note(db, user_id=str(current_user.id), note_id=note_id)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOTE_NOT_FOUND")
    kind = payload.kind.upper()
    if kind not in {"COMMENT", "TIMELINE_NOTE"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="COMMENT_KIND_INVALID")
    try:
        comment = repository.create_comment(
            db,
            user_id=str(current_user.id),
            note_id=note_id,
            author_user_id=str(current_user.id),
            content=payload.content,
            kind=kind,
        )
        db.commit()
        db.refresh(comment)
        return _to_response(db, comment)
    except Exception:
        db.rollback()
        raise
