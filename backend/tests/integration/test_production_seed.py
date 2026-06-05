import pytest
from sqlalchemy import select, text

from app.core.database import SessionLocal, engine
from app.core.security import verify_password
from app.modules.users.model import User
from app.seed import seed_configured_user


def test_production_seed_creates_exactly_one_configured_user() -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                TRUNCATE TABLE
                    note_tags,
                    subtasks,
                    notes,
                    tags,
                    folders,
                    assignees,
                    refresh_tokens,
                    users
                RESTART IDENTITY CASCADE
                """
            )
        )

    seed_configured_user(
        username="mrleo",
        password="123123",
        display_name="MrLeo",
        enforce_single_user=True,
    )

    with SessionLocal() as db:
        users = list(db.execute(select(User)).scalars().all())
        assert len(users) == 1
        assert users[0].username == "mrleo"
        assert verify_password("123123", users[0].password_hash)


def test_production_seed_rejects_an_unexpected_existing_user() -> None:
    with pytest.raises(RuntimeError, match="single-user database"):
        seed_configured_user(
            username="mrleo",
            password="123123",
            display_name="MrLeo",
            enforce_single_user=True,
        )
