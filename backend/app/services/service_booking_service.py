"""Business logic for vehicle service bookings."""
import uuid
from datetime import date

from app.repositories.purchase_repository import PurchaseRepository
from app.repositories.service_booking_repository import ServiceBookingRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.utils.exceptions import (
    ServiceBookingNotFoundError,
    VehicleNotFoundError,
    VehicleNotOwnedError,
)


class ServiceBookingService:
    def __init__(
        self,
        booking_repository: ServiceBookingRepository,
        vehicle_repository: VehicleRepository,
        purchase_repository: PurchaseRepository,
    ):
        self.booking_repository = booking_repository
        self.vehicle_repository = vehicle_repository
        self.purchase_repository = purchase_repository

    def create_booking(
        self,
        customer_id: uuid.UUID,
        vehicle_id: uuid.UUID,
        service_type: str,
        preferred_date: date,
        notes: str | None,
    ) -> dict:
        vehicle = self.vehicle_repository.get_by_id(vehicle_id)
        if vehicle is None:
            raise VehicleNotFoundError(f"Vehicle '{vehicle_id}' not found")

        if not self.purchase_repository.exists_for_customer_and_vehicle(customer_id, vehicle_id):
            raise VehicleNotOwnedError(
                "You can only book service for a vehicle you've purchased"
            )

        booking = self.booking_repository.create(
            customer_id=customer_id,
            vehicle_id=vehicle_id,
            service_type=service_type,
            preferred_date=preferred_date,
            notes=notes,
        )
        return self.booking_repository.serialize(booking)

    def list_customer_bookings(self, customer_id: uuid.UUID) -> list[dict]:
        return self.booking_repository.list_by_customer(customer_id)

    def list_all_bookings(self) -> list[dict]:
        return self.booking_repository.list_all()

    def set_status(self, booking_id: uuid.UUID, new_status: str) -> dict:
        booking = self.booking_repository.get_by_id(booking_id)
        if booking is None:
            raise ServiceBookingNotFoundError(f"Service booking '{booking_id}' not found")
        updated = self.booking_repository.update_status(booking, new_status)
        return self.booking_repository.serialize(updated)
