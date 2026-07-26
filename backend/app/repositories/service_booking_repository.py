"""Data access layer for vehicle service bookings."""
import uuid

from sqlalchemy.orm import Session

from app.models.service_booking import ServiceBooking


class ServiceBookingRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **fields) -> ServiceBooking:
        booking = ServiceBooking(**fields)
        self.db.add(booking)
        self.db.commit()
        self.db.refresh(booking)
        return booking

    def get_by_id(self, booking_id: uuid.UUID) -> ServiceBooking | None:
        return self.db.query(ServiceBooking).filter(ServiceBooking.id == booking_id).first()

    def serialize(self, booking: ServiceBooking) -> dict:
        return {
            "id": booking.id,
            "customer_id": booking.customer_id,
            "vehicle_id": booking.vehicle_id,
            "service_type": booking.service_type,
            "preferred_date": booking.preferred_date,
            "notes": booking.notes,
            "status": booking.status,
            "created_at": booking.created_at,
            "vehicle_make": booking.vehicle.make,
            "vehicle_model": booking.vehicle.model,
            "customer_email": booking.customer.email,
            "customer_name": " ".join(
                filter(None, [booking.customer.first_name, booking.customer.last_name])
            )
            or booking.customer.email,
        }

    def list_by_customer(self, customer_id: uuid.UUID) -> list[dict]:
        bookings = self.db.query(ServiceBooking).filter(ServiceBooking.customer_id == customer_id).all()
        return [self.serialize(booking) for booking in bookings]

    def list_all(self) -> list[dict]:
        bookings = self.db.query(ServiceBooking).all()
        return [self.serialize(booking) for booking in bookings]

    def update_status(self, booking: ServiceBooking, new_status: str) -> ServiceBooking:
        booking.status = new_status
        self.db.commit()
        self.db.refresh(booking)
        return booking
