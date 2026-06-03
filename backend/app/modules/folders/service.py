from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.folders import repository
from app.modules.folders.schema import FolderCreate, FolderResponse, FolderUpdate
from app.modules.notes.model import Folder
from app.modules.users.model import User


def _to_response(folder: Folder) -> FolderResponse:
    return FolderResponse(
        id=str(folder.id),
        parent_id=str(folder.parent_id) if folder.parent_id else None,
        name=folder.name,
        sort_order=folder.sort_order,
        is_system=folder.is_system,
        deleted_at=folder.deleted_at.isoformat() if folder.deleted_at else None,
    )


def list_folders(db: Session, current_user: User) -> list[FolderResponse]:
    return [_to_response(item) for item in repository.list_folders(db, user_id=str(current_user.id))]


def create_folder(db: Session, current_user: User, payload: FolderCreate) -> FolderResponse:
    user_id = str(current_user.id)
    if payload.parent_id and repository.get_folder(db, user_id=user_id, folder_id=payload.parent_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent folder not found")
    if repository.get_folder_by_name_and_parent(db, user_id=user_id, name=payload.name, parent_id=payload.parent_id) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="FOLDER_DUPLICATED")
    folder = repository.create_folder(db, user_id=user_id, **payload.model_dump())
    db.commit()
    db.refresh(folder)
    return _to_response(folder)


def _would_create_cycle(db: Session, *, user_id: str, folder_id: str, parent_id: str | None) -> bool:
    visited: set[str] = set()
    current_parent_id = parent_id
    while current_parent_id:
        if current_parent_id == folder_id or current_parent_id in visited:
            return True
        visited.add(current_parent_id)
        parent = repository.get_folder(db, user_id=user_id, folder_id=current_parent_id)
        if parent is None:
            return False
        current_parent_id = str(parent.parent_id) if parent.parent_id else None
    return False


def update_folder(db: Session, current_user: User, folder_id: str, payload: FolderUpdate) -> FolderResponse:
    user_id = str(current_user.id)
    folder = repository.get_folder(db, user_id=user_id, folder_id=folder_id)
    if folder is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    if payload.parent_id == folder_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="FOLDER_INVALID_PARENT")
    if payload.parent_id and repository.get_folder(db, user_id=user_id, folder_id=payload.parent_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent folder not found")
    if _would_create_cycle(db, user_id=user_id, folder_id=folder_id, parent_id=payload.parent_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="FOLDER_CYCLE_DETECTED")
    if (
        repository.get_folder_by_name_and_parent(
            db,
            user_id=user_id,
            name=payload.name,
            parent_id=payload.parent_id,
            exclude_folder_id=folder_id,
        )
        is not None
    ):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="FOLDER_DUPLICATED")
    folder.name = payload.name
    folder.parent_id = payload.parent_id
    folder.sort_order = payload.sort_order
    db.commit()
    db.refresh(folder)
    return _to_response(folder)


def delete_folder(db: Session, current_user: User, folder_id: str) -> FolderResponse:
    user_id = str(current_user.id)
    folder = repository.get_folder(db, user_id=user_id, folder_id=folder_id)
    if folder is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    if folder.is_system:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="FOLDER_IS_SYSTEM")
    if repository.has_active_children(db, user_id=user_id, folder_id=folder_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="FOLDER_HAS_ACTIVE_CHILDREN")
    inbox = repository.get_inbox(db, user_id=user_id)
    if inbox is None:
        inbox = repository.create_folder(db, user_id=user_id, name="Inbox", parent_id=None, sort_order=0, is_system=True)
    repository.move_active_notes_to_folder(db, user_id=user_id, from_folder_id=folder_id, to_folder_id=str(inbox.id))
    repository.soft_delete_folder(folder)
    db.commit()
    db.refresh(folder)
    return _to_response(folder)
