from pydantic import BaseModel


class SubtaskPatch(BaseModel):
    title: str | None = None
    assignee_id: str | None = None
    status: str | None = None
    sort_order: int | None = None
