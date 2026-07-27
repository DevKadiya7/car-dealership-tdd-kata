"""Shared rounding helper for money calculations across services
(loans, purchases) - single source of truth so every money figure in
the app rounds the same way."""
from decimal import ROUND_HALF_UP, Decimal


def round2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
