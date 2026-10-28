import pytest
from app.models.event import Event, EventStatus
from app.models.participant import Participant
from app.models.registration import Registration, RegistrationStatus
from app.services.auth_service import create_access_token


def test_public_universities_listing(client):
    resp = client.get("/api/universities")
    assert resp.status_code == 200
    unis = resp.json()
    assert len(unis) >= 5
    codes = [u["code"] for u in unis]
    assert "VIT" in codes
    assert "IITM" in codes


def test_capacity_enforcement_on_registration(client, db):
    admin_token = create_access_token({"sub": "admin@occasio.com"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create event with capacity = 1
    event_resp = client.post(
        "/api/events",
        json={
            "title": "Strict Capacity Hackathon",
            "college_name": "VIT",
            "category": "technical",
            "max_participants": 1
        },
        headers=headers,
    )
    event_id = event_resp.json()["id"]

    # Submit and approve
    client.patch(f"/api/events/{event_id}/submit", headers=headers)
    client.patch(f"/api/events/{event_id}/approve", headers=headers)

    # Create 2 participants
    p1 = Participant(full_name="Student 1", email="student1@vit.ac.in", college_name="VIT")
    p2 = Participant(full_name="Student 2", email="student2@vit.ac.in", college_name="VIT")
    db.add_all([p1, p2])
    db.commit()

    # Register first participant -> 201 Created
    reg1_resp = client.post(
        "/api/registrations",
        json={"event_id": event_id, "participant_id": p1.id},
        headers=headers,
    )
    assert reg1_resp.status_code == 201
    assert reg1_resp.json()["status"] == "applied"

    # Register second participant -> 400 Bad Request (Max capacity reached)
    reg2_resp = client.post(
        "/api/registrations",
        json={"event_id": event_id, "participant_id": p2.id},
        headers=headers,
    )
    assert reg2_resp.status_code == 400
    assert "maximum capacity" in reg2_resp.json()["detail"].lower()


def test_attendance_token_security(client, db):
    admin_token = create_access_token({"sub": "admin@occasio.com"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create event
    ev = Event(title="AI Symposium", college_name="VIT", category="technical", status=EventStatus.APPROVED)
    db.add(ev)
    db.commit()
    db.refresh(ev)

    # Fetch token
    token_resp = client.get(f"/api/attendance/qr-token/{ev.id}")
    assert token_resp.status_code == 200
    valid_token = token_resp.json()["token"]

    # Participant setup
    p = Participant(full_name="Alice Brown", email="alice.brown@vit.ac.in", college_name="VIT")
    db.add(p)
    db.commit()

    # Register
    reg = Registration(event_id=ev.id, participant_id=p.id, status=RegistrationStatus.CONFIRMED.value)
    db.add(reg)
    db.commit()

    # Attempt check-in with forged token -> 400
    forged_resp = client.post(
        "/api/attendance/check-in",
        json={"event_id": ev.id, "participant_id": p.id, "qr_token": "FORGED_FAKE_TOKEN"}
    )
    assert forged_resp.status_code == 400
    assert "invalid or expired qr token" in forged_resp.json()["detail"].lower()

    # Check-in with valid projector token -> 200
    success_resp = client.post(
        "/api/attendance/check-in",
        json={"event_id": ev.id, "participant_id": p.id, "qr_token": valid_token}
    )
    assert success_resp.status_code == 200
    assert success_resp.json()["success"] is True
    assert success_resp.json()["attendance_status"] == "ATTENDED"


def test_judge_invitation_lifecycle(client, db):
    admin_token = create_access_token({"sub": "admin@occasio.com"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create event
    ev = Event(title="Robotics Challenge", college_name="IITM", category="technical", status=EventStatus.APPROVED)
    db.add(ev)
    db.commit()
    db.refresh(ev)

    # Invite judge
    invite_resp = client.post(
        "/api/judges/invite",
        json={"event_id": ev.id, "email": "dr.smith@mit.edu"},
        headers=headers,
    )
    assert invite_resp.status_code == 201
    invite_data = invite_resp.json()
    assert invite_data["email"] == "dr.smith@mit.edu"
    assert "invite_token=" in invite_data["invitation_url"]

    # Extract token parameter
    import urllib.parse
    parsed = urllib.parse.urlparse(invite_data["invitation_url"])
    params = urllib.parse.parse_qs(parsed.query)
    raw_token = params["invite_token"][0]

    # Accept invitation
    accept_resp = client.post(
        "/api/judges/accept-invite",
        json={
            "token": raw_token,
            "full_name": "Dr. Smith Jury",
            "password": "SecureJury@123"
        }
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["success"] is True

    # Reusing same token should fail
    reuse_resp = client.post(
        "/api/judges/accept-invite",
        json={
            "token": raw_token,
            "full_name": "Dr. Smith Jury",
            "password": "SecureJury@123"
        }
    )
    assert reuse_resp.status_code == 400
