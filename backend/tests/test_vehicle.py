from fastapi.testclient import TestClient


def test_create_vehicle(client: TestClient):
    response = client.post(
        "/vehicles/",
        json={
            "make": "Toyota",
            "model": "Corolla",
            "year": 2022,
            "price": 20000,
            "color": "Blue",
            "mileage": 12000,
        },
    )
    assert response.status_code == 201
    assert response.json()["make"] == "Toyota"


def test_list_vehicles(client: TestClient):
    client.post(
        "/vehicles/",
        json={
            "make": "Toyota",
            "model": "Corolla",
            "year": 2022,
            "price": 20000,
            "color": "Blue",
            "mileage": 12000,
        },
    )
    response = client.get("/vehicles/")
    assert response.status_code == 200
    assert len(response.json()) == 1
