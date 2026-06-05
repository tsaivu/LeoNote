from pydantic import BaseModel, Field


class CurrentUserResponse(BaseModel):
    id: str
    username: str
    email: str | None = None
    display_name: str | None = None
    timezone: str


class UserProfileUpdateRequest(BaseModel):
    display_name: str | None = Field(default=None, max_length=120)
    email: str | None = Field(default=None, max_length=255)


class UserPasswordUpdateRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=6)


class UserRegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)
    display_name: str | None = None
    timezone: str = "Asia/Ho_Chi_Minh"
