from datetime import date, datetime

from app.domain.order.entity import Order
from app.domain.order.repository import IOrderRepository


class OrderService:
    """Application Service для заказов."""

    def __init__(self, repository: IOrderRepository):
        self._repo = repository

    async def create(
        self,
        where_to: str,
        where_from: str,
        price: float,
        date_when: date,
        customer_id: int,
        status: str = "new",
        courier_id: int | None = None,
    ) -> Order:
        if not where_to or not where_to.strip():
            raise ValueError("Адрес назначения обязателен")
        if not where_from or not where_from.strip():
            raise ValueError("Адрес отправления обязателен")
        if price < 0:
            raise ValueError("Цена не может быть отрицательной")
        order = Order(
            id=0,
            where_to=where_to.strip(),
            where_from=where_from.strip(),
            price=price,
            status=status,
            date_when=date_when,
            customer_id=customer_id,
            courier_id=courier_id,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        return await self._repo.add(order)

    async def get_by_id(self, id: int) -> Order | None:
        return await self._repo.get_by_id(id)

    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Order]:
        return await self._repo.get_all(skip=skip, limit=limit)

    async def update(
        self,
        id: int,
        where_to: str | None = None,
        where_from: str | None = None,
        price: float | None = None,
        status: str | None = None,
        date_when: date | None = None,
        courier_id: int | None = None,
    ) -> Order | None:
        order = await self._repo.get_by_id(id)
        if not order:
            return None
        order.update(
            where_to=where_to,
            where_from=where_from,
            price=price,
            status=status,
            date_when=date_when,
            courier_id=courier_id,
        )
        return await self._repo.save(order)

    async def delete(self, id: int) -> bool:
        order = await self._repo.get_by_id(id)
        if not order:
            return False
        await self._repo.delete(order)
        return True
