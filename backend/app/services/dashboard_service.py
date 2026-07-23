"""Business logic for admin dashboard analytics."""

from app.repositories.dashboard_repository import DashboardRepository


class DashboardService:
    def __init__(self, dashboard_repository: DashboardRepository):
        self.dashboard_repository = dashboard_repository

    def get_summary(self):
        return self.dashboard_repository.get_summary()

    def get_recent_purchases(self):
        return self.dashboard_repository.get_recent_purchases()

    def get_low_stock(self):
        return self.dashboard_repository.get_low_stock()

    def get_top_selling(self):
        return self.dashboard_repository.get_top_selling()

    def get_sales_by_category(self):
        return self.dashboard_repository.get_sales_by_category()

    def get_monthly_sales(self):
        return self.dashboard_repository.get_monthly_sales()

    def get_orders_by_status(self):
        return self.dashboard_repository.get_orders_by_status()

    def get_orders_by_payment_method(self):
        return self.dashboard_repository.get_orders_by_payment_method()
