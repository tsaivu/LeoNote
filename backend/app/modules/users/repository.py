from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.modules.users.model import User


def get_user_by_username(db: Session, username: str) -> User | None:
    statement: Select[tuple[User]] = select(User).where(
        User.username == username,
        User.deleted_at.is_(None),
    )
    return db.execute(statement).scalar_one_or_none()


def get_user_by_id(db: Session, user_id: str) -> User | None:
    statement: Select[tuple[User]] = select(User).where(
        User.id == user_id,
        User.deleted_at.is_(None),
    )
    return db.execute(statement).scalar_one_or_none()


def get_user_by_email(db: Session, email: str) -> User | None:
    statement: Select[tuple[User]] = select(User).where(
        User.email.ilike(email),
        User.deleted_at.is_(None),
    )
    return db.execute(statement).scalar_one_or_none()


def update_user_profile(
    user: User,
    *,
    display_name: str | None,
    email: str | None,
) -> User:
    user.display_name = display_name
    user.email = email
    return user


def update_user_password(user: User, *, password_hash: str) -> User:
    user.password_hash = password_hash
    return user


def create_user(
    db: Session,
    *,
    username: str,
    password_hash: str,
    display_name: str | None,
    timezone: str,
    email: str | None = None,
) -> User:
    user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        display_name=display_name,
        timezone=timezone,
    )
    db.add(user)
    db.flush()
    return user
