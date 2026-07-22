"""Tests for POST /api/vehicles/:id/purchase and /restock."""
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
def admin_headers(client, db_session):
    # The register endpoint only ever creates customers, so an admin is
    # inserted directly into the test DB to simulate a promoted user.
    admin = User(email="admin@example.com", hashed_password=hash_password("adminpass"), role=UserRole.ADMIN)
    db_session.add(admin)
    db_session.commit()

    token = client.post(
        "/api/auth/login", json={"email": "admin@example.com", "password": "adminpass"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_vehicle(client, headers, quantity=3):
    payload = {
        "make": "Toyota",
        "model": "Corolla",
        "category": "sedan",
        "price": "22000.00",
        "quantity": quantity,
    }
    return client.post("/api/vehicles", json=payload, headers=headers).json()


def test_purchase_decreases_quantity_by_one(client, customer_headers):
    vehicle = _create_vehicle(client, customer_headers, quantity=3)

    response = client.post(f"/api/vehicles/{vehicle['id']}/purchase", headers=customer_headers)

    assert response.status_code == 200
    assert response.json()["quantity"] == 2


def test_purchase_when_out_of_stock_returns_400(client, customer_headers):
    vehicle = _create_vehicle(client, customer_headers, quantity=1)
    client.post(f"/api/vehicles/{vehicle['id']}/purchase", headers=customer_headers)  # quantity -> 0

    response = client.post(f"/api/vehicles/{vehicle['id']}/purchase", headers=customer_headers)

    assert response.status_code == 400


def test_restock_as_admin_increases_quantity(client, customer_headers, admin_headers):
    vehicle = _create_vehicle(client, customer_headers, quantity=2)

    response = client.post(f"/api/vehicles/{vehicle['id']}/restock", headers=admin_headers)

    assert response.status_code == 200
    assert response.json()["quantity"] == 3


def test_restock_as_non_admin_returns_403(client, customer_headers):
    vehicle = _create_vehicle(client, customer_headers, quantity=2)

    response = client.post(f"/api/vehicles/{vehicle['id']}/restock", headers=customer_headers)

    assert response.status_code == 403


def test_delete_vehicle_as_admin_removes_it(client, customer_headers, admin_headers):
    vehicle = _create_vehicle(client, customer_headers, quantity=1)

    delete_response = client.delete(f"/api/vehicles/{vehicle['id']}", headers=admin_headers)
    assert delete_response.status_code == 204

    get_response = client.get("/api/vehicles", headers=customer_headers)
    assert all(v["id"] != vehicle["id"] for v in get_response.json())
