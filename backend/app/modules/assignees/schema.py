from pydantic import BaseModel, Field


class AssigneeCreate(BaseModel):
    name: str = Field(min_length=1)
    phone: str | None = None
    email: str | None = None
    note: str | None = None


class AssigneeUpdate(BaseModel):
    name: str = Field(min_length=1)
    phone: str | None = None
    email: str | None = None
    note: str | None = None


class AssigneeResponse(BaseModel):
    id: str
    name: str
    phone: str | None = None
    email: str | None = None
    note: str | None = None
    is_active: bool
    deleted_at: str | None = None
