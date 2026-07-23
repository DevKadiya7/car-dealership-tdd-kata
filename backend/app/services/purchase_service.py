"""Business logic for purchase history."""
from decimal import Decimal
import uuid

from app.repositories.purchase_repository import PurchaseRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.utils.exceptions import InsufficientStockError, VehicleNotFoundError


class PurchaseService:
    def __init__(self, purchase_repository: PurchaseRepository, vehicle_repository: VehicleRepository):
        self.purchase_repository = purchase_repository
        self.vehicle_repository = vehicle_repository

    def purchase_vehicle(
        self,
        user_id: uuid.UUID,
        vehicle_id: uuid.UUID,
        amount: int = 1,
        payment_method: str | None = None,
    ):
        vehicle = self.vehicle_repository.get_by_id(vehicle_id)
        if vehicle is None:
            raise VehicleNotFoundError(f"Vehicle '{vehicle_id}' not found")

        if vehicle.quantity < amount:
            raise InsufficientStockError(
                f"Only {vehicle.quantity} unit(s) of vehicle '{vehicle_id}' left in stock"
            )

        total_price = Decimal(vehicle.price) * amount
        vehicle.quantity -= amount
        self.vehicle_repository.update(vehicle, quantity=vehicle.quantity)

        self.purchase_repository.create(
            user_id=user_id,
            vehicle_id=vehicle_id,
            quantity=amount,
            total_price=total_price,
            payment_method=payment_method,
        )

        return vehicle

    def list_user_purchases(self, user_id: uuid.UUID):
        return self.purchase_repository.list_by_user(user_id)

    def list_all_purchases(self):
        return self.purchase_repository.list_all()
