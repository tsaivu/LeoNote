from pydantic import BaseModel, Field


class TagCreate(BaseModel):
    name: str = Field(min_length=1)


class TagUpdate(BaseModel):
    name: str = Field(min_length=1)


class TagResponse(BaseModel):
    id: str
    name: str
    slug: str
    deleted_at: str | None = None
