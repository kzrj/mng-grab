"""Эндпоинт для заполнения БД тестовыми данными."""

from fastapi import APIRouter, Depends

from app.api.dependencies import get_courier_service, get_customer_service
from app.application.courier.service import CourierService
from app.application.customer.service import CustomerService
from app.data.seed_data import COURIERS, CUSTOMERS

router = APIRouter(prefix="/seed", tags=["seed"])


@router.get("/fill")
async def fill_test_data(
    customer_service: CustomerService = Depends(get_customer_service),
    courier_service: CourierService = Depends(get_courier_service),
):
    """Заполнить БД тестовыми данными: 5 кастомеров, 5 курьеров."""
    created_customers = []
    created_couriers = []

    for item in CUSTOMERS:
        customer = await customer_service.create(
            phone=item["phone"],
            description=item.get("description"),
        )
        created_customers.append(customer)

    for item in COURIERS:
        courier = await courier_service.create(
            phone=item["phone"],
            description=item.get("description"),
        )
        created_couriers.append(courier)

    return {
        "message": "Тестовые данные добавлены",
        "customers": len(created_customers),
        "couriers": len(created_couriers),
    }
