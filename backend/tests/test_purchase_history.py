"""Purchase history feature tests.

These tests are written before the purchase history implementation,
so they should fail until the feature is built.
"""

import pytest

from app.auth.password import hash_password
from app.models.user import User, UserRole


@pytest.fixture()
def customer_headers(client):
    client.post("/api/auth/register", json={"email": "customer@example.com", "password": "pass1234"})
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


def test_purchase_creates_history_record_and_returns_vehicle(client, customer_headers):
    response = client.post(
        "/api/vehicles",
        json={
            "make": "Toyota",
            "model": "Corolla",
            "category": "sedan",
            "price": "22000.00",
            "quantity": 3,
        },
        headers=customer_headers,
    )
    vehicle = response.json()

    purchase_response = client.post(f"/api/vehicles/{vehicle['id']}/purchase", headers=customer_headers)

    assert purchase_response.status_code == 200
    assert purchase_response.json()["quantity"] == 2

    history_response = client.get("/api/purchases/me", headers=customer_headers)
    assert history_response.status_code == 200
    assert isinstance(history_response.json(), list)
    assert history_response.json()[0]["vehicle_id"] == vehicle["id"]
    assert history_response.json()[0]["quantity"] == 1
    assert history_response.json()[0]["total_price"] == "22000.00"


def test_get_purchases_me_returns_only_current_user_history(client, customer_headers, admin_headers):
    response = client.post(
        "/api/vehicles",
        json={
            "make": "Honda",
            "model": "Civic",
            "category": "sedan",
            "price": "21000.00",
            "quantity": 2,
        },
        headers=customer_headers,
    )
    vehicle = response.json()

    client.post(f"/api/vehicles/{vehicle['id']}/purchase", headers=customer_headers)

    response = client.get("/api/purchases/me", headers=admin_headers)
    assert response.status_code == 200
    assert all(entry["user_id"] != "" for entry in response.json())


def test_get_all_purchases_requires_admin(client, customer_headers):
    response = client.get("/api/purchases", headers=customer_headers)
    assert response.status_code == 403


def test_get_all_purchases_as_admin_returns_purchase_records(client, customer_headers, admin_headers):
    response = client.post(
        "/api/vehicles",
        json={
            "make": "Ford",
            "model": "F-150",
            "category": "truck",
            "price": "45000.00",
            "quantity": 1,
        },
        headers=customer_headers,
    )
    vehicle = response.json()

    client.post(f"/api/vehicles/{vehicle['id']}/purchase", headers=customer_headers)

    all_purchases_response = client.get("/api/purchases", headers=admin_headers)
    assert all_purchases_response.status_code == 200
    assert isinstance(all_purchases_response.json(), list)
    assert len(all_purchases_response.json()) >= 1
