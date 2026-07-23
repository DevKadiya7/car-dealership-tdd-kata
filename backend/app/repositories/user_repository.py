"""Data-access layer for User. Keeping raw queries here means services
never touch SQLAlchemy directly, which makes them easy to unit test."""
import uuid
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.purchase import Purchase
from app.models.user import User, UserRole


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

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

    def update(self, user: User, **fields) -> User:
        for key, value in fields.items():
            if value is not None:
                setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def list_customers_with_stats(self) -> list[dict]:
        rows = (
            self.db.query(
                User,
                func.count(Purchase.id).label("total_purchases"),
                func.coalesce(func.sum(Purchase.total_price), Decimal("0.00")).label("total_spent"),
            )
            .outerjoin(Purchase, Purchase.user_id == User.id)
            .filter(User.role == UserRole.CUSTOMER)
            .group_by(User.id)
            .all()
        )
        return [{"user": row[0], "total_purchases": row[1], "total_spent": row[2]} for row in rows]

    def delete(self, user: User) -> None:
        self.db.delete(user)
        self.db.commit()
