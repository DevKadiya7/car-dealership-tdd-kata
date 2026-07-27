"""Single source of truth for the 'Today Only 10% OFF' promotional
pricing: discount and GST math, shared by PurchaseService and
LoanService instead of each re-deriving it."""
from decimal import Decimal

from app.utils.money import round2

DISCOUNT_RATE = Decimal("0.10")
GST_RATE = Decimal("0.18")


def calculate_discount_amount(price) -> Decimal:
    return round2(Decimal(price) * DISCOUNT_RATE)


def calculate_discounted_price(price) -> Decimal:
    return round2(Decimal(price) - calculate_discount_amount(price))


def calculate_gst(amount) -> Decimal:
    return round2(Decimal(amount) * GST_RATE)


def calculate_grand_total(amount) -> Decimal:
    return round2(Decimal(amount) + calculate_gst(amount))
