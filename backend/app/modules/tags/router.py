from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.tags import service
from app.modules.tags.schema import TagCreate, TagResponse, TagUpdate
from app.shared.dependencies.auth import CurrentUser
from app.shared.dependencies.db import get_db

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagResponse])
def list_tags(current_user: CurrentUser, db: Session = Depends(get_db)) -> list[TagResponse]:
    return service.list_tags(db, current_user)


@router.post("", response_model=TagResponse, status_code=201)
def create_tag(payload: TagCreate, current_user: CurrentUser, db: Session = Depends(get_db)) -> TagResponse:
    return service.create_tag(db, current_user, payload)


@router.put("/{tag_id}", response_model=TagResponse)
def update_tag(tag_id: str, payload: TagUpdate, current_user: CurrentUser, db: Session = Depends(get_db)) -> TagResponse:
    return service.update_tag(db, current_user, tag_id, payload)


@router.delete("/{tag_id}", response_model=TagResponse)
def delete_tag(tag_id: str, current_user: CurrentUser, db: Session = Depends(get_db)) -> TagResponse:
    return service.delete_tag(db, current_user, tag_id)
