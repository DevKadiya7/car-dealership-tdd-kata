"""Admin dashboard endpoints for analytics."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.database import get_db
from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import (
    DashboardSummary,
    MonthlySalesOut,
    OrdersByPaymentMethodOut,
    OrdersByStatusOut,
    RecentPurchaseOut,
    SalesByCategoryOut,
    TopSellingVehicleOut,
)
from app.schemas.vehicle import VehicleOut
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(DashboardRepository(db))


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user=Depends(require_admin),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    return dashboard_service.get_summary()


@router.get("/recent-purchases", response_model=list[RecentPurchaseOut])
def get_recent_purchases(
    current_user=Depends(require_admin),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    return dashboard_service.get_recent_purchases()


@router.get("/low-stock", response_model=list[VehicleOut])
def get_low_stock(
    current_user=Depends(require_admin),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    return dashboard_service.get_low_stock()


@router.get("/top-selling", response_model=list[TopSellingVehicleOut])
def get_top_selling(
    current_user=Depends(require_admin),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    return dashboard_service.get_top_selling()


@router.get("/sales-by-category", response_model=list[SalesByCategoryOut])
def get_sales_by_category(
    current_user=Depends(require_admin),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    return dashboard_service.get_sales_by_category()


@router.get("/monthly-sales", response_model=list[MonthlySalesOut])
def get_monthly_sales(
    current_user=Depends(require_admin),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    return dashboard_service.get_monthly_sales()


@router.get("/orders-by-status", response_model=list[OrdersByStatusOut])
def get_orders_by_status(
    current_user=Depends(require_admin),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    return dashboard_service.get_orders_by_status()


@router.get("/orders-by-payment-method", response_model=list[OrdersByPaymentMethodOut])
def get_orders_by_payment_method(
    current_user=Depends(require_admin),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    return dashboard_service.get_orders_by_payment_method()
