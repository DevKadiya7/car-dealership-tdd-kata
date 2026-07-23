"""Business logic for registration and login. Kept free of HTTP and
SQLAlchemy-session-lifecycle concerns so it's easy to unit test."""
from app.auth.jwt_handler import create_access_token
from app.auth.password import hash_password, verify_password
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.utils.exceptions import DuplicateEmailError, InvalidCredentialsError


class AuthService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def register(
        self,
        email: str,
        password: str,
        first_name: str | None = None,
        last_name: str | None = None,
        mobile_number: str | None = None,
        address: str | None = None,
        city: str | None = None,
        state: str | None = None,
        country: str | None = None,
        postal_code: str | None = None,
        terms_accepted: bool | None = None,
        role: UserRole = UserRole.CUSTOMER,
    ):
        if self.user_repository.get_by_email(email) is not None:
            raise DuplicateEmailError(f"Email '{email}' is already registered")
        return self.user_repository.create(
            email=email,
            hashed_password=hash_password(password),
            role=role,
            first_name=first_name,
            last_name=last_name,
            mobile_number=mobile_number,
            address=address,
            city=city,
            state=state,
            country=country,
            postal_code=postal_code,
            terms_accepted=terms_accepted,
        )

    def login(self, email: str, password: str) -> str:
        user = self.user_repository.get_by_email(email)
        if user is None or not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError("Invalid email or password")
        return create_access_token(subject=str(user.id))

    def update_profile(self, user: User, **fields):
        return self.user_repository.update(user, **fields)

    def change_password(self, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.hashed_password):
            raise InvalidCredentialsError("Current password is incorrect")
        self.user_repository.update(user, hashed_password=hash_password(new_password))
