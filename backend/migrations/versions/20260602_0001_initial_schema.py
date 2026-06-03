"""Initial LeoNote schema."""

from __future__ import annotations

from pathlib import Path

from alembic import op

revision = "20260602_0001"
down_revision = None
branch_labels = None
depends_on = None


def _read_sql() -> str:
    repo_root = Path(__file__).resolve().parents[3]
    schema_path = repo_root / "docs" / "sql" / "personal-notes-postgresql-schema.sql"
    return schema_path.read_text(encoding="utf-8")


def upgrade() -> None:
    op.execute(_read_sql())


def downgrade() -> None:
    op.execute(
        """
        DROP TABLE IF EXISTS note_tags;
        DROP TABLE IF EXISTS subtasks;
        DROP TABLE IF EXISTS notes;
        DROP TABLE IF EXISTS tags;
        DROP TABLE IF EXISTS folders;
        DROP TABLE IF EXISTS assignees;
        DROP TABLE IF EXISTS refresh_tokens;
        DROP TABLE IF EXISTS users;

        DROP FUNCTION IF EXISTS validate_note_tag_references();
        DROP FUNCTION IF EXISTS validate_subtask_references();
        DROP FUNCTION IF EXISTS validate_note_references();
        DROP FUNCTION IF EXISTS protect_system_folder_soft_delete();
        DROP FUNCTION IF EXISTS enforce_folder_parent_integrity();
        DROP FUNCTION IF EXISTS prevent_hard_delete_business_table();
        DROP FUNCTION IF EXISTS sync_completed_at_from_status();
        DROP FUNCTION IF EXISTS set_updated_at();

        DROP TYPE IF EXISTS note_priority_enum;
        DROP TYPE IF EXISTS subtask_status_enum;
        DROP TYPE IF EXISTS note_status_enum;
        """
    )
