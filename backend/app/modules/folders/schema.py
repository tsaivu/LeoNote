from pydantic import BaseModel, Field


class FolderCreate(BaseModel):
    name: str = Field(min_length=1)
    parent_id: str | None = None
    sort_order: int = 0


class FolderUpdate(BaseModel):
    name: str = Field(min_length=1)
    parent_id: str | None = None
    sort_order: int = 0


class FolderResponse(BaseModel):
    id: str
    parent_id: str | None = None
    name: str
    sort_order: int
    is_system: bool
    deleted_at: str | None = None
