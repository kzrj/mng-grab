import logging
from datetime import date, datetime
from typing import TYPE_CHECKING

from app.domain.order.entity import Order
from app.domain.order.repository import IOrderRepository

if TYPE_CHECKING:
    from app.application.account.service import AccountService

logger = logging.getLogger(__name__)


class OrderService:
    """Application Service для заказов."""

    def __init__(self, repository: IOrderRepository, account_service: "AccountService | None" = None):
        self._repo = repository
        self._account_service = account_service

    async def create_with_balance_deduction(
        self,
        account_id: int,
        where_to: str,
        where_from: str,
        date_when: date,
        customer_id: int,
        deduction_amount: float,
        status: str = "new",
        courier_id: int | None = None,
    ) -> Order:
        """Создать заказ: списать deduction_amount с баланса, заказ сохраняем с price=0 (цену заказа не трогаем)."""
        logger.info("create_with_balance_deduction: account_id=%s customer_id=%s deduction_amount=%s", account_id, customer_id, deduction_amount)
        if not self._account_service:
            logger.error("create_with_balance_deduction: account_service не задан")
            raise ValueError("Сервис аккаунтов не задан для списания баланса")
        await self._account_service.deduct_balance(account_id, deduction_amount)
        logger.info("create_with_balance_deduction: списание выполнено, создаём заказ (price заказа=0)")
        order = await self.create(
            where_to=where_to,
            where_from=where_from,
            price=0.0,
            date_when=date_when,
            customer_id=customer_id,
            status=status,
            courier_id=courier_id,
        )
        logger.info("create_with_balance_deduction: заказ создан order_id=%s", order.id)
        return order

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

    async def search(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        status: str | None = None,
        customer_name: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        place: str | None = None,
    ) -> list[Order]:
        return await self._repo.search(
            skip=skip,
            limit=limit,
            status=status,
            customer_name=customer_name,
            date_from=date_from,
            date_to=date_to,
            place=place,
        )

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

    async def unassign_courier(self, id: int) -> Order | None:
        """Убрать курьера у заказа. Возвращает обновлённый заказ или None."""
        order = await self._repo.get_by_id(id)
        if not order:
            return None
        order.courier_id = None
        return await self._repo.save(order)

    async def delete(self, id: int) -> bool:
        order = await self._repo.get_by_id(id)
        if not order:
            return False
        await self._repo.delete(order)
        return True
