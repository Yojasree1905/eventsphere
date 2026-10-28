def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_login_success(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "admin@occasio.com", "password": "Admin@1234"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password_returns_generic_error(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "admin@occasio.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Incorrect email or password"


def test_login_nonexistent_user_returns_generic_error(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@occasio.com", "password": "AnyPassword123"},
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Incorrect email or password"


def test_me(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@occasio.com"
    assert resp.json()["is_superadmin"] is True


def test_me_no_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_tampered_token_rejected(client):
    # Invalid signature or forged token
    resp = client.get("/api/auth/me", headers={"Authorization": "Bearer forged.jwt.token"})
    assert resp.status_code == 401
    assert "Invalid or expired token" in resp.json()["detail"]


def test_expired_token_rejected(client):
    from datetime import timedelta
    from app.services.auth_service import create_access_token
    # Token expired 1 hour ago
    expired_token = create_access_token({"sub": "admin@occasio.com"}, expires_delta=timedelta(minutes=-60))
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert resp.status_code == 401
    assert "Invalid or expired token" in resp.json()["detail"]


def test_non_admin_cannot_perform_superadmin_operations(client, db):
    from app.services.auth_service import create_user, create_access_token

    # Create regular non-admin user
    regular_user = create_user(
        db,
        email="regular@occasio.com",
        full_name="Regular Student",
        password="Regular@1234",
        is_superadmin=False,
    )
    token = create_access_token({"sub": regular_user.email})
    headers = {"Authorization": f"Bearer {token}"}

    # Create an event using admin
    admin_resp = client.post(
        "/api/events",
        json={"title": "Test Event for Moderation", "college_name": "MIT", "category": "academic"},
        headers={"Authorization": f"Bearer {create_access_token({'sub': 'admin@occasio.com'})}"},
    )
    event_id = admin_resp.json()["id"]

    # Submit event
    client.patch(f"/api/events/{event_id}/submit", headers=headers)

    # Regular user attempting to approve -> 403 Forbidden
    approve_resp = client.patch(f"/api/events/{event_id}/approve", headers=headers)
    assert approve_resp.status_code == 403
    assert "Superadmin privileges required" in approve_resp.json()["detail"]

    # Regular user attempting to reject -> 403 Forbidden
    reject_resp = client.patch(
        f"/api/events/{event_id}/reject",
        json={"rejection_reason": "Not allowed"},
        headers=headers,
    )
    assert reject_resp.status_code == 403
    assert "Superadmin privileges required" in reject_resp.json()["detail"]


def test_unauthenticated_api_rejection(client):
    endpoints = [
        ("POST", "/api/events"),
        ("GET", "/api/schedules?event_id=1"),
        ("GET", "/api/participants"),
        ("GET", "/api/registrations"),
        ("GET", "/api/monitoring/stats"),
    ]
    for method, path in endpoints:
        if method == "GET":
            resp = client.get(path)
        else:
            resp = client.post(path, json={})
        assert resp.status_code in (401, 403), f"Failed for {path}: status {resp.status_code}"


def test_public_events_discovery_allowed(client):
    # Public visitors can discover events without authentication
    resp = client.get("/api/events")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

