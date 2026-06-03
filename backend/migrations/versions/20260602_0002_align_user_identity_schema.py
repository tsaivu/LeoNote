"""Align user identity schema with username-based auth."""

from __future__ import annotations

from alembic import op

revision = "20260602_0002"
down_revision = "20260602_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

        CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_active
        ON users (lower(username))
        WHERE deleted_at IS NULL;

        CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_active
        ON users (lower(email))
        WHERE deleted_at IS NULL AND email IS NOT NULL;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP INDEX IF EXISTS uq_users_email_active;
        DROP INDEX IF EXISTS uq_users_username_active;
        """
    )
