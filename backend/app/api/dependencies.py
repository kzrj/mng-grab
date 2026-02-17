"""DI: создание репозиториев и сервисов для FastAPI Depends."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.courier.service import CourierService
from app.application.customer.service import CustomerService
from app.application.order.service import OrderService
from app.application.review.service import ReviewService
from app.infrastructure.database import get_db
from app.infrastructure.persistence import (
    CustomerRepository,
    CourierRepository,
    OrderRepository,
    ReviewRepository,
)


def get_customer_repository(session: AsyncSession = Depends(get_db)) -> CustomerRepository:
    return CustomerRepository(session)


def get_courier_repository(session: AsyncSession = Depends(get_db)) -> CourierRepository:
    return CourierRepository(session)


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
