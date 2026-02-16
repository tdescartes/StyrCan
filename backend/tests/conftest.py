"""Pytest configuration and fixtures for backend tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from typing import Generator
import os

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.company import Company
from app.auth.security import get_password_hash

# Use in-memory SQLite for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

# Create test engine
engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session() -> Generator:
    """Create a fresh database session for each test."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session) -> Generator:
    """Create a test client with database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_company(db_session) -> Company:
    """Create a test company."""
    company = Company(
        name="Test Company",
        domain="testcompany.com",
        industry="Technology",
        size="1-10",
        address="123 Test St",
        city="Test City",
        state="TS",
        zip_code="12345",
        country="USA"
    )
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)
    return company


@pytest.fixture
def test_admin_user(db_session, test_company) -> User:
    """Create a test admin user."""
    user = User(
        email="admin@testcompany.com",
        first_name="Admin",
        last_name="User",
        role="admin",
        hashed_password=get_password_hash("TestPassword123!"),
        is_active=True,
        company_id=test_company.id
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_manager_user(db_session, test_company) -> User:
    """Create a test manager user."""
    user = User(
        email="manager@testcompany.com",
        first_name="Manager",
        last_name="User",
        role="manager",
        hashed_password=get_password_hash("TestPassword123!"),
        is_active=True,
        company_id=test_company.id
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_employee_user(db_session, test_company) -> User:
    """Create a test employee user."""
    user = User(
        email="employee@testcompany.com",
        first_name="Employee",
        last_name="User",
        role="employee",
        hashed_password=get_password_hash("TestPassword123!"),
        is_active=True,
        company_id=test_company.id
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(client, test_admin_user) -> str:
    """Get authentication token for admin user."""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@testcompany.com",
            "password": "TestPassword123!"
        }
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def manager_token(client, test_manager_user) -> str:
    """Get authentication token for manager user."""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "manager@testcompany.com",
            "password": "TestPassword123!"
        }
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def employee_token(client, test_employee_user) -> str:
    """Get authentication token for employee user."""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "employee@testcompany.com",
            "password": "TestPassword123!"
        }
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def auth_headers(admin_token) -> dict:
    """Create authorization headers with admin token."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def manager_headers(manager_token) -> dict:
    """Create authorization headers with manager token."""
    return {"Authorization": f"Bearer {manager_token}"}


@pytest.fixture
def employee_headers(employee_token) -> dict:
    """Create authorization headers with employee token."""
    return {"Authorization": f"Bearer {employee_token}"}


# Mock environment variables for testing
@pytest.fixture(autouse=True)
def mock_env_vars(monkeypatch):
    """Mock environment variables for all tests."""
    monkeypatch.setenv("DATABASE_URL", SQLALCHEMY_TEST_DATABASE_URL)
    monkeypatch.setenv("SECRET_KEY", "test-secret-key-for-testing-only-12345")
    monkeypatch.setenv("ENVIRONMENT", "testing")
    monkeypatch.setenv("DEBUG", "true")
    
    # Mock external service keys (won't be used in tests)
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_mock")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_mock")
    monkeypatch.setenv("SENDGRID_API_KEY", "SG.mock")
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "mock_access_key")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "mock_secret_key")
    monkeypatch.setenv("S3_BUCKET_NAME", "test-bucket")
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/1")
