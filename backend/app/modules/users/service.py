from sqlalchemy.orm import Session

from app.modules.users import repository
from app.modules.users.model import User


def get_user_by_username(db: Session, username: str) -> User | None:
    return repository.get_user_by_username(db, username)


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return repository.get_user_by_id(db, user_id)
