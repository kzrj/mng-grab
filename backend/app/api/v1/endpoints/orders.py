import logging

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import (
    get_current_customer_id,
    get_customer_service,
    get_current_courier_id,
    get_optional_courier_id,
    get_order_service,
)
from app.application.customer.service import CustomerService
from app.application.order.service import OrderService
from app.api.dto.order import OrderCreate, OrderRead, OrderUpdate
from app.constants import ORDER_CREATION_PRICE

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderRead])
async def list_orders(
    service: OrderService = Depends(get_order_service),
    skip: int = 0,
    limit: int = 100,
):
    entities = await service.get_all(skip=skip, limit=limit)
    return [OrderRead.model_validate(e) for e in entities]


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(order_id: int, service: OrderService = Depends(get_order_service)):
    entity = await service.get_by_id(order_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderRead.model_validate(entity)


@router.post("", response_model=OrderRead, status_code=201)
async def create_order(
    data: OrderCreate,
    customer_id: int = Depends(get_current_customer_id),
    order_service: OrderService = Depends(get_order_service),
    customer_service: CustomerService = Depends(get_customer_service),
):
    """Создать заказ. Только заказчик; списание с баланса. 400 при недостатке средств."""
    customer = await customer_service.get_by_id(customer_id)
    if not customer or not customer.account_id:
        logger.warning("create_order: у заказчика нет account_id customer_id=%s", customer_id)
        raise HTTPException(status_code=403, detail="У заказчика нет привязанного аккаунта")
    logger.info("create_order: customer_id=%s account_id=%s deduction=%s", customer_id, customer.account_id, ORDER_CREATION_PRICE)
    try:
        entity = await order_service.create_with_balance_deduction(
            account_id=customer.account_id,
            where_to=data.where_to,
            where_from=data.where_from,
            date_when=data.date_when,
            customer_id=customer_id,
            deduction_amount=ORDER_CREATION_PRICE,
            status=data.status,
            courier_id=None,
        )
        return OrderRead.model_validate(entity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{order_id}", response_model=OrderRead)
async def update_order(
    order_id: int,
    data: OrderUpdate,
    service: OrderService = Depends(get_order_service),
    current_courier_id: int | None = Depends(get_optional_courier_id),
):
    """Обновить заказ. Назначить курьера (courier_id) может только курьер, и только себя."""
    courier_id = data.courier_id
    if courier_id is not None:
        if current_courier_id is None:
            raise HTTPException(status_code=403, detail="Назначить курьера может только курьер")
        courier_id = current_courier_id  # курьер может назначить только себя
    entity = await service.update(
        order_id,
        where_to=data.where_to,
        where_from=data.where_from,
        price=data.price,
        status=data.status,
        date_when=data.date_when,
        courier_id=courier_id,
    )
    if not entity:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        return OrderRead.model_validate(entity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/accept", response_model=OrderRead)
async def accept_order(
    order_id: int,
    service: OrderService = Depends(get_order_service),
    courier_id: int = Depends(get_current_courier_id),
):
    """Курьер принимает заказ: можно только курьеру и только если у заказа ещё нет курьера."""
    order = await service.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.courier_id is not None:
        raise HTTPException(status_code=400, detail="Order already has courier")
    entity = await service.update(order_id, courier_id=courier_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderRead.model_validate(entity)


@router.post("/{order_id}/unassign-courier", response_model=OrderRead)
async def unassign_courier(
    order_id: int,
    service: OrderService = Depends(get_order_service),
    current_customer_id: int = Depends(get_current_customer_id),
):
    """Заказчик убирает курьера со своего заказа. Только владелец заказа, только если курьер назначен."""
    order = await service.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.customer_id != current_customer_id:
        raise HTTPException(status_code=403, detail="Not your order")
    if order.courier_id is None:
        raise HTTPException(status_code=400, detail="Order has no courier")
    entity = await service.unassign_courier(order_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderRead.model_validate(entity)


@router.delete("/{order_id}", status_code=204)
async def delete_order(order_id: int, service: OrderService = Depends(get_order_service)):
    deleted = await service.delete(order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Order not found")
