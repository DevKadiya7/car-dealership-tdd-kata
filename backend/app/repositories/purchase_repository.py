"""Data access layer for purchases."""
import uuid
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.purchase import Purchase
from app.utils.money import round2
from app.utils.pricing import calculate_gst, calculate_grand_total


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
        unit_price=None,
    ):
        purchase = Purchase(
            user_id=user_id,
            vehicle_id=vehicle_id,
            quantity=quantity,
            total_price=total_price,
            payment_method=payment_method or "unknown",
            unit_price=unit_price,
        )
        self.db.add(purchase)
        self.db.commit()
        self.db.refresh(purchase)
        return purchase

    def _serialize(self, purchase: Purchase) -> dict:
        # GST/grand_total are always derived from the stored total_price (what
        # was actually charged), not recomputed from live rates - so a future
        # rate change never silently rewrites a historical invoice.
        original_price = None
        discount_amount = None
        if purchase.unit_price is not None:
            original_price = round2(Decimal(purchase.unit_price) * purchase.quantity)
            discount_amount = round2(original_price - purchase.total_price)

        return {
            "id": purchase.id,
            "user_id": purchase.user_id,
            "vehicle_id": purchase.vehicle_id,
            "quantity": purchase.quantity,
            "unit_price": purchase.unit_price,
            "original_price": original_price,
            "discount_amount": discount_amount,
            "total_price": purchase.total_price,
            "gst": calculate_gst(purchase.total_price),
            "grand_total": calculate_grand_total(purchase.total_price),
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

    def exists_for_customer_and_vehicle(self, user_id: uuid.UUID, vehicle_id: uuid.UUID) -> bool:
        return (
            self.db.query(Purchase)
            .filter(Purchase.user_id == user_id, Purchase.vehicle_id == vehicle_id)
            .first()
            is not None
        )
