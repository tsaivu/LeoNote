from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.modules.notes.model import Assignee, Folder, Note, NotePriority, NoteStatus
from app.modules.users.model import User


def seed_configured_user(
    *,
    username: str,
    password: str,
    display_name: str | None = None,
    enforce_single_user: bool = False,
) -> None:
    normalized_username = username.strip()
    if not normalized_username or not password:
        raise RuntimeError("Seed username and password must not be blank")

    db = SessionLocal()
    try:
        users = list(db.execute(select(User)).scalars().all())
        unexpected_users = [user.username for user in users if user.username.lower() != normalized_username.lower()]
        if enforce_single_user and (unexpected_users or len(users) > 1):
            raise RuntimeError(
                "Production seed requires a single-user database; existing users: "
                + ", ".join(sorted(user.username for user in users))
            )

        user = next((item for item in users if item.username.lower() == normalized_username.lower()), None)
        if user is None:
            user = User(
                username=normalized_username,
                email=None,
                password_hash=get_password_hash(password),
                display_name=display_name or normalized_username,
                timezone="Asia/Ho_Chi_Minh",
            )
            db.add(user)
            db.flush()
        elif user.deleted_at is not None:
            raise RuntimeError(f"Seed user {normalized_username!r} exists but is soft deleted")

        folder = db.execute(
            select(Folder).where(
                Folder.user_id == user.id,
                Folder.name == "Inbox",
                Folder.deleted_at.is_(None),
            )
        ).scalar_one_or_none()
        if folder is None:
            folder = Folder(
                user_id=user.id,
                name="Inbox",
                is_system=True,
                sort_order=0,
            )
            db.add(folder)
            db.flush()

        assignee = db.execute(
            select(Assignee).where(
                Assignee.user_id == user.id,
                Assignee.name == (display_name or normalized_username),
                Assignee.deleted_at.is_(None),
            )
        ).scalar_one_or_none()
        if assignee is None:
            assignee = Assignee(
                user_id=user.id,
                name=display_name or normalized_username,
                email=None,
                is_active=True,
            )
            db.add(assignee)
            db.flush()

        welcome_title = "Welcome to Leo Task Management"
        welcome_note = db.execute(
            select(Note).where(
                Note.user_id == user.id,
                Note.title == welcome_title,
                Note.deleted_at.is_(None),
            )
        ).scalar_one_or_none()
        if welcome_note is None:
            db.add(
                Note(
                    user_id=user.id,
                    folder_id=folder.id,
                    main_assignee_id=assignee.id,
                    title=welcome_title,
                    content="Your personal task workspace is ready.",
                    status=NoteStatus.TODO,
                    priority=NotePriority.MEDIUM,
                    deadline_at=None,
                    search_text=f"welcome leo task management {normalized_username}".lower(),
                )
            )

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
