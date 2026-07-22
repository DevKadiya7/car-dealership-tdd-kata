"""add vehicle image_url

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-22
"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("vehicles", sa.Column("image_url", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("vehicles", "image_url")
