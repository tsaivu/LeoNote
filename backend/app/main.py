from fastapi import FastAPI

from app.core.config import settings
from app.core.database import engine, SessionLocal
from app.modules.assignees.router import router as assignees_router
from app.modules.auth.router import router as auth_router
from app.modules.comments.router import router as comments_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.folders.router import router as folders_router
from app.modules.notes.model import Assignee, Folder, Note
from app.modules.notes.router import router as notes_router
from app.modules.notes.model import NotePriority, NoteStatus
from app.modules.subtasks.router import router as subtasks_router
from app.modules.tags.router import router as tags_router
from app.modules.trash.router import router as trash_router
from app.modules.users.router import router as users_router
from app.modules.users.model import User
from app.core.security import get_password_hash
from datetime import datetime, timedelta, timezone
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(users_router, prefix=settings.api_prefix)
app.include_router(assignees_router, prefix=settings.api_prefix)
app.include_router(folders_router, prefix=settings.api_prefix)
app.include_router(tags_router, prefix=settings.api_prefix)
app.include_router(notes_router, prefix=settings.api_prefix)
app.include_router(comments_router, prefix=settings.api_prefix)
app.include_router(subtasks_router, prefix=settings.api_prefix)
app.include_router(dashboard_router, prefix=settings.api_prefix)
app.include_router(trash_router, prefix=settings.api_prefix)


@app.on_event("startup")
def startup() -> None:
    seed_admin_user()


def seed_admin_user() -> None:
    db = SessionLocal()
    try:
        admin = db.execute(
            select(User).where(
                User.username == "admin",
                User.deleted_at.is_(None),
            )
        ).scalar_one_or_none()

        if admin is None:
            admin = User(
                username="admin",
                email=None,
                password_hash=get_password_hash("123123"),
                display_name="Admin",
                timezone="Asia/Ho_Chi_Minh",
            )
            db.add(admin)
            db.flush()

        folder = db.execute(
            select(Folder).where(
                Folder.user_id == admin.id,
                Folder.name == "Inbox",
                Folder.deleted_at.is_(None),
            )
        ).scalar_one_or_none()
        if folder is None:
            folder = Folder(
                user_id=admin.id,
                name="Inbox",
                is_system=True,
                sort_order=0,
            )
            db.add(folder)
            db.flush()

        assignee = db.execute(
            select(Assignee).where(
                Assignee.user_id == admin.id,
                Assignee.name == "Admin",
                Assignee.deleted_at.is_(None),
            )
        ).scalar_one_or_none()
        if assignee is None:
            assignee = Assignee(
                user_id=admin.id,
                name="Admin",
                email=None,
                is_active=True,
            )
            db.add(assignee)
            db.flush()

        admin_note = db.execute(
            select(Note).where(
                Note.user_id == admin.id,
                Note.title == "Welcome to LeoNote",
                Note.deleted_at.is_(None),
            )
        ).scalar_one_or_none()
        if admin_note is None:
            db.add(
                Note(
                    user_id=admin.id,
                    folder_id=folder.id,
                    main_assignee_id=assignee.id,
                    title="Welcome to LeoNote",
                    content="This is the seeded admin note.",
                    status=NoteStatus.TODO,
                    priority=NotePriority.MEDIUM,
                    deadline_at=datetime.now(timezone.utc) + timedelta(days=1),
                    search_text="welcome to leonote this is the seeded admin note admin",
                )
            )

        db.commit()
    finally:
        db.close()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.app_env}
