from datetime import datetime, time, timezone
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.notes import repository
from app.modules.notes.model import Note, NotePriority, NoteStatus, Subtask, SubtaskStatus
from app.modules.notes.schema import EntityRef, NotePayload, NoteResponse, SubtaskPayload, SubtaskResponse, TagRef
from app.modules.users.model import User
from app.shared.utils.text_normalize import normalize_search_text


def _validate_status(value: str) -> NoteStatus:
    try:
        return NoteStatus(value)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="NOTE_INVALID_STATUS") from exc


def _validate_priority(value: str) -> NotePriority:
    try:
        return NotePriority(value)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="NOTE_INVALID_PRIORITY") from exc


def _validate_subtask_status(value: str) -> SubtaskStatus:
    try:
        return SubtaskStatus(value)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SUBTASK_INVALID_STATUS") from exc


def _normalize_progress_percent(value: int) -> int:
    return max(0, min(100, value))


def _sync_completed_at(entity: Note | Subtask) -> None:
    is_done = entity.status.value == "DONE"
    entity.completed_at = datetime.now(timezone.utc) if is_done and entity.completed_at is None else entity.completed_at
    if not is_done:
        entity.completed_at = None


def _build_search_text(note: Note, tag_names: list[str], assignee_name: str, extra_terms: list[str] | None = None) -> str:
    return normalize_search_text(" ".join([note.title, note.content or "", assignee_name, *tag_names, *(extra_terms or [])]))


def _to_response(db: Session, note: Note) -> NoteResponse:
    user_id = str(note.user_id)
    folder = repository.get_folder(db, user_id=user_id, folder_id=str(note.folder_id))
    assignee = repository.get_assignee(db, user_id=user_id, assignee_id=str(note.main_assignee_id))
    assignees = repository.list_note_assignees(db, user_id=user_id, note_id=str(note.id))
    tags = repository.list_note_tags(db, user_id=user_id, note_id=str(note.id))
    subtasks = repository.list_subtasks(db, user_id=user_id, note_id=str(note.id))
    if folder is None or assignee is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid note references")
    if not assignees:
        assignees = [assignee]
    return NoteResponse(
        id=str(note.id),
        title=note.title,
        content=note.content,
        folder=EntityRef(id=str(folder.id), name=folder.name),
        main_assignee=EntityRef(id=str(assignee.id), name=assignee.name, is_active=assignee.is_active),
        assignees=[EntityRef(id=str(item.id), name=item.name, is_active=item.is_active) for item in assignees],
        status=note.status.value,
        priority=note.priority.value,
        progress_percent=note.progress_percent,
        deadline_at=note.deadline_at,
        completed_at=note.completed_at,
        tags=[TagRef(id=str(tag.id), name=tag.name, slug=tag.slug) for tag in tags],
        subtasks=[
            SubtaskResponse(
                id=str(subtask.id),
                title=subtask.title,
                content=subtask.content,
                assignee=EntityRef(
                    id=str(subtask.assignee_id),
                    name=(repository.get_assignee(db, user_id=user_id, assignee_id=str(subtask.assignee_id)) or assignee).name,
                    is_active=(repository.get_assignee(db, user_id=user_id, assignee_id=str(subtask.assignee_id)) or assignee).is_active,
                ),
                priority=subtask.priority.value,
                deadline_at=subtask.deadline_at,
                status=subtask.status.value,
                sort_order=subtask.sort_order,
                completed_at=subtask.completed_at,
            )
            for subtask in subtasks
        ],
        created_at=note.created_at,
        updated_at=note.updated_at,
        deleted_at=note.deleted_at,
    )


def list_notes_for_user(
    db: Session,
    current_user: User,
    *,
    q: str | None = None,
    folder_id: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    main_assignee_id: str | None = None,
    subtask_assignee_id: str | None = None,
    tag_ids: list[str] | None = None,
    deadline_from: datetime | None = None,
    deadline_to: datetime | None = None,
    quick_filter: str | None = None,
    include_deleted: bool = False,
) -> list[NoteResponse]:
    if quick_filter == "today":
        tz = ZoneInfo("Asia/Ho_Chi_Minh")
        today = datetime.now(tz).date()
        deadline_from = datetime.combine(today, time.min, tzinfo=tz)
        deadline_to = datetime.combine(today, time.max, tzinfo=tz)
    elif quick_filter == "overdue":
        deadline_to = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    elif quick_filter == "doing":
        status = "DOING"
    elif quick_filter == "pending":
        status = "PENDING"
    elif quick_filter == "done":
        status = "DONE"
    elif quick_filter == "high_priority":
        priority = "HIGH"
    elif quick_filter == "critical":
        priority = "CRITICAL"

    notes = repository.get_notes_for_user(
        db,
        user_id=str(current_user.id),
        include_deleted=include_deleted,
        q=normalize_search_text(q),
        folder_id=folder_id,
        status=status,
        priority=priority,
        main_assignee_id=main_assignee_id,
        subtask_assignee_id=subtask_assignee_id,
        tag_ids=tag_ids,
        deadline_from=deadline_from,
        deadline_to=deadline_to,
    )
    if quick_filter == "overdue":
        notes = [note for note in notes if note.status != NoteStatus.DONE]
    return [_to_response(db, note) for note in notes]


def get_note(db: Session, current_user: User, note_id: str, include_deleted: bool = False) -> NoteResponse:
    note = repository.get_note(db, user_id=str(current_user.id), note_id=note_id, include_deleted=include_deleted)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOTE_NOT_FOUND")
    return _to_response(db, note)


def _resolve_folder(db: Session, user_id: str, folder_id: str | None):
    if folder_id:
        folder = repository.get_folder(db, user_id=user_id, folder_id=folder_id)
    else:
        folder = repository.get_inbox(db, user_id=user_id)
    if folder is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FOLDER_NOT_FOUND")
    return folder


def _validate_payload_refs(db: Session, user_id: str, payload: NotePayload):
    folder = _resolve_folder(db, user_id, payload.folder_id)
    assignee = repository.get_assignee(db, user_id=user_id, assignee_id=payload.main_assignee_id, active_only=True)
    if assignee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ASSIGNEE_NOT_FOUND_OR_INACTIVE")
    assignee_ids = list(dict.fromkeys([payload.main_assignee_id, *payload.assignee_ids]))
    assignees = repository.get_assignees(db, user_id=user_id, assignee_ids=assignee_ids, active_only=True)
    if len(assignees) != len(set(assignee_ids)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ASSIGNEE_NOT_FOUND_OR_INACTIVE")
    tags = repository.get_tags(db, user_id=user_id, tag_ids=payload.tag_ids)
    if len(tags) != len(set(payload.tag_ids)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TAG_NOT_FOUND")
    for subtask in payload.subtasks:
        if repository.get_assignee(db, user_id=user_id, assignee_id=subtask.assignee_id, active_only=True) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SUBTASK_ASSIGNEE_NOT_FOUND_OR_INACTIVE")
    return folder, assignee, assignee_ids, tags


def create_note(db: Session, current_user: User, payload: NotePayload) -> NoteResponse:
    user_id = str(current_user.id)
    try:
        folder, assignee, assignee_ids, tags = _validate_payload_refs(db, user_id, payload)
        note = Note(
            user_id=current_user.id,
            folder_id=folder.id,
            main_assignee_id=assignee.id,
            title=payload.title,
            content=payload.content,
            status=_validate_status(payload.status),
            priority=_validate_priority(payload.priority),
            progress_percent=100 if payload.status == "DONE" else _normalize_progress_percent(payload.progress_percent),
            deadline_at=payload.deadline_at,
        )
        _sync_completed_at(note)
        note.search_text = _build_search_text(
            note,
            [tag.name for tag in tags],
            assignee.name,
            [f"{item.title} {item.content or ''}" for item in payload.subtasks],
        )
        repository.create_note(db, note)
        repository.replace_note_assignees(db, user_id=user_id, note_id=str(note.id), assignee_ids=assignee_ids)
        repository.replace_note_tags(db, user_id=user_id, note_id=str(note.id), tag_ids=payload.tag_ids)
        for item in payload.subtasks:
            subtask = Subtask(
                user_id=current_user.id,
                note_id=note.id,
                assignee_id=item.assignee_id,
                title=item.title,
                content=item.content,
                priority=_validate_priority(item.priority),
                deadline_at=item.deadline_at,
                status=_validate_subtask_status(item.status),
                sort_order=item.sort_order,
            )
            _sync_completed_at(subtask)
            db.add(subtask)
        db.commit()
        db.refresh(note)
        return _to_response(db, note)
    except Exception:
        db.rollback()
        raise


def update_note(db: Session, current_user: User, note_id: str, payload: NotePayload) -> NoteResponse:
    user_id = str(current_user.id)
    note = repository.get_note(db, user_id=user_id, note_id=note_id)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOTE_NOT_FOUND")
    try:
        folder, assignee, assignee_ids, tags = _validate_payload_refs(db, user_id, payload)
        note.folder_id = folder.id
        note.main_assignee_id = assignee.id
        note.title = payload.title
        note.content = payload.content
        note.status = _validate_status(payload.status)
        note.priority = _validate_priority(payload.priority)
        note.progress_percent = 100 if payload.status == "DONE" else _normalize_progress_percent(payload.progress_percent)
        note.deadline_at = payload.deadline_at
        _sync_completed_at(note)
        note.search_text = _build_search_text(
            note,
            [tag.name for tag in tags],
            assignee.name,
            [f"{item.title} {item.content or ''}" for item in payload.subtasks],
        )
        repository.replace_note_assignees(db, user_id=user_id, note_id=note_id, assignee_ids=assignee_ids)
        repository.replace_note_tags(db, user_id=user_id, note_id=note_id, tag_ids=payload.tag_ids)
        keep_ids: set[str] = set()
        for item in payload.subtasks:
            subtask = repository.get_subtask(db, user_id=user_id, note_id=note_id, subtask_id=item.id) if item.id else None
            if subtask is None:
                subtask = Subtask(user_id=current_user.id, note_id=note.id, assignee_id=item.assignee_id, title=item.title)
                db.add(subtask)
                db.flush()
            subtask.title = item.title
            subtask.content = item.content
            subtask.assignee_id = item.assignee_id
            subtask.priority = _validate_priority(item.priority)
            subtask.deadline_at = item.deadline_at
            subtask.status = _validate_subtask_status(item.status)
            subtask.sort_order = item.sort_order
            subtask.deleted_at = None
            _sync_completed_at(subtask)
            keep_ids.add(str(subtask.id))
        repository.soft_delete_missing_subtasks(db, user_id=user_id, note_id=note_id, keep_ids=keep_ids)
        db.commit()
        db.refresh(note)
        return _to_response(db, note)
    except Exception:
        db.rollback()
        raise


def soft_delete_note(db: Session, current_user: User, note_id: str) -> NoteResponse:
    note = repository.get_note(db, user_id=str(current_user.id), note_id=note_id)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOTE_NOT_FOUND")
    repository.soft_delete_note(note)
    db.commit()
    db.refresh(note)
    return _to_response(db, note)


def restore_note(db: Session, current_user: User, note_id: str) -> NoteResponse:
    note = repository.get_note(db, user_id=str(current_user.id), note_id=note_id, include_deleted=True)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NOTE_NOT_FOUND")
    repository.restore_note(note)
    db.commit()
    db.refresh(note)
    return _to_response(db, note)
