"""Add multiple assignees for notes."""

from __future__ import annotations

from alembic import op

revision = "20260602_0004"
down_revision = "20260602_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS note_assignees (
            note_id UUID NOT NULL,
            assignee_id UUID NOT NULL,
            user_id UUID NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (note_id, assignee_id),
            CONSTRAINT fk_note_assignees_note_same_user
                FOREIGN KEY (note_id, user_id)
                REFERENCES notes (id, user_id)
                ON UPDATE RESTRICT
                ON DELETE RESTRICT,
            CONSTRAINT fk_note_assignees_assignee_same_user
                FOREIGN KEY (assignee_id, user_id)
                REFERENCES assignees (id, user_id)
                ON UPDATE RESTRICT
                ON DELETE RESTRICT
        );

        CREATE INDEX IF NOT EXISTS idx_note_assignees_assignee_id
            ON note_assignees (assignee_id);

        CREATE INDEX IF NOT EXISTS idx_note_assignees_user_id
            ON note_assignees (user_id);

        INSERT INTO note_assignees (note_id, assignee_id, user_id)
        SELECT id, main_assignee_id, user_id
        FROM notes
        WHERE deleted_at IS NULL
        ON CONFLICT DO NOTHING;
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS note_assignees;")
