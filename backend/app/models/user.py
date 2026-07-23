"""User model: stores login credentials, profile data, and role for
authorization."""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, String, Enum as SAEnum

from app.database import Base, GUID


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    # values_callable forces SQLAlchemy to send the enum *values* ("customer",
    # "admin") to Postgres, not the member *names* ("CUSTOMER", "ADMIN") it
    # uses by default - the userrole enum type (see the initial migration)
    # was created with the lowercase values, and the API/frontend contract
    # is lowercase too.
    role = Column(
        SAEnum(UserRole, values_callable=lambda role_cls: [member.value for member in role_cls]),
        nullable=False,
        default=UserRole.CUSTOMER,
    )

    # Profile fields added in Phase 4. Columns are nullable at the DB level
    # (safe to add via migration on a non-empty table) even though
    # first_name/last_name/mobile_number/terms_accepted are required by the
    # registration API - that requirement is enforced in app/schemas/user.py.
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    mobile_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    terms_accepted = Column(Boolean, nullable=True)
    avatar_url = Column(String, nullable=True)

    # Admin customer-management fields, added in Phase 4.
    created_at = Column(DateTime(timezone=True), nullable=True, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, nullable=True, default=True)
