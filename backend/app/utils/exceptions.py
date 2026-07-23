"""Domain-specific exceptions raised by the service layer.

Routers translate these into the appropriate HTTP status codes, keeping
HTTP concerns out of the business logic itself.
"""


class DuplicateEmailError(Exception):
    """Raised when registering with an email that's already taken."""


class InvalidCredentialsError(Exception):
    """Raised when login email/password don't match a user."""


class VehicleNotFoundError(Exception):
    """Raised when a vehicle ID doesn't exist."""


class InsufficientStockError(Exception):
    """Raised when trying to purchase more units than are in stock."""


class CustomerNotFoundError(Exception):
    """Raised when an admin operation targets a customer ID that doesn't exist."""
