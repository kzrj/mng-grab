"""DI: создание репозиториев и сервисов для FastAPI Depends."""

from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.account.service import AccountService
from app.core.security import decode_access_token
from app.application.courier.service import CourierService
from app.application.customer.service import CustomerService
from app.application.order.service import OrderService
from app.application.review.service import ReviewService
from app.infrastructure.database import get_db
from app.infrastructure.persistence import (
    AccountRepository,
    CustomerRepository,
    CourierRepository,
    OrderRepository,
    ReviewRepository,
)


def get_account_repository(session: AsyncSession = Depends(get_db)) -> AccountRepository:
    return AccountRepository(session)


def get_customer_repository(session: AsyncSession = Depends(get_db)) -> CustomerRepository:
    return CustomerRepository(session)


def get_courier_repository(session: AsyncSession = Depends(get_db)) -> CourierRepository:
    return CourierRepository(session)


def get_account_service(repo: AccountRepository = Depends(get_account_repository)) -> AccountService:
    return AccountService(repo)


def get_order_repository(session: AsyncSession = Depends(get_db)) -> OrderRepository:
    return OrderRepository(session)


def get_review_repository(session: AsyncSession = Depends(get_db)) -> ReviewRepository:
    return ReviewRepository(session)


def get_customer_service(
    repo: CustomerRepository = Depends(get_customer_repository),
) -> CustomerService:
    return CustomerService(repo)


def get_courier_service(repo: CourierRepository = Depends(get_courier_repository)) -> CourierService:
    return CourierService(repo)


def get_order_service(repo: OrderRepository = Depends(get_order_repository)) -> OrderService:
    return OrderService(repo)


def get_review_service(repo: ReviewRepository = Depends(get_review_repository)) -> ReviewService:
    return ReviewService(repo)


# --- Авторизация: JWT → account_id, проверка ролей по БД ---


async def get_current_account_id(
    authorization: str | None = Header(None, alias="Authorization"),
) -> int:
    """Извлечь account_id из JWT (Bearer). 401 если нет/неверный токен."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Требуется авторизация")
    token = authorization[7:].strip()
    account_id = decode_access_token(token)
    if account_id is None:
        raise HTTPException(status_code=401, detail="Неверный или истёкший токен")
    return account_id


async def get_optional_account_id(
    authorization: str | None = Header(None, alias="Authorization"),
) -> int | None:
    """Извлечь account_id из JWT если заголовок передан. Иначе None (без 401)."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:].strip()
    return decode_access_token(token)


async def get_optional_courier_id(
    account_id: int | None = Depends(get_optional_account_id),
    repo: CourierRepository = Depends(get_courier_repository),
) -> int | None:
    """Если пользователь авторизован как курьер — вернуть courier_id, иначе None."""
    if account_id is None:
        return None
    courier = await repo.get_by_account_id(account_id)
    return courier.id if courier else None


async def get_current_customer_id(
    account_id: int = Depends(get_current_account_id),
    repo: CustomerRepository = Depends(get_customer_repository),
) -> int:
    """Текущий пользователь должен быть заказчиком (есть запись в customers). 403 иначе."""
    customer = await repo.get_by_account_id(account_id)
    if not customer:
        raise HTTPException(
            status_code=403,
            detail="Доступ только для заказчика",
        )
    return customer.id


async def get_current_courier_id(
    account_id: int = Depends(get_current_account_id),
    repo: CourierRepository = Depends(get_courier_repository),
) -> int:
    """Текущий пользователь должен быть курьером. 403 иначе."""
    courier = await repo.get_by_account_id(account_id)
    if not courier:
        raise HTTPException(
            status_code=403,
            detail="Доступ только для курьера",
        )
    return courier.id
