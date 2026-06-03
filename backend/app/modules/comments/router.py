from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.comments import service
from app.modules.comments.schema import NoteCommentCreate, NoteCommentResponse
from app.shared.dependencies.auth import CurrentUser
from app.shared.dependencies.db import get_db

router = APIRouter(prefix="/notes/{note_id}/comments", tags=["note-comments"])


@router.get("", response_model=list[NoteCommentResponse])
def list_comments(note_id: str, current_user: CurrentUser, db: Session = Depends(get_db)) -> list[NoteCommentResponse]:
    return service.list_note_comments(db, current_user, note_id)


@router.post("", response_model=NoteCommentResponse, status_code=201)
def create_comment(
    note_id: str,
    payload: NoteCommentCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> NoteCommentResponse:
    return service.create_note_comment(db, current_user, note_id, payload)
