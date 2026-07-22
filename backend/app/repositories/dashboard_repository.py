"""Repository layer for admin dashboard analytics."""
from collections import defaultdict
from decimal import Decimal
from sqlalchemy import func

from app.models.purchase import Purchase
from app.models.user import User
from app.models.vehicle import Vehicle


class DashboardRepository:
    def __init__(self, db):
        self.db = db

    def get_summary(self):
        total_users = self.db.query(func.count(User.id)).scalar() or 0
        total_vehicles = self.db.query(func.count(Vehicle.id)).scalar() or 0
        total_stock = self.db.query(func.coalesce(func.sum(Vehicle.quantity), 0)).scalar() or 0
        total_purchases = self.db.query(func.count(Purchase.id)).scalar() or 0
        total_revenue = self.db.query(func.coalesce(func.sum(Purchase.total_price), Decimal("0.00"))).scalar() or Decimal("0.00")

        return {
            "total_users": total_users,
            "total_vehicles": total_vehicles,
            "total_stock": total_stock,
            "total_purchases": total_purchases,
            "total_revenue": total_revenue,
        }

    def get_recent_purchases(self):
        purchases = (
            self.db.query(Purchase)
            .order_by(Purchase.purchased_at.desc())
            .limit(10)
            .all()
        )

        return [
            {
                "id": purchase.id,
                "vehicle": purchase.vehicle,
                "buyer_email": purchase.user.email,
                "quantity": purchase.quantity,
                "price": purchase.total_price,
                "purchase_date": purchase.purchased_at,
            }
            for purchase in purchases
        ]

    def get_low_stock(self):
        return (
            self.db.query(Vehicle)
            .filter(Vehicle.quantity <= 5)
            .order_by(Vehicle.quantity.asc())
            .all()
        )

    def get_top_selling(self):
        rows = (
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

        return [
            {
                "vehicle": row[0],
                "total_sold": int(row[1]),
                "total_revenue": row[2],
            }
            for row in rows
        ]

    def get_sales_by_category(self):
        rows = (
            self.db.query(
                Vehicle.category,
                func.sum(Purchase.quantity).label("units_sold"),
                func.sum(Purchase.total_price).label("total_revenue"),
            )
            .join(Purchase, Purchase.vehicle_id == Vehicle.id)
            .group_by(Vehicle.category)
            .all()
        )

        return [
            {
                "category": row[0],
                "units_sold": int(row[1]),
                "total_revenue": row[2],
            }
            for row in rows
        ]

    def get_monthly_sales(self):
        purchases = self.db.query(Purchase).all()
        grouped = defaultdict(lambda: {"units_sold": 0, "total_revenue": Decimal("0.00")})

        for purchase in purchases:
            month = purchase.purchased_at.strftime("%Y-%m")
            grouped[month]["units_sold"] += purchase.quantity
            grouped[month]["total_revenue"] += purchase.total_price

        return [
            {
                "month": month,
                "total_purchases": stats["units_sold"],
                "total_revenue": stats["total_revenue"],
            }
            for month, stats in sorted(grouped.items())
        ]
