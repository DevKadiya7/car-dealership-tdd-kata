"""add user profile fields

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-22
"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("first_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("mobile_number", sa.String(), nullable=True))
    op.add_column("users", sa.Column("address", sa.String(), nullable=True))
    op.add_column("users", sa.Column("city", sa.String(), nullable=True))
    op.add_column("users", sa.Column("state", sa.String(), nullable=True))
    op.add_column("users", sa.Column("country", sa.String(), nullable=True))
    op.add_column("users", sa.Column("postal_code", sa.String(), nullable=True))
    op.add_column("users", sa.Column("terms_accepted", sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "terms_accepted")
    op.drop_column("users", "postal_code")
    op.drop_column("users", "country")
    op.drop_column("users", "state")
    op.drop_column("users", "city")
    op.drop_column("users", "address")
    op.drop_column("users", "mobile_number")
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
