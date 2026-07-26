"""Tests for admin user management: GET/POST /api/admin/admins,
PATCH /api/admin/admins/{id}, POST /api/admin/admins/{id}/reset-password,
PATCH /api/admin/admins/{id}/status.

Written test-first: the endpoints don't exist yet.
"""
import pytest

from app.auth.password import hash_password
from app.models.user import User, UserRole


@pytest.fixture()
def customer_headers(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "customer@example.com",
            "password": "pass1234",
            "first_name": "Test",
            "last_name": "Customer",
            "mobile_number": "9876543210",
            "terms_accepted": True,
        },
    )
    token = client.post(
        "/api/auth/login", json={"email": "customer@example.com", "password": "pass1234"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin(db_session):
    admin = User(
        email="admin@example.com",
        hashed_password=hash_password("adminpass1"),
        role=UserRole.ADMIN,
        first_name="Ada",
        last_name="Min",
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture()
def admin_headers(client, admin):
    token = client.post(
        "/api/auth/login", json={"email": "admin@example.com", "password": "adminpass1"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_admin_payload(**overrides):
    payload = {
        "email": "john@company.com",
        "password": "Admin@123",
        "first_name": "John",
        "last_name": "Partner",
        "mobile_number": "9876500000",
    }
    payload.update(overrides)
    return payload


# --- List admins -----------------------------------------------------------


def test_list_admins_requires_admin(client, customer_headers):
    response = client.get("/api/admin/admins", headers=customer_headers)

    assert response.status_code == 403


def test_list_admins_returns_only_admin_users(client, admin_headers, customer_headers):
    response = client.get("/api/admin/admins", headers=admin_headers)

    assert response.status_code == 200
    emails = [a["email"] for a in response.json()]
    assert "admin@example.com" in emails
    assert "customer@example.com" not in emails


# --- Create admin -----------------------------------------------------------


def test_create_admin_requires_admin(client, customer_headers):
    response = client.post(
        "/api/admin/admins", json=create_admin_payload(), headers=customer_headers
    )

    assert response.status_code == 403


def test_create_admin_success(client, admin_headers):
    response = client.post(
        "/api/admin/admins", json=create_admin_payload(), headers=admin_headers
    )

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "john@company.com"
    assert body["role"] == "admin"
    assert body["is_active"] is True
    assert "password" not in body
    assert "hashed_password" not in body


def test_new_admin_can_log_in_immediately(client, admin_headers):
    client.post("/api/admin/admins", json=create_admin_payload(), headers=admin_headers)

    response = client.post(
        "/api/auth/login", json={"email": "john@company.com", "password": "Admin@123"}
    )

    assert response.status_code == 200
    assert response.json()["access_token"]


def test_create_admin_can_access_admin_only_endpoints(client, admin_headers):
    client.post("/api/admin/admins", json=create_admin_payload(), headers=admin_headers)
    token = client.post(
        "/api/auth/login", json={"email": "john@company.com", "password": "Admin@123"}
    ).json()["access_token"]
    new_admin_headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/admin/admins", headers=new_admin_headers)

    assert response.status_code == 200


def test_create_admin_duplicate_email_returns_409(client, admin_headers):
    client.post("/api/admin/admins", json=create_admin_payload(), headers=admin_headers)

    response = client.post(
        "/api/admin/admins", json=create_admin_payload(), headers=admin_headers
    )

    assert response.status_code == 409


def test_create_admin_invalid_email_returns_422(client, admin_headers):
    response = client.post(
        "/api/admin/admins",
        json=create_admin_payload(email="not-an-email"),
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_create_admin_weak_password_returns_422(client, admin_headers):
    response = client.post(
        "/api/admin/admins",
        json=create_admin_payload(password="weak"),
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_create_admin_missing_required_field_returns_422(client, admin_headers):
    payload = create_admin_payload()
    del payload["first_name"]

    response = client.post("/api/admin/admins", json=payload, headers=admin_headers)

    assert response.status_code == 422


def test_create_admin_invalid_mobile_number_returns_422(client, admin_headers):
    response = client.post(
        "/api/admin/admins",
        json=create_admin_payload(mobile_number="abc"),
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_create_admin_can_start_inactive(client, admin_headers):
    response = client.post(
        "/api/admin/admins",
        json=create_admin_payload(is_active=False),
        headers=admin_headers,
    )

    assert response.status_code == 201
    assert response.json()["is_active"] is False


# --- Update admin -----------------------------------------------------------


def test_update_admin_requires_admin(client, admin, customer_headers):
    response = client.patch(
        f"/api/admin/admins/{admin.id}",
        json={"first_name": "Updated"},
        headers=customer_headers,
    )

    assert response.status_code == 403


def test_update_admin_updates_profile_fields(client, admin_headers):
    created = client.post(
        "/api/admin/admins", json=create_admin_payload(), headers=admin_headers
    ).json()

    response = client.patch(
        f"/api/admin/admins/{created['id']}",
        json={"first_name": "Johnny", "mobile_number": "9999999999"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["first_name"] == "Johnny"
    assert body["mobile_number"] == "9999999999"


def test_update_admin_not_found_returns_404(client, admin_headers):
    response = client.patch(
        "/api/admin/admins/00000000-0000-0000-0000-000000000000",
        json={"first_name": "Ghost"},
        headers=admin_headers,
    )

    assert response.status_code == 404


# --- Reset password ---------------------------------------------------------


def test_reset_admin_password_requires_admin(client, admin, customer_headers):
    response = client.post(
        f"/api/admin/admins/{admin.id}/reset-password",
        json={"new_password": "NewPass123"},
        headers=customer_headers,
    )

    assert response.status_code == 403


def test_reset_admin_password_allows_login_with_new_password(client, admin_headers):
    created = client.post(
        "/api/admin/admins", json=create_admin_payload(), headers=admin_headers
    ).json()

    response = client.post(
        f"/api/admin/admins/{created['id']}/reset-password",
        json={"new_password": "NewPass123"},
        headers=admin_headers,
    )
    assert response.status_code == 200

    login = client.post(
        "/api/auth/login", json={"email": "john@company.com", "password": "NewPass123"}
    )
    assert login.status_code == 200


def test_reset_admin_password_weak_password_returns_422(client, admin_headers):
    created = client.post(
        "/api/admin/admins", json=create_admin_payload(), headers=admin_headers
    ).json()

    response = client.post(
        f"/api/admin/admins/{created['id']}/reset-password",
        json={"new_password": "weak"},
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_reset_admin_password_not_found_returns_404(client, admin_headers):
    response = client.post(
        "/api/admin/admins/00000000-0000-0000-0000-000000000000/reset-password",
        json={"new_password": "NewPass123"},
        headers=admin_headers,
    )

    assert response.status_code == 404


# --- Activate / deactivate ---------------------------------------------------


def test_set_admin_status_requires_admin(client, admin, customer_headers):
    response = client.patch(
        f"/api/admin/admins/{admin.id}/status",
        json={"is_active": False},
        headers=customer_headers,
    )

    assert response.status_code == 403


def test_admin_can_deactivate_another_admin(client, admin_headers):
    created = client.post(
        "/api/admin/admins", json=create_admin_payload(), headers=admin_headers
    ).json()

    response = client.patch(
        f"/api/admin/admins/{created['id']}/status",
        json={"is_active": False},
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_admin_can_reactivate_another_admin(client, admin_headers):
    created = client.post(
        "/api/admin/admins", json=create_admin_payload(is_active=False), headers=admin_headers
    ).json()

    response = client.patch(
        f"/api/admin/admins/{created['id']}/status",
        json={"is_active": True},
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is True


def test_admin_cannot_deactivate_self(client, admin, admin_headers):
    response = client.patch(
        f"/api/admin/admins/{admin.id}/status",
        json={"is_active": False},
        headers=admin_headers,
    )

    assert response.status_code == 400


def test_set_admin_status_not_found_returns_404(client, admin_headers):
    response = client.patch(
        "/api/admin/admins/00000000-0000-0000-0000-000000000000/status",
        json={"is_active": False},
        headers=admin_headers,
    )

    assert response.status_code == 404
