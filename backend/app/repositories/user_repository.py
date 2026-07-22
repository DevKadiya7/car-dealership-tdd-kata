"""Data-access layer for User. Keeping raw queries here means services
never touch SQLAlchemy directly, which makes them easy to unit test."""
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def create(
        self,
        email: str,
        hashed_password: str,
        role,
        first_name: str | None = None,
        last_name: str | None = None,
        mobile_number: str | None = None,
        address: str | None = None,
        city: str | None = None,
        state: str | None = None,
        country: str | None = None,
        postal_code: str | None = None,
        terms_accepted: bool | None = None,
    ) -> User:
        user = User(
            email=email,
            hashed_password=hashed_password,
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
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
