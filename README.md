# LeoNote

Personal notes MVP with:

- Frontend: React + Vite + TypeScript
- Backend: FastAPI + SQLAlchemy sync
- Database: PostgreSQL

Local development defaults:

- Frontend: `http://127.0.0.1:9110`
- Backend: `http://127.0.0.1:9111`
- Database: PostgreSQL database `personal_notes_dev`

Use `run.bat` for local development. It loads development env files, runs `alembic upgrade head`, then starts FastAPI with reload and Vite HMR.

Use `stop.bat` to stop local dev processes on the configured frontend/backend ports.

Project layout is module-first so AI and developers can trace each domain without scanning unrelated files.
