from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "AuthUserResponse"


class RefreshRequest(BaseModel):
    refresh_token: str | None = None


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


class RegisterResponse(BaseModel):
    id: str
    username: str
    display_name: str | None = None
    timezone: str


class AuthUserResponse(BaseModel):
    id: str
    username: str
    display_name: str | None = None
    timezone: str
