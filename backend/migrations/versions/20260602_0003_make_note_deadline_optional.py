"""Make note deadline optional."""

from __future__ import annotations

from alembic import op

revision = "20260602_0003"
down_revision = "20260602_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE notes ALTER COLUMN deadline_at DROP NOT NULL;")


def downgrade() -> None:
    op.execute(
        """
        UPDATE notes
        SET deadline_at = now()
        WHERE deadline_at IS NULL;

        ALTER TABLE notes ALTER COLUMN deadline_at SET NOT NULL;
        """
    )
