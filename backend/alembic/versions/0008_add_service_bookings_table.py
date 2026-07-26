"""add service_bookings table

Revision ID: 0008
Revises: 0007
Create Date: 2026-07-26
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import CHAR, TypeDecorator

# revision identifiers, used by Alembic.
revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


class GUID(TypeDecorator):
    """Mirrors app.database.GUID so migrations and models agree on the
    column type: native UUID on Postgres, CHAR(36) elsewhere."""

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID())
        return dialect.type_descriptor(CHAR(36))


def upgrade() -> None:
    op.create_table(
        "service_bookings",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("customer_id", GUID(), nullable=False),
        sa.Column("vehicle_id", GUID(), nullable=False),
        sa.Column("service_type", sa.String(), nullable=False),
        sa.Column("preferred_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_service_bookings_customer_id"), "service_bookings", ["customer_id"], unique=False)
    op.create_index(op.f("ix_service_bookings_vehicle_id"), "service_bookings", ["vehicle_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_service_bookings_vehicle_id"), table_name="service_bookings")
    op.drop_index(op.f("ix_service_bookings_customer_id"), table_name="service_bookings")
    op.drop_table("service_bookings")
