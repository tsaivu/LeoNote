from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.notes import service as notes_service
from app.modules.notes.schema import NoteResponse
from app.shared.dependencies.auth import CurrentUser
from app.shared.dependencies.db import get_db

router = APIRouter(prefix="/trash", tags=["trash"])


@router.get("/notes", response_model=list[NoteResponse])
def list_deleted_notes(current_user: CurrentUser, db: Session = Depends(get_db)) -> list[NoteResponse]:
    return [
        note
        for note in notes_service.list_notes_for_user(db, current_user, include_deleted=True)
        if note.deleted_at is not None
    ]


@router.post("/notes/{note_id}/restore", response_model=NoteResponse)
def restore_deleted_note(note_id: str, current_user: CurrentUser, db: Session = Depends(get_db)) -> NoteResponse:
    return notes_service.restore_note(db, current_user, note_id)
