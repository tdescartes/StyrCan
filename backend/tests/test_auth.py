"""Tests for authentication endpoints."""

import pytest
from fastapi.testclient import TestClient


def test_register_user_success(client, test_company):
    """Test successful user registration."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "newuser@testcompany.com",
            "password": "SecurePass123!",
            "first_name": "New",
            "last_name": "User",
            "company_name": test_company.name,
            "role": "employee",
            "accept_terms": True
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@testcompany.com"
    assert "access_token" in data
    assert "refresh_token" in data


def test_register_user_duplicate_email(client, test_admin_user):
    """Test registration with duplicate email fails."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "admin@testcompany.com",  # Already exists
            "password": "SecurePass123!",
            "first_name": "Duplicate",
            "last_name": "User",
            "company_name": "Test Company",
            "role": "employee",
            "accept_terms": True
        }
    )
    
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_register_user_without_tos_acceptance(client, test_company):
    """Test registration without accepting ToS fails."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "newuser@testcompany.com",
            "password": "SecurePass123!",
            "first_name": "New",
            "last_name": "User",
            "company_name": test_company.name,
            "role": "employee",
            "accept_terms": False
        }
    )
    
    assert response.status_code == 400
    assert "terms" in response.json()["detail"].lower()


def test_login_success(client, test_admin_user):
    """Test successful login."""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@testcompany.com",
            "password": "TestPassword123!"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, test_admin_user):
    """Test login with wrong password fails."""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@testcompany.com",
            "password": "WrongPassword123!"
        }
    )
    
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


def test_login_nonexistent_user(client):
    """Test login with non-existent user fails."""
    response = client.post(
        "/api/auth/login",
        json={
            "email": "nonexistent@testcompany.com",
            "password": "TestPassword123!"
        }
    )
    
    assert response.status_code == 401


def test_get_current_user(client, auth_headers, test_admin_user):
    """Test getting current user profile."""
    response = client.get("/api/auth/me", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@testcompany.com"
    assert data["role"] == "admin"
    assert data["first_name"] == "Admin"


def test_get_current_user_unauthorized(client):
    """Test getting current user without token fails."""
    response = client.get("/api/auth/me")
    
    assert response.status_code == 401


def test_refresh_token(client, test_admin_user):
    """Test token refresh."""
    # Login to get tokens
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@testcompany.com",
            "password": "TestPassword123!"
        }
    )
    refresh_token = login_response.json()["refresh_token"]
    
    # Refresh token
    response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_password_reset_request(client, test_admin_user):
    """Test password reset request."""
    response = client.post(
        "/api/auth/password-reset-request",
        json={"email": "admin@testcompany.com"}
    )
    
    # Should return 200 even if email doesn't exist (security)
    assert response.status_code == 200
    assert "sent" in response.json()["message"].lower()


def test_logout(client, auth_headers):
    """Test logout endpoint."""
    response = client.post("/api/auth/logout", headers=auth_headers)
    
    assert response.status_code == 200
    assert "logged out" in response.json()["message"].lower()


class Test2FA:
    """Test suite for 2FA functionality."""
    
    def test_2fa_status_disabled(self, client, auth_headers):
        """Test getting 2FA status when disabled."""
        response = client.get("/api/auth/2fa/status", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["enabled"] is False
    
    def test_2fa_setup(self, client, auth_headers):
        """Test 2FA setup."""
        response = client.post("/api/auth/2fa/setup", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "secret" in data
        assert "qr_code" in data
        assert "backup_codes" in data
        assert len(data["backup_codes"]) == 10
    
    def test_2fa_verify_invalid_code(self, client, auth_headers):
        """Test 2FA verification with invalid code."""
        # Setup 2FA first
        client.post("/api/auth/2fa/setup", headers=auth_headers)
        
        # Try to verify with invalid code
        response = client.post(
            "/api/auth/2fa/verify",
            headers=auth_headers,
            json={"code": "000000"}
        )
        
        assert response.status_code == 400
