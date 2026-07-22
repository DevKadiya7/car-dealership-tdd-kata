"""Dashboard analytics tests for admin users."""

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


def _create_vehicle(client, headers, **payload):
    defaults = {
        "make": "Toyota",
        "model": "Corolla",
        "category": "sedan",
        "price": "22000.00",
        "quantity": 3,
    }
    defaults.update(payload)
    response = client.post("/api/vehicles", json=defaults, headers=headers)
    return response.json()


def _purchase_vehicle(client, headers, vehicle_id, times=1):
    for _ in range(times):
        response = client.post(f"/api/vehicles/{vehicle_id}/purchase", headers=headers)
        assert response.status_code == 200
    return response.json()


def test_admin_can_view_dashboard_summary(client, customer_headers, admin_headers):
    _create_vehicle(client, admin_headers, make="Toyota", model="Corolla", price="22000.00", quantity=3)
    _create_vehicle(client, admin_headers, make="Honda", model="Civic", price="21000.00", quantity=10)
    _create_vehicle(client, admin_headers, make="Ford", model="F-150", price="45000.00", quantity=5)

    _purchase_vehicle(client, customer_headers, _create_vehicle(client, customer_headers, make="Subaru", model="Outback", price="30000.00", quantity=4)["id"], times=2)

    response = client.get("/api/dashboard/summary", headers=admin_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total_users"] == 2
    assert body["total_vehicles"] == 4
    assert body["total_stock"] == 20
    assert body["total_purchases"] == 2
    assert body["total_revenue"] == "60000.00"


def test_admin_can_view_recent_purchases(client, customer_headers, admin_headers):
    vehicle_a = _create_vehicle(client, admin_headers, make="Mazda", model="3", price="20000.00", quantity=5)
    vehicle_b = _create_vehicle(client, admin_headers, make="Nissan", model="Altima", price="25000.00", quantity=5)

    _purchase_vehicle(client, customer_headers, vehicle_a["id"])
    _purchase_vehicle(client, customer_headers, vehicle_b["id"])

    response = client.get("/api/dashboard/recent-purchases", headers=admin_headers)
    assert response.status_code == 200
    purchases = response.json()
    assert len(purchases) == 2
    assert purchases[0]["vehicle"]["id"] == vehicle_b["id"]
    assert purchases[0]["buyer_email"] == "customer@example.com"
    assert purchases[0]["quantity"] == 1
    assert purchases[0]["price"] == "25000.00"
    assert "purchase_date" in purchases[0]


def test_admin_can_view_low_stock(client, admin_headers):
    _create_vehicle(client, admin_headers, make="Subaru", model="Impreza", price="19000.00", quantity=3)
    _create_vehicle(client, admin_headers, make="Lexus", model="RX", price="55000.00", quantity=8)
    _create_vehicle(client, admin_headers, make="Kia", model="Rio", price="16000.00", quantity=5)

    response = client.get("/api/dashboard/low-stock", headers=admin_headers)

    assert response.status_code == 200
    vehicles = response.json()
    assert len(vehicles) == 2
    assert vehicles[0]["quantity"] <= vehicles[1]["quantity"]
    assert all(v["quantity"] <= 5 for v in vehicles)


def test_admin_can_view_top_selling_vehicles(client, customer_headers, admin_headers):
    vehicle_a = _create_vehicle(client, admin_headers, make="Toyota", model="Camry", price="24000.00", quantity=10)
    vehicle_b = _create_vehicle(client, admin_headers, make="BMW", model="3 Series", price="41000.00", quantity=10)

    _purchase_vehicle(client, customer_headers, vehicle_a["id"], times=2)
    _purchase_vehicle(client, customer_headers, vehicle_b["id"], times=1)

    response = client.get("/api/dashboard/top-selling", headers=admin_headers)

    assert response.status_code == 200
    vehicles = response.json()
    assert vehicles[0]["vehicle"]["id"] == vehicle_a["id"]
    assert vehicles[0]["total_sold"] == 2
    assert vehicles[0]["total_revenue"] == "48000.00"


def test_customer_receives_403_for_dashboard(client, customer_headers):
    response = client.get("/api/dashboard/summary", headers=customer_headers)
    assert response.status_code == 403
