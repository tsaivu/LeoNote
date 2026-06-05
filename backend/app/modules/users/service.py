from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.modules.users import repository
from app.modules.users.model import User
from app.modules.users.schema import CurrentUserResponse, UserPasswordUpdateRequest, UserProfileUpdateRequest


def get_user_by_username(db: Session, username: str) -> User | None:
    return repository.get_user_by_username(db, username)


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return repository.get_user_by_id(db, user_id)


def build_current_user_response(user: User) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        display_name=user.display_name,
        timezone=user.timezone,
    )


def update_current_user_profile(db: Session, current_user: User, payload: UserProfileUpdateRequest) -> CurrentUserResponse:
    display_name = payload.display_name.strip() if payload.display_name else None
    email = payload.email.strip().lower() if payload.email else None

    if email:
        existing = repository.get_user_by_email(db, email)
        if existing is not None and existing.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_ALREADY_EXISTS")

    try:
        user = repository.update_user_profile(current_user, display_name=display_name, email=email)
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_ALREADY_EXISTS") from exc
    except Exception:
        db.rollback()
        raise

    return build_current_user_response(user)


def update_current_user_password(db: Session, current_user: User, payload: UserPasswordUpdateRequest) -> dict[str, str]:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CURRENT_PASSWORD_INVALID")

    try:
        repository.update_user_password(current_user, password_hash=get_password_hash(payload.new_password))
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {"status": "ok"}
