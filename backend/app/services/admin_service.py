"""Business logic for admin user management - lets an existing admin
create and manage other admin accounts. Reuses UserRepository and the
same password hashing used by registration - no new data-access logic."""
import uuid

from app.auth.password import hash_password
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.utils.exceptions import AdminNotFoundError, CannotDeactivateSelfError, DuplicateEmailError


class AdminService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def list_admins(self) -> list[User]:
        return self.user_repository.list_by_role(UserRole.ADMIN)

    def create_admin(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        mobile_number: str,
        is_active: bool = True,
    ) -> User:
        if self.user_repository.get_by_email(email) is not None:
            raise DuplicateEmailError(f"Email '{email}' is already registered")
        admin = self.user_repository.create(
            email=email,
            hashed_password=hash_password(password),
            role=UserRole.ADMIN,
            first_name=first_name,
            last_name=last_name,
            mobile_number=mobile_number,
        )
        if not is_active:
            admin = self.user_repository.update(admin, is_active=False)
        return admin

    def _get_admin_or_raise(self, admin_id: uuid.UUID) -> User:
        user = self.user_repository.get_by_id(admin_id)
        if user is None or user.role != UserRole.ADMIN:
            raise AdminNotFoundError(f"Admin '{admin_id}' not found")
        return user

    def update_admin(self, admin_id: uuid.UUID, **fields) -> User:
        admin = self._get_admin_or_raise(admin_id)
        return self.user_repository.update(admin, **fields)

    def reset_password(self, admin_id: uuid.UUID, new_password: str) -> User:
        admin = self._get_admin_or_raise(admin_id)
        return self.user_repository.update(admin, hashed_password=hash_password(new_password))

    def set_status(self, admin_id: uuid.UUID, is_active: bool, current_user_id: uuid.UUID) -> User:
        if admin_id == current_user_id and not is_active:
            raise CannotDeactivateSelfError("Admins cannot deactivate their own account")
        admin = self._get_admin_or_raise(admin_id)
        return self.user_repository.update(admin, is_active=is_active)
