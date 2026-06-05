from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.auth import service
from app.modules.auth.schema import AuthUserResponse, LoginRequest, LoginResponse, LogoutRequest, RefreshRequest, RegisterResponse
from app.modules.users.schema import UserRegisterRequest
from app.shared.dependencies.auth import CurrentUser
from app.shared.dependencies.db import get_db

router = APIRouter(prefix="/auth", tags=["auth"])
REFRESH_TOKEN_COOKIE = "leonote_refresh_token"


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=refresh_token,
        max_age=settings.jwt_refresh_token_expire_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        domain=settings.cookie_domain or None,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE,
        secure=settings.cookie_secure,
        samesite="lax",
        domain=settings.cookie_domain or None,
    )


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> LoginResponse:
    session = service.login_user(db, username=payload.username, password=payload.password)
    _set_refresh_cookie(response, session.refresh_token)
    return session


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)) -> RegisterResponse:
    if not settings.allow_registration:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Registration is disabled")
    return service.register_user(
        db,
        username=payload.username,
        password=payload.password,
        display_name=payload.display_name,
        timezone=payload.timezone,
    )


@router.post("/refresh", response_model=LoginResponse)
def refresh(payload: RefreshRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> LoginResponse:
    raw_refresh_token = payload.refresh_token or request.cookies.get(REFRESH_TOKEN_COOKIE)
    session = service.refresh_access_token(db, raw_refresh_token=raw_refresh_token)
    _set_refresh_cookie(response, session.refresh_token)
    return session


@router.post("/logout")
def logout(payload: LogoutRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> dict[str, str]:
    raw_refresh_token = payload.refresh_token or request.cookies.get(REFRESH_TOKEN_COOKIE)
    service.logout_user(db, raw_refresh_token=raw_refresh_token)
    _clear_refresh_cookie(response)
    return {"status": "ok"}


@router.get("/me", response_model=AuthUserResponse)
def me(current_user: CurrentUser) -> AuthUserResponse:
    return service.build_current_user_response(current_user)
