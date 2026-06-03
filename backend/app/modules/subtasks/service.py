from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.notes.model import SubtaskStatus
from app.modules.subtasks import repository
from app.modules.subtasks.schema import SubtaskPatch
from app.modules.users.model import User


def _status(value: str) -> SubtaskStatus:
    try:
        return SubtaskStatus(value)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SUBTASK_INVALID_STATUS") from exc


def patch_subtask(db: Session, current_user: User, subtask_id: str, payload: SubtaskPatch):
    subtask = repository.get_subtask(db, user_id=str(current_user.id), subtask_id=subtask_id)
    if subtask is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SUBTASK_NOT_FOUND")
    if payload.assignee_id is not None:
        assignee = repository.get_active_assignee(db, user_id=str(current_user.id), assignee_id=payload.assignee_id)
        if assignee is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ASSIGNEE_NOT_FOUND_OR_INACTIVE")
        subtask.assignee_id = payload.assignee_id
    if payload.title is not None:
        subtask.title = payload.title
    if payload.sort_order is not None:
        subtask.sort_order = payload.sort_order
    if payload.status is not None:
        subtask.status = _status(payload.status)
        subtask.completed_at = datetime.now(timezone.utc) if subtask.status == SubtaskStatus.DONE else None
    db.commit()
    db.refresh(subtask)
    return {"id": str(subtask.id), "status": subtask.status.value}


def delete_subtask(db: Session, current_user: User, subtask_id: str):
    subtask = repository.get_subtask(db, user_id=str(current_user.id), subtask_id=subtask_id)
    if subtask is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SUBTASK_NOT_FOUND")
    repository.soft_delete(subtask)
    db.commit()
    return {"id": str(subtask.id), "deleted": True}


def restore_subtask(db: Session, current_user: User, subtask_id: str):
    subtask = repository.get_subtask(db, user_id=str(current_user.id), subtask_id=subtask_id, include_deleted=True)
    if subtask is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SUBTASK_NOT_FOUND")
    repository.restore(subtask)
    db.commit()
    return {"id": str(subtask.id), "deleted": False}
