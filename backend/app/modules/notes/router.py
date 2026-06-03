from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.modules.notes import service
from app.modules.notes.schema import NotePayload, NoteResponse
from app.shared.dependencies.auth import CurrentUser
from app.shared.dependencies.db import get_db

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteResponse])
def list_notes(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    q: str | None = None,
    folder_id: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    main_assignee_id: str | None = None,
    subtask_assignee_id: str | None = None,
    deadline_from: datetime | None = None,
    deadline_to: datetime | None = None,
    quick_filter: str | None = None,
    tag_ids: list[str] | None = Query(default=None),
    include_deleted: bool = False,
) -> list[NoteResponse]:
    return service.list_notes_for_user(
        db,
        current_user,
        q=q,
        folder_id=folder_id,
        status=status,
        priority=priority,
        main_assignee_id=main_assignee_id,
        subtask_assignee_id=subtask_assignee_id,
        deadline_from=deadline_from,
        deadline_to=deadline_to,
        quick_filter=quick_filter,
        tag_ids=tag_ids,
        include_deleted=include_deleted,
    )


@router.post("", response_model=NoteResponse, status_code=201)
def create_note(payload: NotePayload, current_user: CurrentUser, db: Session = Depends(get_db)) -> NoteResponse:
    return service.create_note(db, current_user, payload)


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: str, current_user: CurrentUser, db: Session = Depends(get_db)) -> NoteResponse:
    return service.get_note(db, current_user, note_id)


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: str, payload: NotePayload, current_user: CurrentUser, db: Session = Depends(get_db)) -> NoteResponse:
    return service.update_note(db, current_user, note_id, payload)


@router.delete("/{note_id}", response_model=NoteResponse)
def delete_note(note_id: str, current_user: CurrentUser, db: Session = Depends(get_db)) -> NoteResponse:
    return service.soft_delete_note(db, current_user, note_id)


@router.post("/{note_id}/restore", response_model=NoteResponse)
def restore_note(note_id: str, current_user: CurrentUser, db: Session = Depends(get_db)) -> NoteResponse:
    return service.restore_note(db, current_user, note_id)
