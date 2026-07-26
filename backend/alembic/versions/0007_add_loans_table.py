"""add loans table

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-26
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import CHAR, TypeDecorator

# revision identifiers, used by Alembic.
revision = "0007"
down_revision = "0006"
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
        "loans",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("purchase_id", GUID(), nullable=False),
        sa.Column("customer_id", GUID(), nullable=False),
        sa.Column("vehicle_id", GUID(), nullable=False),
        sa.Column("vehicle_price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("down_payment", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("loan_amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("interest_rate", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("duration_years", sa.Integer(), nullable=False),
        sa.Column("monthly_emi", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("total_interest", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("total_payable", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["purchase_id"], ["purchases.id"]),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_loans_purchase_id"), "loans", ["purchase_id"], unique=False)
    op.create_index(op.f("ix_loans_customer_id"), "loans", ["customer_id"], unique=False)
    op.create_index(op.f("ix_loans_vehicle_id"), "loans", ["vehicle_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_loans_vehicle_id"), table_name="loans")
    op.drop_index(op.f("ix_loans_customer_id"), table_name="loans")
    op.drop_index(op.f("ix_loans_purchase_id"), table_name="loans")
    op.drop_table("loans")
