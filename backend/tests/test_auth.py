"""
Tests for POST /api/auth/register and POST /api/auth/login.

This file was written test-first: each test below was red (failing,
because the endpoint didn't exist yet) before app/routers/auth.py,
app/services/auth_service.py and app/repositories/user_repository.py
were implemented to make it green.

Registration requires a full profile as of Phase 4 (first_name, last_name,
mobile_number, password, terms_accepted are mandatory; address/city/state/
country/postal_code are optional) - see VALID_REGISTRATION_PAYLOAD below,
reused across both the original and the extended-fields tests.
"""

VALID_REGISTRATION_PAYLOAD = {
    "email": "jane.doe@example.com",
    "password": "Passw0rd!",
    "first_name": "Jane",
    "last_name": "Doe",
    "mobile_number": "9876543210",
    "terms_accepted": True,
}


def test_register_new_user_returns_201_and_user_data(client):
    response = client.post(
        "/api/auth/register",
        json={**VALID_REGISTRATION_PAYLOAD, "email": "buyer@example.com"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "buyer@example.com"
    assert body["role"] == "customer"
    # The hashed password must never be returned to the client
    assert "password" not in body
    assert "hashed_password" not in body


def test_register_with_duplicate_email_returns_409(client):
    client.post("/api/auth/register", json={**VALID_REGISTRATION_PAYLOAD, "email": "dupe@example.com"})

    response = client.post(
        "/api/auth/register",
        json={**VALID_REGISTRATION_PAYLOAD, "email": "dupe@example.com"},
    )

    assert response.status_code == 409


def test_register_with_invalid_email_returns_422(client):
    response = client.post(
        "/api/auth/register",
        json={**VALID_REGISTRATION_PAYLOAD, "email": "not-an-email"},
    )

    assert response.status_code == 422


def test_login_with_correct_credentials_returns_access_token(client):
    client.post(
        "/api/auth/register",
        json={**VALID_REGISTRATION_PAYLOAD, "email": "driver@example.com", "password": "correct-horse1"},
    )

    response = client.post(
        "/api/auth/login",
        json={"email": "driver@example.com", "password": "correct-horse1"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str) and len(body["access_token"]) > 0


def test_login_with_wrong_password_returns_401(client):
    client.post(
        "/api/auth/register",
        json={**VALID_REGISTRATION_PAYLOAD, "email": "driver2@example.com", "password": "correct-horse1"},
    )

    response = client.post(
        "/api/auth/login",
        json={"email": "driver2@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_login_with_unknown_email_returns_401(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "ghost@example.com", "password": "anything"},
    )

    assert response.status_code == 401


# --- Phase 4: extended registration fields --------------------------------
#
# These were written test-first, before the User model/schema/service were
# extended with the new profile fields (first_name, last_name,
# mobile_number, address, city, state, country, postal_code,
# terms_accepted). Required-vs-optional and validation rules per
# conversation: first_name/last_name/mobile_number/terms_accepted are
# required; address/city/state/country/postal_code are optional;
# mobile_number must be 10-15 digits (optional leading +); password must be
# at least 8 characters with at least one letter and one digit.


def test_register_with_full_profile_returns_201_and_persists_new_fields(client):
    payload = {
        **VALID_REGISTRATION_PAYLOAD,
        "address": "221B Baker Street",
        "city": "London",
        "state": "Greater London",
        "country": "UK",
        "postal_code": "NW16XE",
    }

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["first_name"] == "Jane"
    assert body["last_name"] == "Doe"
    assert body["mobile_number"] == "9876543210"
    assert body["address"] == "221B Baker Street"
    assert body["city"] == "London"
    assert body["state"] == "Greater London"
    assert body["country"] == "UK"
    assert body["postal_code"] == "NW16XE"


def test_register_without_optional_location_fields_still_succeeds(client):
    response = client.post("/api/auth/register", json=VALID_REGISTRATION_PAYLOAD)

    assert response.status_code == 201
    body = response.json()
    assert body["first_name"] == "Jane"
    assert body["address"] is None
    assert body["city"] is None
    assert body["state"] is None
    assert body["country"] is None
    assert body["postal_code"] is None


def test_register_missing_first_name_returns_422(client):
    payload = {k: v for k, v in VALID_REGISTRATION_PAYLOAD.items() if k != "first_name"}

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 422


def test_register_missing_last_name_returns_422(client):
    payload = {k: v for k, v in VALID_REGISTRATION_PAYLOAD.items() if k != "last_name"}

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 422


def test_register_missing_mobile_number_returns_422(client):
    payload = {k: v for k, v in VALID_REGISTRATION_PAYLOAD.items() if k != "mobile_number"}

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 422


def test_register_with_invalid_mobile_number_format_returns_422(client):
    payload = {**VALID_REGISTRATION_PAYLOAD, "mobile_number": "not-a-number"}

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 422


def test_register_with_too_short_mobile_number_returns_422(client):
    payload = {**VALID_REGISTRATION_PAYLOAD, "mobile_number": "12345"}

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 422


def test_register_with_weak_password_returns_422(client):
    payload = {**VALID_REGISTRATION_PAYLOAD, "password": "short1"}

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 422


def test_register_with_password_missing_a_digit_returns_422(client):
    payload = {**VALID_REGISTRATION_PAYLOAD, "password": "alllettersnodigits"}

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 422


def test_register_without_accepting_terms_returns_422(client):
    payload = {**VALID_REGISTRATION_PAYLOAD, "terms_accepted": False}

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 422
