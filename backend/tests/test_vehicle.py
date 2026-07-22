"""Tests for vehicle CRUD and search. All these endpoints require auth,
so each test registers/logs in a user first to obtain a bearer token."""
import pytest


@pytest.fixture()
def auth_headers(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "user@example.com",
            "password": "pass1234",
            "first_name": "Test",
            "last_name": "User",
            "mobile_number": "9876543210",
            "terms_accepted": True,
        },
    )
    login_response = client.post(
        "/api/auth/login", json={"email": "user@example.com", "password": "pass1234"}
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_vehicle(client, auth_headers, **overrides):
    payload = {
        "make": "Toyota",
        "model": "Corolla",
        "category": "sedan",
        "price": "22000.00",
        "quantity": 5,
    }
    payload.update(overrides)
    return client.post("/api/vehicles", json=payload, headers=auth_headers)


def test_add_vehicle_requires_authentication(client):
    response = client.post(
        "/api/vehicles",
        json={"make": "Honda", "model": "Civic", "category": "sedan", "price": "21000.00", "quantity": 3},
    )
    assert response.status_code == 401


def test_add_vehicle_returns_created_vehicle(client, auth_headers):
    response = _create_vehicle(client, auth_headers)

    assert response.status_code == 201
    body = response.json()
    assert body["make"] == "Toyota"
    assert body["quantity"] == 5
    assert "id" in body


def test_list_vehicles_returns_all_added_vehicles(client, auth_headers):
    _create_vehicle(client, auth_headers, make="Toyota", model="Corolla")
    _create_vehicle(client, auth_headers, make="Ford", model="F-150", category="truck")

    response = client.get("/api/vehicles", headers=auth_headers)

    assert response.status_code == 200
    makes = {vehicle["make"] for vehicle in response.json()}
    assert makes == {"Toyota", "Ford"}


def test_search_vehicles_by_make(client, auth_headers):
    _create_vehicle(client, auth_headers, make="Toyota", model="Corolla")
    _create_vehicle(client, auth_headers, make="Ford", model="F-150", category="truck")

    response = client.get("/api/vehicles/search?make=Toyota", headers=auth_headers)

    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["make"] == "Toyota"


def test_search_vehicles_by_price_range(client, auth_headers):
    _create_vehicle(client, auth_headers, make="Toyota", model="Corolla", price="22000.00")
    _create_vehicle(client, auth_headers, make="Porsche", model="911", price="120000.00")

    response = client.get(
        "/api/vehicles/search?min_price=100000&max_price=150000", headers=auth_headers
    )

    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["make"] == "Porsche"


def test_update_vehicle_changes_only_provided_fields(client, auth_headers):
    created = _create_vehicle(client, auth_headers).json()

    response = client.put(
        f"/api/vehicles/{created['id']}",
        json={"price": "19999.99"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["price"] == "19999.99"
    assert body["make"] == "Toyota"  # unchanged


def test_update_nonexistent_vehicle_returns_404(client, auth_headers):
    response = client.put(
        "/api/vehicles/00000000-0000-0000-0000-000000000000",
        json={"price": "1.00"},
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_delete_vehicle_as_non_admin_returns_403(client, auth_headers):
    created = _create_vehicle(client, auth_headers).json()

    response = client.delete(f"/api/vehicles/{created['id']}", headers=auth_headers)

    assert response.status_code == 403
