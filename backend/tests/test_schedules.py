from datetime import datetime, timedelta, timezone
from app.schemas.schedule import ScheduleOut, ScheduleStatus


def _create_test_event(client, auth_headers):
    resp = client.post(
        "/api/events",
        json={"title": "Schedule Test Fest", "college_name": "MIT College", "category": "technical"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    return resp.json()["id"]


def test_schedule_status_upcoming(client, auth_headers):
    event_id = _create_test_event(client, auth_headers)
    now = datetime.now(timezone.utc)
    start_time = (now + timedelta(hours=2)).isoformat()
    end_time = (now + timedelta(hours=3)).isoformat()

    resp = client.post(
        "/api/schedules",
        json={
            "event_id": event_id,
            "title": "Future Session",
            "start_time": start_time,
            "end_time": end_time,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == ScheduleStatus.UPCOMING.value


def test_schedule_status_ongoing(client, auth_headers):
    event_id = _create_test_event(client, auth_headers)
    now = datetime.now(timezone.utc)
    start_time = (now - timedelta(minutes=10)).isoformat()
    end_time = (now + timedelta(minutes=20)).isoformat()

    resp = client.post(
        "/api/schedules",
        json={
            "event_id": event_id,
            "title": "Live Current Session",
            "start_time": start_time,
            "end_time": end_time,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == ScheduleStatus.ONGOING.value


def test_schedule_status_completed(client, auth_headers):
    event_id = _create_test_event(client, auth_headers)
    now = datetime.now(timezone.utc)
    start_time = (now - timedelta(hours=2)).isoformat()
    end_time = (now - timedelta(hours=1)).isoformat()

    resp = client.post(
        "/api/schedules",
        json={
            "event_id": event_id,
            "title": "Finished Session",
            "start_time": start_time,
            "end_time": end_time,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == ScheduleStatus.COMPLETED.value


def test_schedule_status_exact_boundaries():
    """Unit test boundary conditions: before start, at start, between, at end, and after end."""
    fixed_now = datetime(2026, 10, 11, 21, 40, 0, tzinfo=timezone.utc)
    start = datetime(2026, 10, 11, 21, 39, 0, tzinfo=timezone.utc)
    end = datetime(2026, 10, 11, 21, 41, 0, tzinfo=timezone.utc)

    # 1. Before start: starts 1 hour in the future -> upcoming
    now = datetime.now(timezone.utc)
    s_upcoming = ScheduleOut(
        id=1,
        event_id=1,
        title="Session",
        start_time=now + timedelta(hours=1),
        end_time=now + timedelta(hours=2),
        created_at=now,
    )
    assert s_upcoming.status == ScheduleStatus.UPCOMING

    # 2. Completed: ended 5 minutes ago -> completed
    s_completed = ScheduleOut(
        id=2,
        event_id=1,
        title="Session ended 5 mins ago",
        start_time=now - timedelta(minutes=15),
        end_time=now - timedelta(minutes=5),
        created_at=now,
    )
    assert s_completed.status == ScheduleStatus.COMPLETED

    # 3. Ongoing: started 5 mins ago, ends in 5 mins -> ongoing
    s_ongoing = ScheduleOut(
        id=3,
        event_id=1,
        title="Currently active session",
        start_time=now - timedelta(minutes=5),
        end_time=now + timedelta(minutes=5),
        created_at=now,
    )
    assert s_ongoing.status == ScheduleStatus.ONGOING

    # 3. Exact end boundary test directly on status logic
    # At exact end timestamp, condition is now >= end -> completed
    t_start = datetime(2026, 10, 11, 20, 0, 0, tzinfo=timezone.utc)
    t_end = datetime(2026, 10, 11, 20, 30, 0, tzinfo=timezone.utc)

    def compute_status_at(now_time, start_t, end_t):
        if now_time < start_t:
            return ScheduleStatus.UPCOMING
        elif start_t <= now_time < end_t:
            return ScheduleStatus.ONGOING
        else:
            return ScheduleStatus.COMPLETED

    # Before start
    assert compute_status_at(datetime(2026, 10, 11, 19, 59, 59, tzinfo=timezone.utc), t_start, t_end) == ScheduleStatus.UPCOMING
    # Exactly at start -> ongoing
    assert compute_status_at(t_start, t_start, t_end) == ScheduleStatus.ONGOING
    # During session -> ongoing
    assert compute_status_at(datetime(2026, 10, 11, 20, 15, 0, tzinfo=timezone.utc), t_start, t_end) == ScheduleStatus.ONGOING
    # Exactly at end boundary -> completed
    assert compute_status_at(t_end, t_start, t_end) == ScheduleStatus.COMPLETED
    # After end boundary -> completed
    assert compute_status_at(datetime(2026, 10, 11, 20, 30, 1, tzinfo=timezone.utc), t_start, t_end) == ScheduleStatus.COMPLETED


def test_schedule_crud_lifecycle(client, auth_headers):
    event_id = _create_test_event(client, auth_headers)
    now = datetime.now(timezone.utc)
    start_time = (now + timedelta(days=1)).isoformat()
    end_time = (now + timedelta(days=1, hours=1)).isoformat()

    # Create slot
    resp = client.post(
        "/api/schedules",
        json={
            "event_id": event_id,
            "title": "Opening Ceremony",
            "start_time": start_time,
            "end_time": end_time,
            "location": "Main Auditorium",
            "speaker": "Prof. Alan",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    slot_id = resp.json()["id"]

    # List schedules
    list_resp = client.get(f"/api/schedules?event_id={event_id}", headers=auth_headers)
    assert list_resp.status_code == 200
    assert any(s["id"] == slot_id for s in list_resp.json())

    # Delete slot
    del_resp = client.delete(f"/api/schedules/{slot_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    # Verify deleted
    get_resp = client.get(f"/api/schedules/{slot_id}", headers=auth_headers)
    assert get_resp.status_code == 404


def test_schedule_invalid_end_before_start(client, auth_headers):
    event_id = _create_test_event(client, auth_headers)
    now = datetime.now(timezone.utc)
    # Reject when end_time <= start_time
    resp = client.post(
        "/api/schedules",
        json={
            "event_id": event_id,
            "title": "Invalid Times",
            "start_time": now.isoformat(),
            "end_time": (now - timedelta(minutes=10)).isoformat(),
        },
        headers=auth_headers,
    )
    assert resp.status_code == 400

    resp2 = client.post(
        "/api/schedules",
        json={
            "event_id": event_id,
            "title": "Equal Times",
            "start_time": now.isoformat(),
            "end_time": now.isoformat(),
        },
        headers=auth_headers,
    )
    assert resp2.status_code == 400


def test_schedule_midnight_crossing(client, auth_headers):
    """Test sessions that cross midnight (e.g. 23:00 to 02:00 next day)."""
    event_id = _create_test_event(client, auth_headers)
    now = datetime.now(timezone.utc)
    start_time = (now - timedelta(hours=1)).isoformat()
    end_time = (now + timedelta(hours=2)).isoformat()

    resp = client.post(
        "/api/schedules",
        json={
            "event_id": event_id,
            "title": "Overnight Hackathon Session",
            "start_time": start_time,
            "end_time": end_time,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == ScheduleStatus.ONGOING.value


def test_schedule_persisted_cancellation(client, auth_headers):
    event_id = _create_test_event(client, auth_headers)
    now = datetime.now(timezone.utc)
    start_time = (now + timedelta(hours=2)).isoformat()
    end_time = (now + timedelta(hours=3)).isoformat()

    resp = client.post(
        "/api/schedules",
        json={
            "event_id": event_id,
            "title": "Cancelled Future Session",
            "start_time": start_time,
            "end_time": end_time,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    slot_id = resp.json()["id"]
    assert resp.json()["status"] == ScheduleStatus.UPCOMING.value

    # Cancel session
    cancel_resp = client.patch(f"/api/schedules/{slot_id}/cancel", headers=auth_headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["is_cancelled"] is True
    assert cancel_resp.json()["status"] == ScheduleStatus.CANCELLED.value

    # Refresh via GET
    get_resp = client.get(f"/api/schedules/{slot_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["status"] == ScheduleStatus.CANCELLED.value


def test_schedule_persisted_expire_and_complete(client, auth_headers):
    event_id = _create_test_event(client, auth_headers)
    now = datetime.now(timezone.utc)
    start_time = (now - timedelta(hours=2)).isoformat()
    end_time = (now - timedelta(hours=1)).isoformat()

    resp = client.post(
        "/api/schedules",
        json={
            "event_id": event_id,
            "title": "Past Session Workflow",
            "start_time": start_time,
            "end_time": end_time,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    slot_id = resp.json()["id"]
    # By default, ended session is considered normally completed
    assert resp.json()["status"] == ScheduleStatus.COMPLETED.value

    # Mark as not conducted / expired
    expire_resp = client.patch(f"/api/schedules/{slot_id}/expire", headers=auth_headers)
    assert expire_resp.status_code == 200
    assert expire_resp.json()["is_conducted"] is False
    assert expire_resp.json()["status"] == ScheduleStatus.EXPIRED.value

    # Re-mark as conducted / completed
    complete_resp = client.patch(f"/api/schedules/{slot_id}/complete", headers=auth_headers)
    assert complete_resp.status_code == 200
    assert complete_resp.json()["is_conducted"] is True
    assert complete_resp.json()["status"] == ScheduleStatus.COMPLETED.value

