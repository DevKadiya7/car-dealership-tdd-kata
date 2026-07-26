"""Tests for the vehicle service/maintenance booking feature:
POST /api/service-bookings, GET /api/service-bookings/me,
GET /api/service-bookings, PATCH /api/service-bookings/{id}/status.

A customer may only book service for a vehicle they've actually
purchased - ownership is checked against existing Purchase records,
since this system tracks vehicle listings (with stock quantity) rather
than individually-owned VINs.

Written test-first: the service booking module doesn't exist yet.
"""
from datetime import date, timedelta

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


@pytest.fixture()
def owned_vehicle(client, customer_headers):
    """A vehicle the customer has actually purchased (establishes ownership)."""
    vehicle = client.post(
        "/api/vehicles",
        json={"make": "Toyota", "model": "Fortuner", "category": "suv", "price": "35000.00", "quantity": 3},
        headers=customer_headers,
    ).json()
    client.post(f"/api/vehicles/{vehicle['id']}/purchase", headers=customer_headers)
    return vehicle


@pytest.fixture()
def unowned_vehicle(client, customer_headers):
    """A vehicle that exists but the customer never bought."""
    return client.post(
        "/api/vehicles",
        json={"make": "Honda", "model": "City", "category": "sedan", "price": "15000.00", "quantity": 3},
        headers=customer_headers,
    ).json()


TOMORROW = (date.today() + timedelta(days=1)).isoformat()
TODAY = date.today().isoformat()
YESTERDAY = (date.today() - timedelta(days=1)).isoformat()


def booking_payload(vehicle_id, **overrides):
    payload = {
        "vehicle_id": vehicle_id,
        "service_type": "oil_change",
        "preferred_date": TOMORROW,
        "notes": "Please check the brakes too.",
    }
    payload.update(overrides)
    return payload


# --- Create booking ----------------------------------------------------------


def test_create_booking_requires_authentication(client, owned_vehicle):
    response = client.post("/api/service-bookings", json=booking_payload(owned_vehicle["id"]))

    assert response.status_code == 401


def test_create_booking_success_returns_pending_booking(client, customer_headers, owned_vehicle):
    response = client.post(
        "/api/service-bookings", json=booking_payload(owned_vehicle["id"]), headers=customer_headers
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    assert body["service_type"] == "oil_change"
    assert body["preferred_date"] == TOMORROW
    assert body["notes"] == "Please check the brakes too."
    assert body["vehicle_make"] == "Toyota"
    assert body["vehicle_model"] == "Fortuner"
    assert body["customer_email"] == "customer@example.com"


def test_create_booking_with_no_notes_succeeds(client, customer_headers, owned_vehicle):
    payload = booking_payload(owned_vehicle["id"])
    del payload["notes"]

    response = client.post("/api/service-bookings", json=payload, headers=customer_headers)

    assert response.status_code == 201
    assert response.json()["notes"] is None


def test_create_booking_for_unowned_vehicle_returns_403(client, customer_headers, unowned_vehicle):
    response = client.post(
        "/api/service-bookings", json=booking_payload(unowned_vehicle["id"]), headers=customer_headers
    )

    assert response.status_code == 403


def test_create_booking_vehicle_not_found_returns_404(client, customer_headers):
    response = client.post(
        "/api/service-bookings",
        json=booking_payload("00000000-0000-0000-0000-000000000000"),
        headers=customer_headers,
    )

    assert response.status_code == 404


def test_create_booking_invalid_service_type_returns_422(client, customer_headers, owned_vehicle):
    response = client.post(
        "/api/service-bookings",
        json=booking_payload(owned_vehicle["id"], service_type="engine_rebuild"),
        headers=customer_headers,
    )

    assert response.status_code == 422


@pytest.mark.parametrize(
    "service_type",
    ["oil_change", "tire_rotation", "brake_service", "battery_replacement",
     "general_inspection", "ac_service", "wheel_alignment", "full_service"],
)
def test_create_booking_allows_every_valid_service_type(client, customer_headers, owned_vehicle, service_type):
    response = client.post(
        "/api/service-bookings",
        json=booking_payload(owned_vehicle["id"], service_type=service_type),
        headers=customer_headers,
    )

    assert response.status_code == 201
    assert response.json()["service_type"] == service_type


def test_create_booking_past_preferred_date_returns_422(client, customer_headers, owned_vehicle):
    response = client.post(
        "/api/service-bookings",
        json=booking_payload(owned_vehicle["id"], preferred_date=YESTERDAY),
        headers=customer_headers,
    )

    assert response.status_code == 422


def test_create_booking_today_preferred_date_succeeds(client, customer_headers, owned_vehicle):
    response = client.post(
        "/api/service-bookings",
        json=booking_payload(owned_vehicle["id"], preferred_date=TODAY),
        headers=customer_headers,
    )

    assert response.status_code == 201


# --- My bookings -------------------------------------------------------------


def test_get_my_bookings_requires_authentication(client):
    response = client.get("/api/service-bookings/me")

    assert response.status_code == 401


def test_get_my_bookings_returns_only_current_customer_bookings(client, customer_headers, owned_vehicle):
    client.post("/api/service-bookings", json=booking_payload(owned_vehicle["id"]), headers=customer_headers)

    response = client.get("/api/service-bookings/me", headers=customer_headers)

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["vehicle_id"] == owned_vehicle["id"]


# --- All bookings (admin) -----------------------------------------------------


def test_get_all_bookings_requires_admin(client, customer_headers):
    response = client.get("/api/service-bookings", headers=customer_headers)

    assert response.status_code == 403


def test_get_all_bookings_includes_customer_and_vehicle_details(
    client, customer_headers, admin_headers, owned_vehicle
):
    client.post("/api/service-bookings", json=booking_payload(owned_vehicle["id"]), headers=customer_headers)

    response = client.get("/api/service-bookings", headers=admin_headers)

    assert response.status_code == 200
    record = next(b for b in response.json() if b["vehicle_id"] == owned_vehicle["id"])
    assert record["vehicle_make"] == "Toyota"
    assert record["customer_email"] == "customer@example.com"


# --- Status transitions (admin) -----------------------------------------------


def test_set_booking_status_requires_admin(client, customer_headers, owned_vehicle):
    created = client.post(
        "/api/service-bookings", json=booking_payload(owned_vehicle["id"]), headers=customer_headers
    ).json()

    response = client.patch(
        f"/api/service-bookings/{created['id']}/status",
        json={"status": "confirmed"},
        headers=customer_headers,
    )

    assert response.status_code == 403


def test_admin_can_confirm_booking(client, customer_headers, admin_headers, owned_vehicle):
    created = client.post(
        "/api/service-bookings", json=booking_payload(owned_vehicle["id"]), headers=customer_headers
    ).json()

    response = client.patch(
        f"/api/service-bookings/{created['id']}/status",
        json={"status": "confirmed"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "confirmed"


def test_admin_can_cancel_booking(client, customer_headers, admin_headers, owned_vehicle):
    created = client.post(
        "/api/service-bookings", json=booking_payload(owned_vehicle["id"]), headers=customer_headers
    ).json()

    response = client.patch(
        f"/api/service-bookings/{created['id']}/status",
        json={"status": "cancelled"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


def test_admin_can_mark_booking_completed(client, customer_headers, admin_headers, owned_vehicle):
    created = client.post(
        "/api/service-bookings", json=booking_payload(owned_vehicle["id"]), headers=customer_headers
    ).json()
    client.patch(
        f"/api/service-bookings/{created['id']}/status",
        json={"status": "confirmed"},
        headers=admin_headers,
    )

    response = client.patch(
        f"/api/service-bookings/{created['id']}/status",
        json={"status": "completed"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "completed"


def test_set_booking_status_invalid_value_returns_422(client, customer_headers, admin_headers, owned_vehicle):
    created = client.post(
        "/api/service-bookings", json=booking_payload(owned_vehicle["id"]), headers=customer_headers
    ).json()

    response = client.patch(
        f"/api/service-bookings/{created['id']}/status",
        json={"status": "bogus"},
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_set_booking_status_not_found_returns_404(client, admin_headers):
    response = client.patch(
        "/api/service-bookings/00000000-0000-0000-0000-000000000000/status",
        json={"status": "confirmed"},
        headers=admin_headers,
    )

    assert response.status_code == 404
