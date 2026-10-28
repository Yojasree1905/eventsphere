def test_create_and_list_events(client, auth_headers):
    payload = {
        "title": "Tech Fest 2026",
        "college_name": "MIT College",
        "category": "technical",
    }
    resp = client.post("/api/events", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    event_id = resp.json()["id"]

    resp = client.get("/api/events", headers=auth_headers)
    assert resp.status_code == 200
    ids = [e["id"] for e in resp.json()]
    assert event_id in ids


def test_get_event(client, auth_headers):
    resp = client.post(
        "/api/events",
        json={"title": "Art Show", "college_name": "Fine Arts College", "category": "cultural"},
        headers=auth_headers,
    )
    event_id = resp.json()["id"]

    resp = client.get(f"/api/events/{event_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Art Show"


def test_update_event(client, auth_headers):
    resp = client.post(
        "/api/events",
        json={"title": "Old Title", "college_name": "College A", "category": "academic"},
        headers=auth_headers,
    )
    event_id = resp.json()["id"]

    resp = client.put(
        f"/api/events/{event_id}",
        json={"title": "New Title"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "New Title"


def test_delete_event(client, auth_headers):
    resp = client.post(
        "/api/events",
        json={"title": "Delete Me", "college_name": "College B", "category": "other"},
        headers=auth_headers,
    )
    event_id = resp.json()["id"]

    resp = client.delete(f"/api/events/{event_id}", headers=auth_headers)
    assert resp.status_code == 204

    resp = client.get(f"/api/events/{event_id}", headers=auth_headers)
    assert resp.status_code == 404


def test_approve_reject_workflow(client, auth_headers):
    resp = client.post(
        "/api/events",
        json={"title": "Approval Test", "college_name": "Col C", "category": "seminar"},
        headers=auth_headers,
    )
    event_id = resp.json()["id"]

    # Submit
    resp = client.patch(f"/api/events/{event_id}/submit", headers=auth_headers)
    assert resp.json()["status"] == "pending"

    # Approve
    resp = client.patch(f"/api/events/{event_id}/approve", headers=auth_headers)
    assert resp.json()["status"] == "approved"

    # Cannot approve again → submit another and reject
    resp = client.post(
        "/api/events",
        json={"title": "Reject Test", "college_name": "Col D", "category": "workshop"},
        headers=auth_headers,
    )
    event_id2 = resp.json()["id"]
    client.patch(f"/api/events/{event_id2}/submit", headers=auth_headers)
    resp = client.patch(
        f"/api/events/{event_id2}/reject",
        json={"rejection_reason": "Duplicate event"},
        headers=auth_headers,
    )
    assert resp.json()["status"] == "rejected"
    assert resp.json()["rejection_reason"] == "Duplicate event"
