from datetime import datetime, timedelta, timezone

import httpx


def _note_payload(user_context: dict, *, title: str = "Important task") -> dict:
    return {
        "title": title,
        "content": "Kiem tra deadline va subtasks",
        "folder_id": user_context["folder"]["id"],
        "main_assignee_id": user_context["assignee"]["id"],
        "status": "TODO",
        "priority": "HIGH",
        "deadline_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        "tag_ids": [user_context["tag"]["id"]],
        "subtasks": [
            {
                "title": "Subtask one",
                "assignee_id": user_context["assignee"]["id"],
                "status": "TODO",
                "sort_order": 1,
            }
        ],
    }


def test_user_data_isolation_for_notes(client: httpx.Client, api_user_factory) -> None:
    first_user = api_user_factory("owner1")
    second_user = api_user_factory("owner2")

    create_response = client.post("/api/notes", headers=first_user["headers"], json=_note_payload(first_user))
    assert create_response.status_code == 201, create_response.text
    note_id = create_response.json()["id"]

    owner_list = client.get("/api/notes", headers=first_user["headers"])
    assert owner_list.status_code == 200, owner_list.text
    assert any(note["id"] == note_id for note in owner_list.json())

    other_list = client.get("/api/notes", headers=second_user["headers"])
    assert other_list.status_code == 200, other_list.text
    assert all(note["id"] != note_id for note in other_list.json())

    other_detail = client.get(f"/api/notes/{note_id}", headers=second_user["headers"])
    assert other_detail.status_code == 404


def test_note_update_soft_deletes_missing_subtasks_and_trash_restore(client: httpx.Client, api_user_factory) -> None:
    user = api_user_factory("noter")
    create_response = client.post("/api/notes", headers=user["headers"], json=_note_payload(user))
    assert create_response.status_code == 201, create_response.text
    created_note = create_response.json()
    assert len(created_note["subtasks"]) == 1

    update_payload = _note_payload(user, title="Updated task")
    update_payload["subtasks"] = []
    update_response = client.put(f"/api/notes/{created_note['id']}", headers=user["headers"], json=update_payload)
    assert update_response.status_code == 200, update_response.text
    assert update_response.json()["subtasks"] == []

    delete_response = client.delete(f"/api/notes/{created_note['id']}", headers=user["headers"])
    assert delete_response.status_code == 200, delete_response.text
    assert delete_response.json()["deleted_at"] is not None

    active_list = client.get("/api/notes", headers=user["headers"])
    assert all(note["id"] != created_note["id"] for note in active_list.json())

    trash_response = client.get("/api/trash/notes", headers=user["headers"])
    assert trash_response.status_code == 200, trash_response.text
    assert any(note["id"] == created_note["id"] for note in trash_response.json())

    restore_response = client.post(f"/api/trash/notes/{created_note['id']}/restore", headers=user["headers"])
    assert restore_response.status_code == 200, restore_response.text
    assert restore_response.json()["deleted_at"] is None


def test_search_and_quick_filters(client: httpx.Client, api_user_factory) -> None:
    user = api_user_factory("filteruser")
    payload = _note_payload(user, title="Kiểm tra bộ lọc")
    payload["deadline_at"] = datetime.now(timezone.utc).isoformat()
    create_response = client.post("/api/notes", headers=user["headers"], json=payload)
    assert create_response.status_code == 201, create_response.text
    note_id = create_response.json()["id"]

    search_response = client.get("/api/notes?q=kiem tra", headers=user["headers"])
    assert search_response.status_code == 200, search_response.text
    assert any(note["id"] == note_id for note in search_response.json())

    today_response = client.get("/api/notes?quick_filter=today", headers=user["headers"])
    assert today_response.status_code == 200, today_response.text
    assert any(note["id"] == note_id for note in today_response.json())

    high_priority_response = client.get("/api/notes?quick_filter=high_priority", headers=user["headers"])
    assert high_priority_response.status_code == 200, high_priority_response.text
    assert any(note["id"] == note_id for note in high_priority_response.json())
