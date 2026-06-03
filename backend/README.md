# Backend

Rules:

- FastAPI + SQLAlchemy sync only
- Business logic in `service.py`
- Database access in `repository.py`
- No DB logic in routers
- All business tables must be isolated by `user_id`

Local startup:

- Run migrations before starting the API: `python -m alembic upgrade head`.
- The root `run.bat` already performs this migration step before launching Uvicorn.
- Do not rely on `Base.metadata.create_all()` in application startup.
