"""Business logic for admin customer management. Reuses UserRepository -
no new data-access logic, just admin-facing orchestration on top of it."""
import uuid

from app.repositories.user_repository import UserRepository
from app.utils.exceptions import CustomerNotFoundError


class CustomerService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def list_customers(self):
        return self.user_repository.list_customers_with_stats()

    def _get_customer_or_raise(self, customer_id: uuid.UUID):
        user = self.user_repository.get_by_id(customer_id)
        if user is None:
            raise CustomerNotFoundError(f"Customer '{customer_id}' not found")
        return user

    def set_status(self, customer_id: uuid.UUID, is_active: bool):
        user = self._get_customer_or_raise(customer_id)
        return self.user_repository.update(user, is_active=is_active)

    def delete_customer(self, customer_id: uuid.UUID) -> None:
        user = self._get_customer_or_raise(customer_id)
        self.user_repository.delete(user)
