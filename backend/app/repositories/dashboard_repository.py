"""Repository layer for admin dashboard analytics."""
from sqlalchemy import func

from app.models.purchase import Purchase
from app.models.user import User
from app.models.vehicle import Vehicle


class DashboardRepository:
    def __init__(self, db):
        self.db = db

    def get_summary(self):
        total_users = self.db.query(func.count(User.id)).scalar()
        total_vehicles = self.db.query(func.count(Vehicle.id)).scalar()
        total_stock = self.db.query(func.coalesce(func.sum(Vehicle.quantity), 0)).scalar()
        total_purchases = self.db.query(func.count(Purchase.id)).scalar()
        total_revenue = self.db.query(func.coalesce(func.sum(Purchase.total_price), 0)).scalar()

        return {
            "total_users": total_users,
            "total_vehicles": total_vehicles,
            "total_stock": total_stock,
            "total_purchases": total_purchases,
            "total_revenue": total_revenue,
        }

    def get_recent_purchases(self):
        return (
            self.db.query(Purchase)
            .order_by(Purchase.purchased_at.desc())
            .limit(10)
            .all()
        )

    def get_low_stock(self):
        return (
            self.db.query(Vehicle)
            .filter(Vehicle.quantity <= 5)
            .order_by(Vehicle.quantity.asc())
            .all()
        )

    def get_top_selling(self):
        return (
            self.db.query(
                Vehicle,
                func.sum(Purchase.quantity).label("total_sold"),
                func.sum(Purchase.total_price).label("total_revenue"),
            )
            .join(Purchase, Purchase.vehicle_id == Vehicle.id)
            .group_by(Vehicle.id)
            .order_by(func.sum(Purchase.total_price).desc())
            .all()
        )
