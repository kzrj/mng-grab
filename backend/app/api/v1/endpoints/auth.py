"""Логин и регистрация: phone + password → JWT с account_id (sub)."""

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import (
    get_account_service,
    get_courier_service,
    get_current_account_id,
    get_customer_service,
)
from app.api.dto.account import AccountRead
from app.api.dto.auth import LoginRequest, RegisterRequest, TokenResponse
from app.application.account.service import AccountService
from app.application.courier.service import CourierService
from app.application.customer.service import CustomerService
from app.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=AccountRead)
async def get_me(
    account_id: int = Depends(get_current_account_id),
    service: AccountService = Depends(get_account_service),
    customer_service: CustomerService = Depends(get_customer_service),
    courier_service: CourierService = Depends(get_courier_service),
):
    """Текущий аккаунт по JWT. 401 если не авторизован. Роль по наличию в customers/couriers."""
    account = await service.get_by_id(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Аккаунт не найден")
    customer = await customer_service.get_by_account_id(account_id)
    courier = await courier_service.get_by_account_id(account_id)
    role: str = "customer" if customer else "courier" if courier else "customer"
    customer_id = customer.id if customer else None
    courier_id = courier.id if courier else None
    data = AccountRead.model_validate(account)
    return AccountRead(**{**data.model_dump(), "role": role, "customer_id": customer_id, "courier_id": courier_id})


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


@router.post("/register", response_model=TokenResponse)
async def register(
    data: RegisterRequest,
    account_service: AccountService = Depends(get_account_service),
    customer_service: CustomerService = Depends(get_customer_service),
    courier_service: CourierService = Depends(get_courier_service),
):
    """Регистрация: имя, телефон, пароль, роль (заказчик/курьер). Создаёт account и запись customer или courier. Возвращает JWT."""
    try:
        account = await account_service.create(
            name=data.name.strip(),
            phone=data.phone.strip(),
            password=data.password,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    phone = data.phone.strip()
    if data.role == "customer":
        await customer_service.create(phone=phone, account_id=account.id)
    else:
        await courier_service.create(phone=phone, account_id=account.id)

    token = create_access_token(account.id)
    return TokenResponse(access_token=token)
