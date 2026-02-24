"""Логин: phone + password → JWT с account_id (sub)."""

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_account_service, get_current_account_id
from app.api.dto.account import AccountRead
from app.api.dto.auth import LoginRequest, TokenResponse
from app.application.account.service import AccountService
from app.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=AccountRead)
async def get_me(
    account_id: int = Depends(get_current_account_id),
    service: AccountService = Depends(get_account_service),
):
    """Текущий аккаунт по JWT. 401 если не авторизован."""
    account = await service.get_by_id(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Аккаунт не найден")
    return AccountRead.model_validate(account)


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    service: AccountService = Depends(get_account_service),
):
    """Авторизация по телефону и паролю. Возвращает JWT с account_id в sub."""
    account = await service.get_by_phone(data.phone)
    if not account:
        raise HTTPException(status_code=401, detail="Неверный телефон или пароль")
    if account.password != data.password:
        raise HTTPException(status_code=401, detail="Неверный телефон или пароль")
    token = create_access_token(account.id)
    return TokenResponse(access_token=token)
