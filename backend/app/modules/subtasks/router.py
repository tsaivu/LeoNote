from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.subtasks import service
from app.modules.subtasks.schema import SubtaskPatch
from app.shared.dependencies.auth import CurrentUser
from app.shared.dependencies.db import get_db

router = APIRouter(prefix="/subtasks", tags=["subtasks"])


@router.patch("/{subtask_id}")
def patch_subtask(subtask_id: str, payload: SubtaskPatch, current_user: CurrentUser, db: Session = Depends(get_db)):
    return service.patch_subtask(db, current_user, subtask_id, payload)


@router.delete("/{subtask_id}")
def delete_subtask(subtask_id: str, current_user: CurrentUser, db: Session = Depends(get_db)):
    return service.delete_subtask(db, current_user, subtask_id)


@router.post("/{subtask_id}/restore")
def restore_subtask(subtask_id: str, current_user: CurrentUser, db: Session = Depends(get_db)):
    return service.restore_subtask(db, current_user, subtask_id)
