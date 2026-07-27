"""Pure calculation functions for the vehicle loan feature (Phase 6).

Single source of truth for all loan math - services must call these
instead of re-deriving the formulas inline.
"""
from decimal import Decimal

from app.utils.money import round2

DOWN_PAYMENT_RATE = Decimal("0.30")
ANNUAL_INTEREST_RATE = Decimal("0.08")
ALLOWED_LOAN_DURATIONS = {1, 2, 3, 4, 5, 6, 7}


def calculate_minimum_down_payment(price: Decimal) -> Decimal:
    return round2(Decimal(price) * DOWN_PAYMENT_RATE)


def calculate_loan_amount(price: Decimal, down_payment: Decimal) -> Decimal:
    return round2(Decimal(price) - Decimal(down_payment))


def calculate_monthly_emi(principal: Decimal, annual_rate: Decimal, duration_years: int) -> Decimal:
    principal = Decimal(principal)
    if principal == 0:
        return Decimal("0.00")

    monthly_rate = float(annual_rate) / 12
    total_installments = duration_years * 12
    growth = (1 + monthly_rate) ** total_installments
    emi = float(principal) * monthly_rate * growth / (growth - 1)
    return round2(Decimal(str(emi)))


def calculate_total_interest(monthly_emi: Decimal, duration_years: int, principal: Decimal) -> Decimal:
    total_paid = Decimal(monthly_emi) * (duration_years * 12)
    return round2(total_paid - Decimal(principal))


def calculate_total_payable(down_payment: Decimal, principal: Decimal, total_interest: Decimal) -> Decimal:
    return round2(Decimal(down_payment) + Decimal(principal) + Decimal(total_interest))
