from fastapi import APIRouter

from app.modules.auth import service as auth_service
from app.modules.users.schema import CurrentUserResponse
from app.shared.dependencies.auth import CurrentUser

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=CurrentUserResponse)
def get_me(current_user: CurrentUser) -> CurrentUserResponse:
    user = auth_service.build_current_user_response(current_user)
    return CurrentUserResponse(**user.model_dump())
