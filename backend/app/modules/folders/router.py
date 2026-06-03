from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.folders import service
from app.modules.folders.schema import FolderCreate, FolderResponse, FolderUpdate
from app.shared.dependencies.auth import CurrentUser
from app.shared.dependencies.db import get_db

router = APIRouter(prefix="/folders", tags=["folders"])


@router.get("/tree", response_model=list[FolderResponse])
def list_folders(current_user: CurrentUser, db: Session = Depends(get_db)) -> list[FolderResponse]:
    return service.list_folders(db, current_user)


@router.post("", response_model=FolderResponse, status_code=201)
def create_folder(payload: FolderCreate, current_user: CurrentUser, db: Session = Depends(get_db)) -> FolderResponse:
    return service.create_folder(db, current_user, payload)


@router.put("/{folder_id}", response_model=FolderResponse)
def update_folder(folder_id: str, payload: FolderUpdate, current_user: CurrentUser, db: Session = Depends(get_db)) -> FolderResponse:
    return service.update_folder(db, current_user, folder_id, payload)


@router.delete("/{folder_id}", response_model=FolderResponse)
def delete_folder(folder_id: str, current_user: CurrentUser, db: Session = Depends(get_db)) -> FolderResponse:
    return service.delete_folder(db, current_user, folder_id)
