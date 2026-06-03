from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.assignees import repository
from app.modules.assignees.schema import AssigneeCreate, AssigneeResponse, AssigneeUpdate
from app.modules.notes.model import Assignee
from app.modules.users.model import User


def _to_response(assignee: Assignee) -> AssigneeResponse:
    return AssigneeResponse(
        id=str(assignee.id),
        name=assignee.name,
        phone=assignee.phone,
        email=assignee.email,
        note=assignee.note,
        is_active=assignee.is_active,
        deleted_at=assignee.deleted_at.isoformat() if assignee.deleted_at else None,
    )


def list_assignees(db: Session, current_user: User) -> list[AssigneeResponse]:
    return [_to_response(item) for item in repository.list_assignees(db, user_id=str(current_user.id))]


def create_assignee(db: Session, current_user: User, payload: AssigneeCreate) -> AssigneeResponse:
    user_id = str(current_user.id)
    if repository.get_assignee_by_name(db, user_id=user_id, name=payload.name) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="ASSIGNEE_DUPLICATED")
    assignee = repository.create_assignee(db, user_id=user_id, **payload.model_dump())
    db.commit()
    db.refresh(assignee)
    return _to_response(assignee)


def update_assignee(db: Session, current_user: User, assignee_id: str, payload: AssigneeUpdate) -> AssigneeResponse:
    user_id = str(current_user.id)
    assignee = repository.get_assignee(db, user_id=user_id, assignee_id=assignee_id)
    if assignee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee not found")
    if repository.get_assignee_by_name(db, user_id=user_id, name=payload.name, exclude_assignee_id=assignee_id) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="ASSIGNEE_DUPLICATED")
    for field, value in payload.model_dump().items():
        setattr(assignee, field, value)
    db.commit()
    db.refresh(assignee)
    return _to_response(assignee)


def delete_assignee(db: Session, current_user: User, assignee_id: str) -> AssigneeResponse:
    assignee = repository.get_assignee(db, user_id=str(current_user.id), assignee_id=assignee_id)
    if assignee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee not found")
    if repository.is_assignee_in_use(db, user_id=str(current_user.id), assignee_id=assignee_id):
        repository.deactivate_assignee(assignee)
    else:
        repository.soft_delete_assignee(assignee)
    db.commit()
    db.refresh(assignee)
    return _to_response(assignee)


def set_assignee_active(db: Session, current_user: User, assignee_id: str, is_active: bool) -> AssigneeResponse:
    assignee = repository.get_assignee(db, user_id=str(current_user.id), assignee_id=assignee_id)
    if assignee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee not found")
    repository.activate_assignee(assignee) if is_active else repository.deactivate_assignee(assignee)
    db.commit()
    db.refresh(assignee)
    return _to_response(assignee)
