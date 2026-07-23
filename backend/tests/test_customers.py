"""Tests for admin customer management: GET /api/admin/customers,
PATCH /api/admin/customers/{id}/status, DELETE /api/admin/customers/{id}.

Written test-first: the endpoints don't exist yet.
"""
from decimal import Decimal

import pytest

from app.auth.password import hash_password
from app.models.purchase import Purchase
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle


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
def admin_headers(client, db_session):
    admin = User(email="admin@example.com", hashed_password=hash_password("adminpass"), role=UserRole.ADMIN)
    db_session.add(admin)
    db_session.commit()

    token = client.post(
        "/api/auth/login", json={"email": "admin@example.com", "password": "adminpass"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_customers_requires_admin(client, customer_headers):
    response = client.get("/api/admin/customers", headers=customer_headers)

    assert response.status_code == 403


def test_list_customers_excludes_admin_users(client, admin_headers, customer_headers):
    response = client.get("/api/admin/customers", headers=admin_headers)

    assert response.status_code == 200
    emails = [c["email"] for c in response.json()]
    assert "customer@example.com" in emails
    assert "admin@example.com" not in emails


def test_list_customers_returns_purchase_stats(client, db_session, admin_headers, customer_headers):
    customer = db_session.query(User).filter(User.email == "customer@example.com").first()
    vehicle = Vehicle(make="Toyota", model="Corolla", category="sedan", price=Decimal("20000"), quantity=5)
    db_session.add(vehicle)
    db_session.commit()

    db_session.add(Purchase(user_id=customer.id, vehicle_id=vehicle.id, quantity=1, total_price=Decimal("20000")))
    db_session.add(Purchase(user_id=customer.id, vehicle_id=vehicle.id, quantity=1, total_price=Decimal("15000")))
    db_session.commit()

    response = client.get("/api/admin/customers", headers=admin_headers)

    assert response.status_code == 200
    body = next(c for c in response.json() if c["email"] == "customer@example.com")
    assert body["total_purchases"] == 2
    assert Decimal(str(body["total_spent"])) == Decimal("35000")
    assert body["is_active"] is True
    assert body["created_at"] is not None


def test_list_customers_with_no_purchases_returns_zero_stats(client, admin_headers, customer_headers):
    response = client.get("/api/admin/customers", headers=admin_headers)

    body = next(c for c in response.json() if c["email"] == "customer@example.com")
    assert body["total_purchases"] == 0
    assert Decimal(str(body["total_spent"])) == Decimal("0")


def test_disable_customer_account(client, db_session, admin_headers, customer_headers):
    customer = db_session.query(User).filter(User.email == "customer@example.com").first()

    response = client.patch(
        f"/api/admin/customers/{customer.id}/status",
        json={"is_active": False},
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_disable_customer_requires_admin(client, db_session, customer_headers):
    customer = db_session.query(User).filter(User.email == "customer@example.com").first()

    response = client.patch(
        f"/api/admin/customers/{customer.id}/status",
        json={"is_active": False},
        headers=customer_headers,
    )

    assert response.status_code == 403


def test_delete_customer_removes_user(client, db_session, admin_headers, customer_headers):
    customer = db_session.query(User).filter(User.email == "customer@example.com").first()

    response = client.delete(f"/api/admin/customers/{customer.id}", headers=admin_headers)

    assert response.status_code == 204
    assert db_session.query(User).filter(User.email == "customer@example.com").first() is None


def test_delete_customer_requires_admin(client, db_session, customer_headers):
    customer = db_session.query(User).filter(User.email == "customer@example.com").first()

    response = client.delete(f"/api/admin/customers/{customer.id}", headers=customer_headers)

    assert response.status_code == 403
