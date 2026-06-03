from datetime import datetime, timedelta, timezone

import httpx


def test_folder_delete_blocks_active_children_and_moves_notes_to_inbox(client: httpx.Client, api_user_factory) -> None:
    user = api_user_factory("folderuser")

    parent_response = client.post("/api/folders", headers=user["headers"], json={"name": "Parent", "parent_id": None})
    assert parent_response.status_code == 201, parent_response.text
    parent = parent_response.json()
    child_response = client.post("/api/folders", headers=user["headers"], json={"name": "Child", "parent_id": parent["id"]})
    assert child_response.status_code == 201, child_response.text

    blocked_delete = client.delete(f"/api/folders/{parent['id']}", headers=user["headers"])
    assert blocked_delete.status_code == 409
    assert blocked_delete.json()["detail"] == "FOLDER_HAS_ACTIVE_CHILDREN"

    note_response = client.post(
        "/api/notes",
        headers=user["headers"],
        json={
            "title": "Move me",
            "content": None,
            "folder_id": parent["id"],
            "main_assignee_id": user["assignee"]["id"],
            "status": "TODO",
            "priority": "MEDIUM",
            "deadline_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "tag_ids": [],
            "subtasks": [],
        },
    )
    assert note_response.status_code == 201, note_response.text

    child_delete = client.delete(f"/api/folders/{child_response.json()['id']}", headers=user["headers"])
    assert child_delete.status_code == 200, child_delete.text
    parent_delete = client.delete(f"/api/folders/{parent['id']}", headers=user["headers"])
    assert parent_delete.status_code == 200, parent_delete.text

    notes_response = client.get("/api/notes", headers=user["headers"])
    moved_note = next(note for note in notes_response.json() if note["title"] == "Move me")
    assert moved_note["folder"]["id"] == user["folder"]["id"]


def test_assignee_delete_deactivates_when_in_use(client: httpx.Client, api_user_factory) -> None:
    user = api_user_factory("assigneeuser")

    note_response = client.post(
        "/api/notes",
        headers=user["headers"],
        json={
            "title": "Uses assignee",
            "content": None,
            "folder_id": user["folder"]["id"],
            "main_assignee_id": user["assignee"]["id"],
            "status": "TODO",
            "priority": "MEDIUM",
            "deadline_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "tag_ids": [],
            "subtasks": [],
        },
    )
    assert note_response.status_code == 201, note_response.text

    delete_response = client.delete(f"/api/assignees/{user['assignee']['id']}", headers=user["headers"])
    assert delete_response.status_code == 200, delete_response.text
    deleted_assignee = delete_response.json()
    assert deleted_assignee["is_active"] is False
    assert deleted_assignee["deleted_at"] is None


def test_tag_delete_removes_note_link_and_soft_deletes_tag(client: httpx.Client, api_user_factory) -> None:
    user = api_user_factory("taguser")

    note_response = client.post(
        "/api/notes",
        headers=user["headers"],
        json={
            "title": "Tagged note",
            "content": None,
            "folder_id": user["folder"]["id"],
            "main_assignee_id": user["assignee"]["id"],
            "status": "TODO",
            "priority": "MEDIUM",
            "deadline_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "tag_ids": [user["tag"]["id"]],
            "subtasks": [],
        },
    )
    assert note_response.status_code == 201, note_response.text
    note_id = note_response.json()["id"]

    delete_response = client.delete(f"/api/tags/{user['tag']['id']}", headers=user["headers"])
    assert delete_response.status_code == 200, delete_response.text
    assert delete_response.json()["deleted_at"] is not None

    note_detail_response = client.get(f"/api/notes/{note_id}", headers=user["headers"])
    assert note_detail_response.status_code == 200, note_detail_response.text
    assert note_detail_response.json()["tags"] == []
