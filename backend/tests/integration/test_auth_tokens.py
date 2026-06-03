import httpx


def test_login_refresh_and_logout_revokes_refresh_token(client: httpx.Client) -> None:
    login_response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "123123"},
    )
    assert login_response.status_code == 200, login_response.text
    session = login_response.json()
    assert session["user"]["username"] == "admin"
    assert session["access_token"]
    assert session["refresh_token"]

    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {session['access_token']}"},
    )
    assert me_response.status_code == 200, me_response.text
    assert me_response.json()["username"] == "admin"

    refresh_response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": session["refresh_token"]},
    )
    assert refresh_response.status_code == 200, refresh_response.text
    refreshed_session = refresh_response.json()
    assert refreshed_session["refresh_token"] != session["refresh_token"]

    old_refresh_response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": session["refresh_token"]},
    )
    assert old_refresh_response.status_code == 401

    logout_response = client.post(
        "/api/auth/logout",
        json={"refresh_token": refreshed_session["refresh_token"]},
    )
    assert logout_response.status_code == 200, logout_response.text

    revoked_refresh_response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refreshed_session["refresh_token"]},
    )
    assert revoked_refresh_response.status_code == 401
