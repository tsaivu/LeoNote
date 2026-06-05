import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.modules.auth.router import register
from app.modules.users.schema import UserRegisterRequest


def test_registration_can_be_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "allow_registration", False)

    with pytest.raises(HTTPException) as exc_info:
        register(
            UserRegisterRequest(
                username="blocked-user",
                password="123123",
                display_name="Blocked",
                timezone="Asia/Ho_Chi_Minh",
            ),
            db=None,
        )

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Registration is disabled"
