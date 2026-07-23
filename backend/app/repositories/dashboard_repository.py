"""Repository layer for admin dashboard analytics."""
import calendar
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
        total_customers = self.db.query(func.count(User.id)).scalar() or 0
        total_vehicles = self.db.query(func.count(Vehicle.id)).scalar() or 0
        total_stock = self.db.query(func.coalesce(func.sum(Vehicle.quantity), 0)).scalar() or 0
        total_sales = self.db.query(func.count(Purchase.id)).scalar() or 0
        total_revenue = self.db.query(func.coalesce(func.sum(Purchase.total_price), Decimal("0.00"))).scalar() or Decimal("0.00")
        low_stock_count = self.db.query(func.count(Vehicle.id)).filter(Vehicle.quantity <= 5).scalar() or 0

        return {
            "total_customers": total_customers,
            "total_vehicles": total_vehicles,
            "total_stock": total_stock,
            "total_sales": total_sales,
            "total_revenue": total_revenue,
            "low_stock_count": low_stock_count,
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
                "vehicle_id": purchase.vehicle.id,
                "vehicle_make": purchase.vehicle.make,
                "vehicle_model": purchase.vehicle.model,
                "customer_email": purchase.user.email,
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
                "vehicle_id": row[0].id,
                "make": row[0].make,
                "model": row[0].model,
                "units_sold": int(row[1]),
                "revenue": row[2],
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
                "revenue": row[2],
            }
            for row in rows
        ]

    def get_orders_by_status(self):
        rows = (
            self.db.query(Purchase.status, func.count(Purchase.id))
            .group_by(Purchase.status)
            .all()
        )
        return [{"status": status, "count": count} for status, count in rows]

    def get_orders_by_payment_method(self):
        rows = (
            self.db.query(Purchase.payment_method, func.count(Purchase.id))
            .group_by(Purchase.payment_method)
            .all()
        )
        return [
            {"payment_method": payment_method or "unknown", "count": count}
            for payment_method, count in rows
        ]

    def get_monthly_sales(self):
        purchases = self.db.query(Purchase).all()
        grouped = defaultdict(lambda: {"total_purchases": 0, "revenue": Decimal("0.00")})

        for purchase in purchases:
            month_index = purchase.purchased_at.month
            grouped[month_index]["total_purchases"] += purchase.quantity
            grouped[month_index]["revenue"] += purchase.total_price

        return [
            {
                "month": calendar.month_name[month_index],
                "revenue": grouped[month_index]["revenue"],
                "total_purchases": grouped[month_index]["total_purchases"],
            }
            for month_index in range(1, 13)
        ]
