from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import (
    get_current_customer_id,
    get_optional_courier_id,
    get_order_service,
)
from app.application.order.service import OrderService
from app.api.dto.order import OrderCreate, OrderRead, OrderUpdate

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
    service: OrderService = Depends(get_order_service),
):
    """Создать заказ. Только авторизованный заказчик; customer_id берётся из JWT."""
    try:
        entity = await service.create(
            where_to=data.where_to,
            where_from=data.where_from,
            price=data.price,
            date_when=data.date_when,
            customer_id=customer_id,
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


@router.delete("/{order_id}", status_code=204)
async def delete_order(order_id: int, service: OrderService = Depends(get_order_service)):
    deleted = await service.delete(order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Order not found")
