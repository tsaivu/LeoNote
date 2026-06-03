from pydantic import BaseModel, Field


class CurrentUserResponse(BaseModel):
    id: str
    username: str
    display_name: str | None = None
    timezone: str


class UserRegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)
    display_name: str | None = None
    timezone: str = "Asia/Ho_Chi_Minh"
