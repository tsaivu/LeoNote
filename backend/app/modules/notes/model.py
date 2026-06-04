import enum
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, ForeignKeyConstraint, Index, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.base_model import Base
from app.shared.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class NoteStatus(str, enum.Enum):
    TODO = "TODO"
    DOING = "DOING"
    PENDING = "PENDING"
    DONE = "DONE"


class NotePriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class SubtaskStatus(str, enum.Enum):
    TODO = "TODO"
    DONE = "DONE"


class Folder(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "folders"
    __table_args__ = (
        UniqueConstraint("id", "user_id", name="uq_folders_id_user"),
        CheckConstraint("btrim(name) <> ''", name="chk_folders_name_not_blank"),
        CheckConstraint("parent_id IS NULL OR parent_id <> id", name="chk_folders_not_self_parent"),
        CheckConstraint("is_system = FALSE OR lower(name) = 'inbox'", name="chk_folders_system_name"),
        ForeignKeyConstraint(
            ["parent_id", "user_id"],
            ["folders.id", "folders.user_id"],
            name="fk_folders_parent_same_user",
            onupdate="RESTRICT",
            ondelete="RESTRICT",
        ),
        Index("idx_folders_user_id", "user_id"),
        Index("idx_folders_parent_id", "parent_id"),
        Index(
            "uq_folders_user_parent_name_active",
            text("user_id"),
            text("COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid)"),
            text("lower(name)"),
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "uq_folders_user_single_inbox",
            "user_id",
            unique=True,
            postgresql_where=text("is_system = TRUE AND deleted_at IS NULL"),
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", name="fk_folders_user", onupdate="RESTRICT", ondelete="RESTRICT"),
        nullable=False,
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0)
    is_system: Mapped[bool] = mapped_column(nullable=False, default=False)


class Assignee(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "assignees"
    __table_args__ = (
        UniqueConstraint("id", "user_id", name="uq_assignees_id_user"),
        CheckConstraint("btrim(name) <> ''", name="chk_assignees_name_not_blank"),
        CheckConstraint("email IS NULL OR btrim(email) <> ''", name="chk_assignees_email_blank_or_value"),
        CheckConstraint("phone IS NULL OR btrim(phone) <> ''", name="chk_assignees_phone_blank_or_value"),
        Index("idx_assignees_user_id", "user_id"),
        Index("idx_assignees_user_active", "user_id", "is_active"),
        Index(
            "uq_assignees_user_name_active",
            "user_id",
            text("lower(name)"),
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", name="fk_assignees_user", onupdate="RESTRICT", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)


class Note(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "notes"
    __table_args__ = (
        UniqueConstraint("id", "user_id", name="uq_notes_id_user"),
        ForeignKeyConstraint(
            ["folder_id", "user_id"],
            ["folders.id", "folders.user_id"],
            name="fk_notes_folder_same_user",
            onupdate="RESTRICT",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["main_assignee_id", "user_id"],
            ["assignees.id", "assignees.user_id"],
            name="fk_notes_main_assignee_same_user",
            onupdate="RESTRICT",
            ondelete="RESTRICT",
        ),
        CheckConstraint("btrim(title) <> ''", name="chk_notes_title_not_blank"),
        CheckConstraint("search_text IS NOT NULL", name="chk_notes_search_text_not_null"),
        CheckConstraint("progress_percent >= 0 AND progress_percent <= 100", name="chk_notes_progress_percent_range"),
        CheckConstraint(
            "(status = 'DONE' AND completed_at IS NOT NULL) OR (status <> 'DONE' AND completed_at IS NULL)",
            name="chk_notes_completed_at_consistency",
        ),
        Index("idx_notes_user_id", "user_id"),
        Index("idx_notes_user_status", "user_id", "status"),
        Index("idx_notes_user_priority", "user_id", "priority"),
        Index("idx_notes_user_deadline", "user_id", "deadline_at"),
        Index("idx_notes_user_folder", "user_id", "folder_id"),
        Index("idx_notes_user_assignee", "user_id", "main_assignee_id"),
        Index("idx_notes_user_deleted", "user_id", "deleted_at"),
        Index("idx_notes_search_text", "user_id", "search_text"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", name="fk_notes_user", onupdate="RESTRICT", ondelete="RESTRICT"),
        nullable=False,
    )
    folder_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )
    main_assignee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[NoteStatus] = mapped_column(
        Enum(NoteStatus, name="note_status_enum", values_callable=lambda e: [item.value for item in e]),
        nullable=False,
        default=NoteStatus.TODO,
    )
    priority: Mapped[NotePriority] = mapped_column(
        Enum(NotePriority, name="note_priority_enum", values_callable=lambda e: [item.value for item in e]),
        nullable=False,
        default=NotePriority.MEDIUM,
    )
    progress_percent: Mapped[int] = mapped_column(nullable=False, default=0)
    deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    search_text: Mapped[str] = mapped_column(Text, nullable=False, default="")


class Tag(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "tags"
    __table_args__ = (
        UniqueConstraint("id", "user_id", name="uq_tags_id_user"),
        CheckConstraint("btrim(name) <> ''", name="chk_tags_name_not_blank"),
        CheckConstraint("btrim(slug) <> ''", name="chk_tags_slug_not_blank"),
        CheckConstraint("slug = lower(slug)", name="chk_tags_slug_normalized"),
        Index("idx_tags_user_id", "user_id"),
        Index("uq_tags_user_slug_active", "user_id", "slug", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", name="fk_tags_user", onupdate="RESTRICT", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(Text, nullable=False)


class NoteTag(Base):
    __tablename__ = "note_tags"
    __table_args__ = (
        ForeignKeyConstraint(
            ["note_id", "user_id"],
            ["notes.id", "notes.user_id"],
            name="fk_note_tags_note_same_user",
            onupdate="RESTRICT",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["tag_id", "user_id"],
            ["tags.id", "tags.user_id"],
            name="fk_note_tags_tag_same_user",
            onupdate="RESTRICT",
            ondelete="RESTRICT",
        ),
        Index("idx_note_tags_tag_id", "tag_id"),
        Index("idx_note_tags_user_id", "user_id"),
    )

    note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
    )
    tag_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class NoteAssignee(Base):
    __tablename__ = "note_assignees"
    __table_args__ = (
        ForeignKeyConstraint(
            ["note_id", "user_id"],
            ["notes.id", "notes.user_id"],
            name="fk_note_assignees_note_same_user",
            onupdate="RESTRICT",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["assignee_id", "user_id"],
            ["assignees.id", "assignees.user_id"],
            name="fk_note_assignees_assignee_same_user",
            onupdate="RESTRICT",
            ondelete="RESTRICT",
        ),
        Index("idx_note_assignees_assignee_id", "assignee_id"),
        Index("idx_note_assignees_user_id", "user_id"),
    )

    note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
    )
    assignee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class NoteComment(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "note_comments"
    __table_args__ = (
        ForeignKeyConstraint(
            ["note_id", "user_id"],
            ["notes.id", "notes.user_id"],
            name="fk_note_comments_note_same_user",
            onupdate="RESTRICT",
            ondelete="RESTRICT",
        ),
        CheckConstraint("btrim(content) <> ''", name="chk_note_comments_content_not_blank"),
        CheckConstraint("kind IN ('COMMENT', 'TIMELINE_NOTE')", name="chk_note_comments_kind"),
        Index("idx_note_comments_user_note", "user_id", "note_id"),
        Index("idx_note_comments_created_at", "created_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", name="fk_note_comments_user", onupdate="RESTRICT", ondelete="RESTRICT"),
        nullable=False,
    )
    note_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    author_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", name="fk_note_comments_author_user", onupdate="RESTRICT", ondelete="RESTRICT"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    kind: Mapped[str] = mapped_column(Text, nullable=False, default="COMMENT")


class Subtask(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "subtasks"
    __table_args__ = (
        UniqueConstraint("id", "user_id", name="uq_subtasks_id_user"),
        ForeignKeyConstraint(
            ["note_id", "user_id"],
            ["notes.id", "notes.user_id"],
            name="fk_subtasks_note_same_user",
            onupdate="RESTRICT",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["assignee_id", "user_id"],
            ["assignees.id", "assignees.user_id"],
            name="fk_subtasks_assignee_same_user",
            onupdate="RESTRICT",
            ondelete="RESTRICT",
        ),
        CheckConstraint("btrim(title) <> ''", name="chk_subtasks_title_not_blank"),
        CheckConstraint(
            "(status = 'DONE' AND completed_at IS NOT NULL) OR (status <> 'DONE' AND completed_at IS NULL)",
            name="chk_subtasks_completed_at_consistency",
        ),
        Index("idx_subtasks_user_id", "user_id"),
        Index("idx_subtasks_note_id", "note_id"),
        Index("idx_subtasks_user_note", "user_id", "note_id"),
        Index("idx_subtasks_user_assignee", "user_id", "assignee_id"),
        Index("idx_subtasks_user_status", "user_id", "status"),
        Index("idx_subtasks_user_deleted", "user_id", "deleted_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", name="fk_subtasks_user", onupdate="RESTRICT", ondelete="RESTRICT"),
        nullable=False,
    )
    note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )
    assignee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[NotePriority] = mapped_column(
        Enum(NotePriority, name="note_priority_enum", values_callable=lambda e: [item.value for item in e]),
        nullable=False,
        default=NotePriority.MEDIUM,
    )
    deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[SubtaskStatus] = mapped_column(
        Enum(SubtaskStatus, name="subtask_status_enum", values_callable=lambda e: [item.value for item in e]),
        nullable=False,
        default=SubtaskStatus.TODO,
    )
    sort_order: Mapped[int] = mapped_column(nullable=False, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
