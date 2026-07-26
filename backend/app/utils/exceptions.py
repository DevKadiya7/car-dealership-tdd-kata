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


class AdminNotFoundError(Exception):
    """Raised when an admin operation targets an admin ID that doesn't exist."""


class CannotDeactivateSelfError(Exception):
    """Raised when an admin tries to deactivate their own account."""


class InsufficientDownPaymentError(Exception):
    """Raised when a loan's down payment is below the required 30% minimum."""


class DownPaymentExceedsPriceError(Exception):
    """Raised when a loan's down payment is greater than the vehicle price."""


class LoanNotFoundError(Exception):
    """Raised when a loan operation targets a loan ID that doesn't exist."""


class VehicleNotOwnedError(Exception):
    """Raised when a customer tries to book service for a vehicle they
    have no purchase record for."""


class ServiceBookingNotFoundError(Exception):
    """Raised when a service booking operation targets an ID that doesn't exist."""
