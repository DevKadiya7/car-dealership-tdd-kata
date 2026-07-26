"""Business logic for vehicle loans. Reuses PurchaseService for the
underlying purchase record (stock check + decrement) instead of
duplicating that logic - a loan is a financed purchase, not a separate
inventory transaction."""
import uuid
from decimal import Decimal

from app.repositories.loan_repository import LoanRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.services.purchase_service import PurchaseService
from app.utils.exceptions import (
    DownPaymentExceedsPriceError,
    InsufficientDownPaymentError,
    LoanNotFoundError,
    VehicleNotFoundError,
)
from app.utils.loan import (
    ANNUAL_INTEREST_RATE,
    calculate_loan_amount,
    calculate_minimum_down_payment,
    calculate_monthly_emi,
    calculate_total_interest,
    calculate_total_payable,
)

INTEREST_RATE_PERCENT = ANNUAL_INTEREST_RATE * 100


class LoanService:
    def __init__(
        self,
        loan_repository: LoanRepository,
        vehicle_repository: VehicleRepository,
        purchase_service: PurchaseService,
    ):
        self.loan_repository = loan_repository
        self.vehicle_repository = vehicle_repository
        self.purchase_service = purchase_service

    def create_loan(
        self,
        customer_id: uuid.UUID,
        vehicle_id: uuid.UUID,
        down_payment: Decimal,
        duration_years: int,
    ) -> dict:
        vehicle = self.vehicle_repository.get_by_id(vehicle_id)
        if vehicle is None:
            raise VehicleNotFoundError(f"Vehicle '{vehicle_id}' not found")

        price = Decimal(vehicle.price)
        minimum_down_payment = calculate_minimum_down_payment(price)
        if down_payment < minimum_down_payment:
            raise InsufficientDownPaymentError(
                f"Down payment must be at least {minimum_down_payment} (30% of vehicle price)"
            )
        if down_payment > price:
            raise DownPaymentExceedsPriceError("Down payment cannot exceed the vehicle price")

        # Raises InsufficientStockError/VehicleNotFoundError if applicable,
        # decrements stock, and records the underlying Purchase.
        purchase = self.purchase_service.create_purchase(
            customer_id, vehicle_id, amount=1, payment_method="loan"
        )

        loan_amount = calculate_loan_amount(price, down_payment)
        monthly_emi = calculate_monthly_emi(loan_amount, ANNUAL_INTEREST_RATE, duration_years)
        total_interest = calculate_total_interest(monthly_emi, duration_years, loan_amount)
        total_payable = calculate_total_payable(down_payment, loan_amount, total_interest)

        loan = self.loan_repository.create(
            purchase_id=purchase.id,
            customer_id=customer_id,
            vehicle_id=vehicle_id,
            vehicle_price=price,
            down_payment=down_payment,
            loan_amount=loan_amount,
            interest_rate=INTEREST_RATE_PERCENT,
            duration_years=duration_years,
            monthly_emi=monthly_emi,
            total_interest=total_interest,
            total_payable=total_payable,
        )
        return self.loan_repository.serialize(loan)

    def list_customer_loans(self, customer_id: uuid.UUID) -> list[dict]:
        return self.loan_repository.list_by_customer(customer_id)

    def list_all_loans(self) -> list[dict]:
        return self.loan_repository.list_all()

    def set_status(self, loan_id: uuid.UUID, new_status: str) -> dict:
        loan = self.loan_repository.get_by_id(loan_id)
        if loan is None:
            raise LoanNotFoundError(f"Loan '{loan_id}' not found")
        updated = self.loan_repository.update_status(loan, new_status)
        return self.loan_repository.serialize(updated)
