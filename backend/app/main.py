from fastapi import FastAPI

from app.core.config import settings
from app.modules.assignees.router import router as assignees_router
from app.modules.auth.router import router as auth_router
from app.modules.comments.router import router as comments_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.folders.router import router as folders_router
from app.modules.notes.router import router as notes_router
from app.seed import seed_configured_user
from app.modules.subtasks.router import router as subtasks_router
from app.modules.tags.router import router as tags_router
from app.modules.trash.router import router as trash_router
from app.modules.users.router import router as users_router
from fastapi.middleware.cors import CORSMiddleware

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
    if settings.seed_username is None and settings.seed_password is None:
        return
    if settings.seed_username is None or settings.seed_password is None:
        raise RuntimeError("SEED_USERNAME and SEED_PASSWORD must be configured together")
    seed_configured_user(
        username=settings.seed_username,
        password=settings.seed_password.get_secret_value(),
        display_name=settings.seed_display_name,
        enforce_single_user=settings.seed_enforce_single_user,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.app_env}
