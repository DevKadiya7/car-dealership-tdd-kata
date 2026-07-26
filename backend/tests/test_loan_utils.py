"""Tests for app/utils/loan.py - pure calculation functions for the vehicle
loan feature (Phase 6). Written test-first: the module doesn't exist yet.

Worked example used throughout (matches the spec):
    Vehicle price       ₹10,00,000
    Minimum down payment ₹3,00,000 (30%)
    Maximum loan         ₹7,00,000
    Annual interest      8% flat, reducing-balance EMI
"""
from decimal import Decimal

import pytest

from app.utils.loan import (
    ALLOWED_LOAN_DURATIONS,
    ANNUAL_INTEREST_RATE,
    DOWN_PAYMENT_RATE,
    calculate_loan_amount,
    calculate_minimum_down_payment,
    calculate_monthly_emi,
    calculate_total_interest,
    calculate_total_payable,
)


def test_constants_match_business_rules():
    assert DOWN_PAYMENT_RATE == Decimal("0.30")
    assert ANNUAL_INTEREST_RATE == Decimal("0.08")
    assert ALLOWED_LOAN_DURATIONS == {1, 2, 3, 4, 5, 6, 7}


def test_calculate_minimum_down_payment_is_30_percent_of_price():
    assert calculate_minimum_down_payment(Decimal("1000000")) == Decimal("300000.00")


def test_calculate_minimum_down_payment_rounds_to_2_decimals():
    assert calculate_minimum_down_payment(Decimal("999999")) == Decimal("299999.70")


def test_calculate_loan_amount_is_price_minus_down_payment():
    assert calculate_loan_amount(Decimal("1000000"), Decimal("300000")) == Decimal("700000.00")


def test_calculate_loan_amount_is_zero_when_down_payment_equals_price():
    assert calculate_loan_amount(Decimal("1000000"), Decimal("1000000")) == Decimal("0.00")


@pytest.mark.parametrize(
    "years,expected_emi",
    [
        (1, Decimal("60891.90")),
        (5, Decimal("14193.48")),
        (7, Decimal("10910.35")),
    ],
)
def test_calculate_monthly_emi_reducing_balance_formula(years, expected_emi):
    emi = calculate_monthly_emi(Decimal("700000"), ANNUAL_INTEREST_RATE, years)
    assert emi == expected_emi


def test_calculate_monthly_emi_zero_principal_is_zero():
    assert calculate_monthly_emi(Decimal("0"), ANNUAL_INTEREST_RATE, 5) == Decimal("0.00")


@pytest.mark.parametrize(
    "years,expected_interest,expected_total",
    [
        (1, Decimal("30702.80"), Decimal("730702.80")),
        (5, Decimal("151608.80"), Decimal("851608.80")),
        (7, Decimal("216469.40"), Decimal("916469.40")),
    ],
)
def test_calculate_total_interest_and_total_paid(years, expected_interest, expected_total):
    emi = calculate_monthly_emi(Decimal("700000"), ANNUAL_INTEREST_RATE, years)
    interest = calculate_total_interest(emi, years, Decimal("700000"))
    assert interest == expected_interest
    assert (emi * (years * 12)) == expected_total


def test_calculate_total_payable_adds_down_payment_principal_and_interest():
    down_payment = Decimal("300000")
    principal = Decimal("700000")
    emi = calculate_monthly_emi(principal, ANNUAL_INTEREST_RATE, 5)
    interest = calculate_total_interest(emi, 5, principal)

    total_payable = calculate_total_payable(down_payment, principal, interest)

    assert total_payable == down_payment + principal + interest
