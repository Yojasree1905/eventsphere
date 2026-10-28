import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

# ── In-memory SQLite for tests ───────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite:///:memory:"

engine_test = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    from app.services.auth_service import create_user
    from app.config import settings
    Base.metadata.create_all(bind=engine_test)
    session = TestingSessionLocal()
    create_user(
        session,
        email=settings.FIRST_ADMIN_EMAIL,
        full_name="Super Admin",
        password=settings.FIRST_ADMIN_PASSWORD,
        is_superadmin=True,
    )
    session.close()
    yield
    Base.metadata.drop_all(bind=engine_test)


@pytest.fixture()
def db():
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_token(client):
    """Login as the seeded superadmin and return a Bearer token."""
    resp = client.post(
        "/api/auth/login",
        json={"email": "admin@occasio.com", "password": "Admin@1234"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
