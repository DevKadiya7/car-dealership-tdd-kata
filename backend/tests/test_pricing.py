"""Tests for the shared 'Today Only 10% OFF' promotional pricing helper.

Single source of truth for discount + GST math, reused by
PurchaseService and LoanService instead of each re-deriving it.
"""
from decimal import Decimal

from app.utils.pricing import (
    DISCOUNT_RATE,
    GST_RATE,
    calculate_discount_amount,
    calculate_discounted_price,
    calculate_gst,
    calculate_grand_total,
)


def test_rates_match_business_rules():
    assert DISCOUNT_RATE == Decimal("0.10")
    assert GST_RATE == Decimal("0.18")


def test_calculate_discount_amount_is_10_percent_of_price():
    assert calculate_discount_amount("20000.00") == Decimal("2000.00")


def test_calculate_discounted_price_is_price_minus_discount():
    assert calculate_discounted_price("20000.00") == Decimal("18000.00")


def test_calculate_gst_is_18_percent_of_amount():
    assert calculate_gst("18000.00") == Decimal("3240.00")


def test_calculate_grand_total_is_amount_plus_gst():
    assert calculate_grand_total("18000.00") == Decimal("21240.00")
