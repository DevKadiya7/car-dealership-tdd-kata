"""add purchase unit_price

Revision ID: 0009
Revises: 0008
Create Date: 2026-07-28
"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("purchases", sa.Column("unit_price", sa.Numeric(10, 2), nullable=True))


def downgrade() -> None:
    op.drop_column("purchases", "unit_price")
