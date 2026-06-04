"""add note progress percent

Revision ID: 20260604_0007
Revises: 20260604_0006
Create Date: 2026-06-04 23:30:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260604_0007"
down_revision = "20260604_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("notes", sa.Column("progress_percent", sa.Integer(), nullable=False, server_default="0"))
    op.create_check_constraint("chk_notes_progress_percent_range", "notes", "progress_percent >= 0 AND progress_percent <= 100")
    op.execute("UPDATE notes SET progress_percent = 100 WHERE status = 'DONE'")
    op.alter_column("notes", "progress_percent", server_default=None)


def downgrade() -> None:
    op.drop_constraint("chk_notes_progress_percent_range", "notes", type_="check")
    op.drop_column("notes", "progress_percent")
