"""add purchase payment_method and status

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-23
"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("purchases", sa.Column("payment_method", sa.String(), nullable=True))
    op.add_column(
        "purchases",
        sa.Column("status", sa.String(), nullable=False, server_default="completed"),
    )


def downgrade() -> None:
    op.drop_column("purchases", "status")
    op.drop_column("purchases", "payment_method")
