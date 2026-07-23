"""Business logic for vehicle inventory management."""
import uuid
from decimal import Decimal

from app.repositories.vehicle_repository import VehicleRepository
from app.utils.exceptions import InsufficientStockError, VehicleNotFoundError


class VehicleService:
    def __init__(self, vehicle_repository: VehicleRepository):
        self.vehicle_repository = vehicle_repository

    def create_vehicle(self, **fields):
        return self.vehicle_repository.create(**fields)

    def list_vehicles(self):
        return self.vehicle_repository.list_all()

    def get_vehicle(self, vehicle_id: uuid.UUID):
        vehicle = self.vehicle_repository.get_by_id(vehicle_id)
        if vehicle is None:
            raise VehicleNotFoundError(f"Vehicle '{vehicle_id}' not found")
        return vehicle

    def search_vehicles(
        self,
        make: str | None = None,
        model: str | None = None,
        category: str | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
    ):
        return self.vehicle_repository.search(make, model, category, min_price, max_price)

    def update_vehicle(self, vehicle_id: uuid.UUID, **fields):
        vehicle = self.get_vehicle(vehicle_id)
        return self.vehicle_repository.update(vehicle, **fields)

    def delete_vehicle(self, vehicle_id: uuid.UUID) -> None:
        vehicle = self.get_vehicle(vehicle_id)
        self.vehicle_repository.delete(vehicle)

    def purchase_vehicle(self, vehicle_id: uuid.UUID, amount: int = 1):
        vehicle = self.get_vehicle(vehicle_id)
        if vehicle.quantity < amount:
            raise InsufficientStockError(
                f"Only {vehicle.quantity} unit(s) of vehicle '{vehicle_id}' left in stock"
            )
        return self.vehicle_repository.update(vehicle, quantity=vehicle.quantity - amount)

    def restock_vehicle(self, vehicle_id: uuid.UUID, amount: int = 1):
        vehicle = self.get_vehicle(vehicle_id)
        return self.vehicle_repository.update(vehicle, quantity=vehicle.quantity + amount)
