"""Data access layer for purchases."""
import uuid

from sqlalchemy.orm import Session

from app.models.purchase import Purchase


class PurchaseRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        user_id: uuid.UUID,
        vehicle_id: uuid.UUID,
        quantity: int,
        total_price,
        payment_method: str | None = None,
    ):
        purchase = Purchase(
            user_id=user_id,
            vehicle_id=vehicle_id,
            quantity=quantity,
            total_price=total_price,
            payment_method=payment_method or "unknown",
        )
        self.db.add(purchase)
        self.db.commit()
        self.db.refresh(purchase)
        return purchase

    def _serialize(self, purchase: Purchase) -> dict:
        return {
            "id": purchase.id,
            "user_id": purchase.user_id,
            "vehicle_id": purchase.vehicle_id,
            "quantity": purchase.quantity,
            "total_price": purchase.total_price,
            "purchased_at": purchase.purchased_at,
            "payment_method": purchase.payment_method or "unknown",
            "status": purchase.status,
            "vehicle_make": purchase.vehicle.make,
            "vehicle_model": purchase.vehicle.model,
            "customer_email": purchase.user.email,
            "customer_name": " ".join(
                filter(None, [purchase.user.first_name, purchase.user.last_name])
            )
            or purchase.user.email,
        }

    def list_by_user(self, user_id: uuid.UUID):
        purchases = self.db.query(Purchase).filter(Purchase.user_id == user_id).all()
        return [self._serialize(purchase) for purchase in purchases]

    def list_all(self):
        purchases = self.db.query(Purchase).all()
        return [self._serialize(purchase) for purchase in purchases]
