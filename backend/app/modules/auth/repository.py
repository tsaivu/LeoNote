from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auth.model import RefreshToken


def create_refresh_token(
    db: Session,
    *,
    user_id: str,
    token_hash: str,
    expires_at: datetime,
) -> RefreshToken:
    refresh_token = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
    db.add(refresh_token)
    db.flush()
    return refresh_token


def get_refresh_token_by_hash(db: Session, *, token_hash: str) -> RefreshToken | None:
    return db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
        )
    ).scalar_one_or_none()


def revoke_refresh_token(refresh_token: RefreshToken) -> None:
    refresh_token.revoked_at = datetime.now(timezone.utc)


def revoke_all_user_refresh_tokens(db: Session, *, user_id: str) -> None:
    active_tokens = db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
    ).scalars()
    now = datetime.now(timezone.utc)
    for refresh_token in active_tokens:
        refresh_token.revoked_at = now
