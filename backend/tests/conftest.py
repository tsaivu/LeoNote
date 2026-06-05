from __future__ import annotations

import os
import socket
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

import httpx
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("APP_HOST", "127.0.0.1")
os.environ.setdefault("APP_PORT", "9111")
os.environ.setdefault("APP_TIMEZONE", "Asia/Ho_Chi_Minh")
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:olala123@127.0.0.1:5432/personal_notes_test")
os.environ.setdefault("JWT_SECRET_KEY", "change-me-test")
os.environ.setdefault("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
os.environ.setdefault("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "30")
os.environ.setdefault("CORS_ORIGINS", "http://127.0.0.1:9110,http://localhost:9110")
os.environ.setdefault("COOKIE_SECURE", "false")
os.environ.setdefault("COOKIE_DOMAIN", "")
os.environ.setdefault("SEED_USERNAME", "admin")
os.environ.setdefault("SEED_PASSWORD", "123123")
os.environ.setdefault("SEED_DISPLAY_NAME", "Admin")
os.environ.setdefault("SEED_ENFORCE_SINGLE_USER", "false")
os.environ.setdefault("ALLOW_REGISTRATION", "true")


def _quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def _ensure_test_database_exists() -> None:
    database_url = make_url(os.environ["DATABASE_URL"])
    database_name = database_url.database
    if not database_name:
        raise RuntimeError("DATABASE_URL must include a test database name")

    server_url = database_url.set(database="postgres")
    server_engine = create_engine(server_url, isolation_level="AUTOCOMMIT", future=True)
    try:
        with server_engine.connect() as connection:
            exists = connection.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :database_name"),
                {"database_name": database_name},
            ).scalar_one_or_none()
            if exists is None:
                connection.execute(text(f"CREATE DATABASE {_quote_identifier(database_name)}"))
    finally:
        server_engine.dispose()


_ensure_test_database_exists()

from app.core.database import engine
from app.seed import seed_configured_user


def _run_migrations() -> None:
    backend_root = Path(__file__).resolve().parents[1]
    alembic_config = Config(str(backend_root / "alembic.ini"))
    command.upgrade(alembic_config, "head")


def _truncate_database() -> None:
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


@pytest.fixture(scope="session", autouse=True)
def migrated_database(request: pytest.FixtureRequest) -> None:
    _run_migrations()
    yield
    engine.dispose()
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(1 if request.session.testsfailed else 0)


@pytest.fixture(autouse=True)
def reset_database(migrated_database: None) -> None:
    _truncate_database()
    seed_configured_user(
        username="admin",
        password="123123",
        display_name="Admin",
    )
    yield


@pytest.fixture
def client(reset_database: None) -> httpx.Client:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]

    backend_root = Path(__file__).resolve().parents[1]
    process = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
        ],
        cwd=backend_root,
        env=os.environ.copy(),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    base_url = f"http://127.0.0.1:{port}"
    deadline = time.time() + 15
    while time.time() < deadline:
        try:
            response = httpx.get(f"{base_url}/health", timeout=1)
            if response.status_code == 200:
                break
        except httpx.HTTPError:
            time.sleep(0.2)
    else:
        process.terminate()
        raise RuntimeError("Test API server did not start")

    test_client = httpx.Client(base_url=base_url, timeout=10)
    try:
        yield test_client
    finally:
        test_client.close()
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()



def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def api_user_factory(client: httpx.Client):
    def create_user(username: str) -> dict[str, Any]:
        register_response = client.post(
            "/api/auth/register",
            json={
                "username": username,
                "password": "123123",
                "display_name": username,
                "timezone": "Asia/Ho_Chi_Minh",
            },
        )
        assert register_response.status_code == 201, register_response.text

        login_response = client.post(
            "/api/auth/login",
            json={"username": username, "password": "123123"},
        )
        assert login_response.status_code == 200, login_response.text
        token = login_response.json()["access_token"]
        headers = auth_headers(token)

        folder_response = client.get("/api/folders/tree", headers=headers)
        assert folder_response.status_code == 200, folder_response.text
        inbox = next((folder for folder in folder_response.json() if folder["name"] == "Inbox" and folder["is_system"]), None)
        assert inbox is not None
        assignee_response = client.post("/api/assignees", headers=headers, json={"name": f"{username} assignee"})
        assert assignee_response.status_code == 201, assignee_response.text
        tag_response = client.post("/api/tags", headers=headers, json={"name": f"{username} tag"})
        assert tag_response.status_code == 201, tag_response.text

        return {
            "username": username,
            "token": token,
            "headers": headers,
            "folder": inbox,
            "assignee": assignee_response.json(),
            "tag": tag_response.json(),
        }

    return create_user
