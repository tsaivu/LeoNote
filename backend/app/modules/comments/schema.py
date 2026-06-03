from datetime import datetime

from pydantic import BaseModel, Field


class NoteCommentCreate(BaseModel):
    content: str = Field(min_length=1)
    kind: str = "COMMENT"


class NoteCommentResponse(BaseModel):
    id: str
    note_id: str
    author_user_id: str
    author_name: str
    content: str
    kind: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
