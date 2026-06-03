"""Add persistent note comments."""

from __future__ import annotations

from alembic import op

revision = "20260602_0005"
down_revision = "20260602_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS note_comments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            note_id UUID NOT NULL,
            author_user_id UUID NOT NULL,
            content TEXT NOT NULL,
            kind TEXT NOT NULL DEFAULT 'COMMENT',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at TIMESTAMPTZ NULL,
            CONSTRAINT fk_note_comments_user
                FOREIGN KEY (user_id)
                REFERENCES users (id)
                ON UPDATE RESTRICT
                ON DELETE RESTRICT,
            CONSTRAINT fk_note_comments_author_user
                FOREIGN KEY (author_user_id)
                REFERENCES users (id)
                ON UPDATE RESTRICT
                ON DELETE RESTRICT,
            CONSTRAINT fk_note_comments_note_same_user
                FOREIGN KEY (note_id, user_id)
                REFERENCES notes (id, user_id)
                ON UPDATE RESTRICT
                ON DELETE RESTRICT,
            CONSTRAINT chk_note_comments_content_not_blank
                CHECK (btrim(content) <> ''),
            CONSTRAINT chk_note_comments_kind
                CHECK (kind IN ('COMMENT', 'TIMELINE_NOTE'))
        );

        CREATE INDEX IF NOT EXISTS idx_note_comments_user_note
            ON note_comments (user_id, note_id);

        CREATE INDEX IF NOT EXISTS idx_note_comments_created_at
            ON note_comments (created_at);

        DROP TRIGGER IF EXISTS trg_note_comments_set_updated_at ON note_comments;
        CREATE TRIGGER trg_note_comments_set_updated_at
        BEFORE UPDATE ON note_comments
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS note_comments;")
