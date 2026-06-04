from datetime import datetime

from pydantic import BaseModel, Field


class EntityRef(BaseModel):
    id: str
    name: str
    is_active: bool | None = None


class TagRef(BaseModel):
    id: str
    name: str
    slug: str


class SubtaskPayload(BaseModel):
    id: str | None = None
    title: str = Field(min_length=1)
    content: str | None = None
    assignee_id: str
    priority: str = "MEDIUM"
    deadline_at: datetime | None = None
    status: str = "TODO"
    sort_order: int = 0


class NotePayload(BaseModel):
    title: str = Field(min_length=1)
    content: str | None = None
    folder_id: str | None = None
    main_assignee_id: str
    assignee_ids: list[str] = Field(default_factory=list)
    status: str = "TODO"
    priority: str = "MEDIUM"
    progress_percent: int = Field(default=0, ge=0, le=100)
    deadline_at: datetime | None = None
    tag_ids: list[str] = Field(default_factory=list)
    subtasks: list[SubtaskPayload] = Field(default_factory=list)


class SubtaskResponse(BaseModel):
    id: str
    title: str
    content: str | None = None
    assignee: EntityRef
    priority: str
    deadline_at: datetime | None = None
    status: str
    sort_order: int
    completed_at: datetime | None = None


class NoteResponse(BaseModel):
    id: str
    title: str
    content: str | None = None
    folder: EntityRef
    main_assignee: EntityRef
    assignees: list[EntityRef] = Field(default_factory=list)
    status: str
    priority: str
    progress_percent: int
    deadline_at: datetime | None = None
    completed_at: datetime | None = None
    tags: list[TagRef] = Field(default_factory=list)
    subtasks: list[SubtaskResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
