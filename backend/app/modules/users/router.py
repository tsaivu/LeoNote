from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.auth import service as auth_service
from app.modules.users import service
from app.modules.users.schema import CurrentUserResponse, UserPasswordUpdateRequest, UserProfileUpdateRequest
from app.shared.dependencies.auth import CurrentUser
from app.shared.dependencies.db import get_db

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=CurrentUserResponse)
def get_me(current_user: CurrentUser) -> CurrentUserResponse:
    user = auth_service.build_current_user_response(current_user)
    return CurrentUserResponse(**user.model_dump())


@router.put("/me", response_model=CurrentUserResponse)
def update_me(
    payload: UserProfileUpdateRequest,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> CurrentUserResponse:
    return service.update_current_user_profile(db, current_user, payload)


@router.put("/me/password")
def update_password(
    payload: UserPasswordUpdateRequest,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    return service.update_current_user_password(db, current_user, payload)
