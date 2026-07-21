from fastapi.testclient import TestClient


def test_register_user(client: TestClient):
    response = client.post(
        "/auth/register",
        json={"email": "user@example.com", "full_name": "Test User", "password": "secret"},
    )
    assert response.status_code == 201
    assert response.json()["email"] == "user@example.com"


def test_login_user(client: TestClient):
    client.post(
        "/auth/register",
        json={"email": "user@example.com", "full_name": "Test User", "password": "secret"},
    )
    response = client.post(
        "/auth/login",
        json={"email": "user@example.com", "password": "secret"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
