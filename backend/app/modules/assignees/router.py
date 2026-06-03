from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.assignees import service
from app.modules.assignees.schema import AssigneeCreate, AssigneeResponse, AssigneeUpdate
from app.shared.dependencies.auth import CurrentUser
from app.shared.dependencies.db import get_db

router = APIRouter(prefix="/assignees", tags=["assignees"])


@router.get("", response_model=list[AssigneeResponse])
def list_assignees(current_user: CurrentUser, db: Session = Depends(get_db)) -> list[AssigneeResponse]:
    return service.list_assignees(db, current_user)


@router.post("", response_model=AssigneeResponse, status_code=201)
def create_assignee(payload: AssigneeCreate, current_user: CurrentUser, db: Session = Depends(get_db)) -> AssigneeResponse:
    return service.create_assignee(db, current_user, payload)


@router.put("/{assignee_id}", response_model=AssigneeResponse)
def update_assignee(assignee_id: str, payload: AssigneeUpdate, current_user: CurrentUser, db: Session = Depends(get_db)) -> AssigneeResponse:
    return service.update_assignee(db, current_user, assignee_id, payload)


@router.delete("/{assignee_id}", response_model=AssigneeResponse)
def delete_assignee(assignee_id: str, current_user: CurrentUser, db: Session = Depends(get_db)) -> AssigneeResponse:
    return service.delete_assignee(db, current_user, assignee_id)


@router.post("/{assignee_id}/deactivate", response_model=AssigneeResponse)
def deactivate_assignee(assignee_id: str, current_user: CurrentUser, db: Session = Depends(get_db)) -> AssigneeResponse:
    return service.set_assignee_active(db, current_user, assignee_id, False)


@router.post("/{assignee_id}/activate", response_model=AssigneeResponse)
def activate_assignee(assignee_id: str, current_user: CurrentUser, db: Session = Depends(get_db)) -> AssigneeResponse:
    return service.set_assignee_active(db, current_user, assignee_id, True)
