"""Tests for the vehicle loan feature (Phase 6):
POST /api/loans, GET /api/loans/me, GET /api/loans,
PATCH /api/loans/{id}/status.

Written test-first: the loan module doesn't exist yet.
"""
import pytest

from app.auth.password import hash_password
from app.models.user import User, UserRole

VEHICLE_PRICE = "1000000.00"  # listed price
DISCOUNTED_PRICE = "900000.00"  # 10% Today Only discount - what loan math is based on
MIN_DOWN_PAYMENT = "270000.00"  # 30% of the discounted price
LOAN_AMOUNT = "630000.00"  # discounted price - min down payment


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


@pytest.fixture()
def vehicle(client, customer_headers):
    response = client.post(
        "/api/vehicles",
        json={
            "make": "Toyota",
            "model": "Fortuner",
            "category": "suv",
            "price": VEHICLE_PRICE,
            "quantity": 3,
        },
        headers=customer_headers,
    )
    return response.json()


def loan_payload(vehicle_id, **overrides):
    payload = {
        "vehicle_id": vehicle_id,
        "down_payment": MIN_DOWN_PAYMENT,
        "duration_years": 5,
    }
    payload.update(overrides)
    return payload


# --- Create loan -------------------------------------------------------------


def test_create_loan_requires_authentication(client, vehicle):
    response = client.post("/api/loans", json=loan_payload(vehicle["id"]))

    assert response.status_code == 401


def test_create_loan_success_returns_pending_loan_with_calculated_fields(
    client, customer_headers, vehicle
):
    response = client.post(
        "/api/loans", json=loan_payload(vehicle["id"]), headers=customer_headers
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    assert body["vehicle_price"] == DISCOUNTED_PRICE
    assert body["down_payment"] == MIN_DOWN_PAYMENT
    assert body["loan_amount"] == LOAN_AMOUNT
    assert body["interest_rate"] == "8.00"
    assert body["duration_years"] == 5
    assert body["monthly_emi"] == "12774.13"
    assert body["total_interest"] == "136447.80"
    assert body["total_payable"] == "1036447.80"
    assert body["vehicle_make"] == "Toyota"
    assert body["vehicle_model"] == "Fortuner"
    assert body["customer_email"] == "customer@example.com"
    assert "purchase_id" in body


def test_create_loan_decrements_vehicle_stock(client, customer_headers, vehicle):
    client.post("/api/loans", json=loan_payload(vehicle["id"]), headers=customer_headers)

    updated = client.get(f"/api/vehicles/{vehicle['id']}", headers=customer_headers).json()
    assert updated["quantity"] == 2


def test_create_loan_records_underlying_purchase_with_loan_payment_method(
    client, customer_headers, admin_headers, vehicle
):
    client.post("/api/loans", json=loan_payload(vehicle["id"]), headers=customer_headers)

    purchases = client.get("/api/purchases", headers=admin_headers).json()
    record = next(p for p in purchases if p["vehicle_id"] == vehicle["id"])
    assert record["payment_method"] == "loan"


def test_create_loan_below_minimum_down_payment_returns_400(client, customer_headers, vehicle):
    response = client.post(
        "/api/loans",
        json=loan_payload(vehicle["id"], down_payment="100000.00"),
        headers=customer_headers,
    )

    assert response.status_code == 400


def test_create_loan_at_exact_minimum_down_payment_boundary_succeeds(
    client, customer_headers, vehicle
):
    response = client.post(
        "/api/loans",
        json=loan_payload(vehicle["id"], down_payment=MIN_DOWN_PAYMENT),
        headers=customer_headers,
    )

    assert response.status_code == 201


def test_create_loan_down_payment_exceeding_price_returns_400(client, customer_headers, vehicle):
    response = client.post(
        "/api/loans",
        json=loan_payload(vehicle["id"], down_payment="1500000.00"),
        headers=customer_headers,
    )

    assert response.status_code == 400


def test_create_loan_duration_above_range_returns_422(client, customer_headers, vehicle):
    response = client.post(
        "/api/loans",
        json=loan_payload(vehicle["id"], duration_years=8),
        headers=customer_headers,
    )

    assert response.status_code == 422


def test_create_loan_duration_below_range_returns_422(client, customer_headers, vehicle):
    response = client.post(
        "/api/loans",
        json=loan_payload(vehicle["id"], duration_years=0),
        headers=customer_headers,
    )

    assert response.status_code == 422


@pytest.mark.parametrize("years", [1, 2, 3, 4, 5, 6, 7])
def test_create_loan_allows_every_valid_duration(client, customer_headers, vehicle, years):
    response = client.post(
        "/api/loans",
        json=loan_payload(vehicle["id"], duration_years=years),
        headers=customer_headers,
    )

    assert response.status_code == 201
    assert response.json()["duration_years"] == years


def test_create_loan_vehicle_not_found_returns_404(client, customer_headers):
    response = client.post(
        "/api/loans",
        json=loan_payload("00000000-0000-0000-0000-000000000000"),
        headers=customer_headers,
    )

    assert response.status_code == 404


def test_create_loan_insufficient_stock_returns_400(client, customer_headers):
    sold_out = client.post(
        "/api/vehicles",
        json={"make": "Kia", "model": "Seltos", "category": "suv", "price": VEHICLE_PRICE, "quantity": 0},
        headers=customer_headers,
    ).json()

    response = client.post(
        "/api/loans", json=loan_payload(sold_out["id"]), headers=customer_headers
    )

    assert response.status_code == 400


# --- My loans ------------------------------------------------------------


def test_get_my_loans_requires_authentication(client):
    response = client.get("/api/loans/me")

    assert response.status_code == 401


def test_get_my_loans_returns_only_current_customer_loans(
    client, customer_headers, admin_headers, vehicle
):
    client.post("/api/loans", json=loan_payload(vehicle["id"]), headers=customer_headers)

    response = client.get("/api/loans/me", headers=customer_headers)

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["vehicle_id"] == vehicle["id"]


# --- All loans (admin) -----------------------------------------------------


def test_get_all_loans_requires_admin(client, customer_headers):
    response = client.get("/api/loans", headers=customer_headers)

    assert response.status_code == 403


def test_get_all_loans_includes_customer_and_vehicle_details(
    client, customer_headers, admin_headers, vehicle
):
    client.post("/api/loans", json=loan_payload(vehicle["id"]), headers=customer_headers)

    response = client.get("/api/loans", headers=admin_headers)

    assert response.status_code == 200
    record = next(l for l in response.json() if l["vehicle_id"] == vehicle["id"])
    assert record["vehicle_make"] == "Toyota"
    assert record["customer_email"] == "customer@example.com"


# --- Loan status transitions (admin) ----------------------------------------


def test_set_loan_status_requires_admin(client, customer_headers, vehicle):
    created = client.post(
        "/api/loans", json=loan_payload(vehicle["id"]), headers=customer_headers
    ).json()

    response = client.patch(
        f"/api/loans/{created['id']}/status",
        json={"status": "approved"},
        headers=customer_headers,
    )

    assert response.status_code == 403


def test_admin_can_approve_loan(client, customer_headers, admin_headers, vehicle):
    created = client.post(
        "/api/loans", json=loan_payload(vehicle["id"]), headers=customer_headers
    ).json()

    response = client.patch(
        f"/api/loans/{created['id']}/status",
        json={"status": "approved"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "approved"


def test_admin_can_reject_loan(client, customer_headers, admin_headers, vehicle):
    created = client.post(
        "/api/loans", json=loan_payload(vehicle["id"]), headers=customer_headers
    ).json()

    response = client.patch(
        f"/api/loans/{created['id']}/status",
        json={"status": "rejected"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "rejected"


def test_admin_can_mark_loan_completed(client, customer_headers, admin_headers, vehicle):
    created = client.post(
        "/api/loans", json=loan_payload(vehicle["id"]), headers=customer_headers
    ).json()
    client.patch(
        f"/api/loans/{created['id']}/status",
        json={"status": "approved"},
        headers=admin_headers,
    )

    response = client.patch(
        f"/api/loans/{created['id']}/status",
        json={"status": "completed"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "completed"


def test_set_loan_status_invalid_value_returns_422(client, customer_headers, admin_headers, vehicle):
    created = client.post(
        "/api/loans", json=loan_payload(vehicle["id"]), headers=customer_headers
    ).json()

    response = client.patch(
        f"/api/loans/{created['id']}/status",
        json={"status": "bogus"},
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_set_loan_status_not_found_returns_404(client, admin_headers):
    response = client.patch(
        "/api/loans/00000000-0000-0000-0000-000000000000/status",
        json={"status": "approved"},
        headers=admin_headers,
    )

    assert response.status_code == 404
