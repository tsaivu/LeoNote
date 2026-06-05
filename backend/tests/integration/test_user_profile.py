from __future__ import annotations

import httpx


def test_user_can_update_profile_and_password(client: httpx.Client, api_user_factory) -> None:
    user = api_user_factory("profile_user")

    profile_response = client.put(
        "/api/users/me",
        headers=user["headers"],
        json={
            "display_name": "Profile User",
            "email": "profile@example.com",
        },
    )
    assert profile_response.status_code == 200, profile_response.text
    profile = profile_response.json()
    assert profile["username"] == "profile_user"
    assert profile["display_name"] == "Profile User"
    assert profile["email"] == "profile@example.com"

    invalid_password_response = client.put(
        "/api/users/me/password",
        headers=user["headers"],
        json={
            "current_password": "wrong-password",
            "new_password": "654321",
        },
    )
    assert invalid_password_response.status_code == 400, invalid_password_response.text

    password_response = client.put(
        "/api/users/me/password",
        headers=user["headers"],
        json={
            "current_password": "123123",
            "new_password": "654321",
        },
    )
    assert password_response.status_code == 200, password_response.text
    assert password_response.json() == {"status": "ok"}

    old_login_response = client.post(
        "/api/auth/login",
        json={"username": "profile_user", "password": "123123"},
    )
    assert old_login_response.status_code == 401, old_login_response.text

    new_login_response = client.post(
        "/api/auth/login",
        json={"username": "profile_user", "password": "654321"},
    )
    assert new_login_response.status_code == 200, new_login_response.text
    assert new_login_response.json()["user"]["email"] == "profile@example.com"


def test_user_profile_email_must_be_unique(client: httpx.Client, api_user_factory) -> None:
    first = api_user_factory("profile_first")
    second = api_user_factory("profile_second")

    first_response = client.put(
        "/api/users/me",
        headers=first["headers"],
        json={
            "display_name": "First",
            "email": "shared@example.com",
        },
    )
    assert first_response.status_code == 200, first_response.text

    duplicate_response = client.put(
        "/api/users/me",
        headers=second["headers"],
        json={
            "display_name": "Second",
            "email": "shared@example.com",
        },
    )
    assert duplicate_response.status_code == 409, duplicate_response.text
    assert duplicate_response.json()["detail"] == "EMAIL_ALREADY_EXISTS"
