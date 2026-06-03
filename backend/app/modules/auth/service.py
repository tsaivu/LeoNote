from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    hash_token,
    refresh_token_expires_at,
    verify_password,
)
from app.modules.auth import repository as auth_repository
from app.modules.auth.model import RefreshToken
from app.modules.auth.schema import AuthUserResponse, LoginResponse, RegisterResponse
from app.modules.notes.model import Folder
from app.modules.users import repository as user_repository
from app.modules.users.model import User


def register_user(
    db: Session,
    *,
    username: str,
    password: str,
    display_name: str | None,
    timezone: str,
) -> RegisterResponse:
    existing_user = user_repository.get_user_by_username(db, username)
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    try:
        user = user_repository.create_user(
            db,
            username=username,
            email=None,
            password_hash=get_password_hash(password),
            display_name=display_name,
            timezone=timezone,
        )
        db.add(Folder(user_id=user.id, name="Inbox", is_system=True, sort_order=0))
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        ) from exc

    return RegisterResponse(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        timezone=user.timezone,
    )


def login_user(db: Session, *, username: str, password: str) -> LoginResponse:
    user = user_repository.get_user_by_username(db, username)
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token()
    auth_repository.create_refresh_token(
        db,
        user_id=str(user.id),
        token_hash=hash_token(refresh_token),
        expires_at=refresh_token_expires_at(),
    )
    db.commit()
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=AuthUserResponse(
            id=str(user.id),
            username=user.username,
            display_name=user.display_name,
            timezone=user.timezone,
        ),
    )


def _validate_refresh_token(db: Session, raw_refresh_token: str | None) -> RefreshToken:
    if not raw_refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="AUTH_UNAUTHORIZED")

    refresh_token = auth_repository.get_refresh_token_by_hash(db, token_hash=hash_token(raw_refresh_token))
    if refresh_token is None or refresh_token.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="AUTH_UNAUTHORIZED")
    if refresh_token.expires_at <= datetime.now(timezone.utc):
        auth_repository.revoke_refresh_token(refresh_token)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="AUTH_TOKEN_EXPIRED")
    return refresh_token


def refresh_access_token(db: Session, *, raw_refresh_token: str | None) -> LoginResponse:
    current_refresh_token = _validate_refresh_token(db, raw_refresh_token)
    user = user_repository.get_user_by_id(db, str(current_refresh_token.user_id))
    if user is None:
        auth_repository.revoke_refresh_token(current_refresh_token)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    auth_repository.revoke_refresh_token(current_refresh_token)
    next_refresh_token = create_refresh_token()
    auth_repository.create_refresh_token(
        db,
        user_id=str(user.id),
        token_hash=hash_token(next_refresh_token),
        expires_at=refresh_token_expires_at(),
    )
    db.commit()

    return LoginResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=next_refresh_token,
        token_type="bearer",
        user=build_current_user_response(user),
    )


def logout_user(db: Session, *, raw_refresh_token: str | None) -> None:
    if not raw_refresh_token:
        return
    refresh_token = auth_repository.get_refresh_token_by_hash(db, token_hash=hash_token(raw_refresh_token))
    if refresh_token is not None and refresh_token.revoked_at is None:
        auth_repository.revoke_refresh_token(refresh_token)
        db.commit()


def build_current_user_response(user: User) -> AuthUserResponse:
    return AuthUserResponse(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        timezone=user.timezone,
    )
