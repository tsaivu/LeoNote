from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.notes.model import Tag
from app.modules.tags import repository
from app.modules.tags.schema import TagCreate, TagResponse, TagUpdate
from app.modules.users.model import User
from app.shared.utils.text_normalize import normalize_search_text


def _slug(name: str) -> str:
    return normalize_search_text(name).replace(" ", "-")


def _to_response(tag: Tag) -> TagResponse:
    return TagResponse(
        id=str(tag.id),
        name=tag.name,
        slug=tag.slug,
        deleted_at=tag.deleted_at.isoformat() if tag.deleted_at else None,
    )


def list_tags(db: Session, current_user: User) -> list[TagResponse]:
    return [_to_response(item) for item in repository.list_tags(db, user_id=str(current_user.id))]


def create_tag(db: Session, current_user: User, payload: TagCreate) -> TagResponse:
    user_id = str(current_user.id)
    slug = _slug(payload.name)
    if repository.get_tag_by_slug(db, user_id=user_id, slug=slug) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="TAG_DUPLICATED")
    tag = repository.create_tag(db, user_id=user_id, name=payload.name, slug=slug)
    db.commit()
    db.refresh(tag)
    return _to_response(tag)


def update_tag(db: Session, current_user: User, tag_id: str, payload: TagUpdate) -> TagResponse:
    user_id = str(current_user.id)
    tag = repository.get_tag(db, user_id=user_id, tag_id=tag_id)
    if tag is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    slug = _slug(payload.name)
    if repository.get_tag_by_slug(db, user_id=user_id, slug=slug, exclude_tag_id=tag_id) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="TAG_DUPLICATED")
    tag.name = payload.name
    tag.slug = slug
    db.commit()
    db.refresh(tag)
    return _to_response(tag)


def delete_tag(db: Session, current_user: User, tag_id: str) -> TagResponse:
    tag = repository.get_tag(db, user_id=str(current_user.id), tag_id=tag_id)
    if tag is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    repository.remove_note_tags_for_tag(db, user_id=str(current_user.id), tag_id=tag_id)
    repository.soft_delete_tag(tag)
    db.commit()
    db.refresh(tag)
    return _to_response(tag)
