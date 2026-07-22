"""Dashboard analytics tests for admin users."""

import calendar
from datetime import datetime

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
        "category": "Sedan",
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
    _create_vehicle(client, admin_headers, make="Toyota", model="Corolla", category="Sedan", price="22000.00", quantity=3)
    _create_vehicle(client, admin_headers, make="Honda", model="Civic", category="Sedan", price="21000.00", quantity=10)
    _create_vehicle(client, admin_headers, make="Ford", model="F-150", category="Truck", price="45000.00", quantity=5)

    _purchase_vehicle(
        client,
        customer_headers,
        _create_vehicle(client, customer_headers, make="Subaru", model="Outback", category="SUV", price="30000.00", quantity=4)["id"],
        times=2,
    )

    response = client.get("/api/dashboard/summary", headers=admin_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total_vehicles"] == 4
    assert body["total_stock"] == 20
    assert body["total_customers"] == 2
    assert body["total_sales"] == 2
    assert body["total_revenue"] == "60000.00"
    assert body["low_stock_count"] == 3


def test_admin_can_view_recent_purchases(client, customer_headers, admin_headers):
    vehicle_a = _create_vehicle(client, admin_headers, make="Mazda", model="3", category="Sedan", price="20000.00", quantity=5)
    vehicle_b = _create_vehicle(client, admin_headers, make="Nissan", model="Altima", category="Sedan", price="25000.00", quantity=5)

    _purchase_vehicle(client, customer_headers, vehicle_a["id"])
    _purchase_vehicle(client, customer_headers, vehicle_b["id"])

    response = client.get("/api/dashboard/recent-purchases", headers=admin_headers)
    assert response.status_code == 200

    purchases = response.json()
    assert len(purchases) == 2
    assert purchases[0]["vehicle_make"] == "Nissan"
    assert purchases[0]["vehicle_model"] == "Altima"
    assert purchases[0]["customer_email"] == "customer@example.com"
    assert purchases[0]["quantity"] == 1
    assert purchases[0]["price"] == "25000.00"
    assert "purchase_date" in purchases[0]


def test_admin_can_view_top_selling_vehicles(client, customer_headers, admin_headers):
    vehicle_a = _create_vehicle(client, admin_headers, make="Toyota", model="Camry", category="Sedan", price="24000.00", quantity=10)
    vehicle_b = _create_vehicle(client, admin_headers, make="BMW", model="3 Series", category="Luxury", price="41000.00", quantity=10)

    _purchase_vehicle(client, customer_headers, vehicle_a["id"], times=2)
    _purchase_vehicle(client, customer_headers, vehicle_b["id"], times=1)

    response = client.get("/api/dashboard/top-selling", headers=admin_headers)
    assert response.status_code == 200

    vehicles = response.json()
    assert vehicles[0]["vehicle_id"] == vehicle_a["id"]
    assert vehicles[0]["make"] == "Toyota"
    assert vehicles[0]["model"] == "Camry"
    assert vehicles[0]["units_sold"] == 2
    assert vehicles[0]["revenue"] == "48000.00"


def test_admin_can_view_low_stock(client, admin_headers):
    _create_vehicle(client, admin_headers, make="Subaru", model="Impreza", category="Sedan", price="19000.00", quantity=3)
    _create_vehicle(client, admin_headers, make="Lexus", model="RX", category="Luxury", price="55000.00", quantity=8)
    _create_vehicle(client, admin_headers, make="Kia", model="Rio", category="Sedan", price="16000.00", quantity=5)

    response = client.get("/api/dashboard/low-stock", headers=admin_headers)
    assert response.status_code == 200

    vehicles = response.json()
    assert len(vehicles) == 2
    assert vehicles[0]["quantity"] <= vehicles[1]["quantity"]
    assert all(vehicle["quantity"] <= 5 for vehicle in vehicles)


def test_admin_can_view_sales_by_category(client, customer_headers, admin_headers):
    suv_vehicle = _create_vehicle(
        client,
        admin_headers,
        make="Jeep",
        model="Wrangler",
        category="SUV",
        price="35000.00",
        quantity=5,
    )
    sedan_vehicle = _create_vehicle(
        client,
        admin_headers,
        make="Honda",
        model="Accord",
        category="Sedan",
        price="26000.00",
        quantity=5,
    )

    _purchase_vehicle(client, customer_headers, suv_vehicle["id"], times=2)
    _purchase_vehicle(client, customer_headers, sedan_vehicle["id"], times=1)

    response = client.get("/api/dashboard/sales-by-category", headers=admin_headers)
    assert response.status_code == 200

    categories = {item["category"]: item for item in response.json()}
    assert categories["SUV"]["units_sold"] == 2
    assert categories["SUV"]["revenue"] == "70000.00"
    assert categories["Sedan"]["units_sold"] == 1
    assert categories["Sedan"]["revenue"] == "26000.00"


def test_admin_can_view_monthly_sales(client, customer_headers, admin_headers):
    vehicle = _create_vehicle(
        client,
        admin_headers,
        make="Tesla",
        model="Model 3",
        category="Electric",
        price="42000.00",
        quantity=5,
    )

    _purchase_vehicle(client, customer_headers, vehicle["id"], times=2)

    response = client.get("/api/dashboard/monthly-sales", headers=admin_headers)
    assert response.status_code == 200

    monthly_sales = response.json()
    assert len(monthly_sales) == 12

    month_names = [item["month"] for item in monthly_sales]
    assert month_names == list(calendar.month_name)[1:]

    current_month = datetime.now().strftime("%B")
    current_month_row = next(item for item in monthly_sales if item["month"] == current_month)
    assert current_month_row["revenue"] == "84000.00"
