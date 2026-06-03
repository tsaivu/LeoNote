from sqlalchemy import CheckConstraint, Index, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.base_model import Base
from app.shared.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("btrim(username) <> ''", name="chk_users_username_not_blank"),
        CheckConstraint("email IS NULL OR btrim(email) <> ''", name="chk_users_email_not_blank"),
        CheckConstraint("btrim(password_hash) <> ''", name="chk_users_password_hash_not_blank"),
        CheckConstraint("btrim(timezone) <> ''", name="chk_users_timezone_not_blank"),
        Index("uq_users_username_active", text("lower(username)"), unique=True, postgresql_where=text("deleted_at IS NULL")),
        Index(
            "uq_users_email_active",
            text("lower(email)"),
            unique=True,
            postgresql_where=text("deleted_at IS NULL AND email IS NOT NULL"),
        ),
    )

    username: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    display_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    timezone: Mapped[str] = mapped_column(Text, nullable=False, default="Asia/Ho_Chi_Minh")
