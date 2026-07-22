"""Data access layer for purchases."""
import uuid

from sqlalchemy.orm import Session

from app.models.purchase import Purchase


class PurchaseRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: uuid.UUID, vehicle_id: uuid.UUID, quantity: int, total_price):
        purchase = Purchase(
            user_id=user_id,
            vehicle_id=vehicle_id,
            quantity=quantity,
            total_price=total_price,
        )
        self.db.add(purchase)
        self.db.commit()
        self.db.refresh(purchase)
        return purchase

    def list_by_user(self, user_id: uuid.UUID):
        return self.db.query(Purchase).filter(Purchase.user_id == user_id).all()

    def list_all(self):
        return self.db.query(Purchase).all()
