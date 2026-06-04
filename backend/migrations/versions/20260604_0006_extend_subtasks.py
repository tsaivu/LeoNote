"""Extend subtasks with description, priority, and deadline."""

from __future__ import annotations

from alembic import op

revision = "20260604_0006"
down_revision = "20260602_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE subtasks
            ADD COLUMN IF NOT EXISTS content TEXT NULL,
            ADD COLUMN IF NOT EXISTS priority note_priority_enum NOT NULL DEFAULT 'MEDIUM',
            ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMPTZ NULL;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE subtasks
            DROP COLUMN IF EXISTS deadline_at,
            DROP COLUMN IF EXISTS priority,
            DROP COLUMN IF EXISTS content;
        """
    )
