"""Эндпоинт для заполнения и очистки БД тестовыми данными."""

from fastapi import APIRouter, Depends

from app.api.dependencies import (
    get_account_service,
    get_courier_service,
    get_customer_service,
    get_order_service,
    get_review_service,
)
from app.application.account.service import AccountService
from app.application.courier.service import CourierService
from app.application.customer.service import CustomerService
from app.application.order.service import OrderService
from app.application.review.service import ReviewService
from app.data.seed_data import ACCOUNTS, COURIERS, CUSTOMERS

router = APIRouter(prefix="/seed", tags=["seed"])


@router.get("/fill")
async def fill_test_data(
    account_service: AccountService = Depends(get_account_service),
    customer_service: CustomerService = Depends(get_customer_service),
    courier_service: CourierService = Depends(get_courier_service),
):
    """Заполнить БД тестовыми данными: аккаунты, 5 кастомеров, 5 курьеров."""
    created_accounts = []
    for item in ACCOUNTS:
        acc = await account_service.create(
            name=item["name"],
            phone=item["phone"],
            password=item["password"],
        )
        created_accounts.append(acc)

    created_customers = []
    for item in CUSTOMERS:
        account_id = created_accounts[item["account_index"]].id
        customer = await customer_service.create(
            phone=item["phone"],
            description=item.get("description"),
            account_id=account_id,
        )
        created_customers.append(customer)

    created_couriers = []
    for item in COURIERS:
        account_id = created_accounts[item["account_index"]].id
        courier = await courier_service.create(
            phone=item["phone"],
            description=item.get("description"),
            account_id=account_id,
        )
        created_couriers.append(courier)

    return {
        "message": "Тестовые данные добавлены",
        "accounts": len(created_accounts),
        "customers": len(created_customers),
        "couriers": len(created_couriers),
    }


@router.delete("/clear")
async def clear_all_data(
    account_service: AccountService = Depends(get_account_service),
    customer_service: CustomerService = Depends(get_customer_service),
    courier_service: CourierService = Depends(get_courier_service),
    order_service: OrderService = Depends(get_order_service),
    review_service: ReviewService = Depends(get_review_service),
):
    """Удалить все данные: отзывы, заказы, заказчиков, курьеров, аккаунты (порядок из-за FK)."""
    reviews = await review_service.get_all(skip=0, limit=10_000)
    orders = await order_service.get_all(skip=0, limit=10_000)
    customers = await customer_service.get_all(skip=0, limit=10_000)
    couriers = await courier_service.get_all(skip=0, limit=10_000)
    accounts = await account_service.get_all(skip=0, limit=10_000)

    for r in reviews:
        await review_service.delete(r.id)
    for o in orders:
        await order_service.delete(o.id)
    for c in customers:
        await customer_service.delete(c.id)
    for c in couriers:
        await courier_service.delete(c.id)
    for a in accounts:
        await account_service.delete(a.id)

    return {
        "message": "Все данные удалены",
        "reviews": len(reviews),
        "orders": len(orders),
        "customers": len(customers),
        "couriers": len(couriers),
        "accounts": len(accounts),
    }
