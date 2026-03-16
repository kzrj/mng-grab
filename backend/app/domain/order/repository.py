from abc import ABC, abstractmethod
from datetime import date

from app.domain.order.entity import Order


class IOrderRepository(ABC):
    """Интерфейс репозитория заказов."""

    @abstractmethod
    async def get_by_id(self, id: int) -> Order | None:
        ...

    @abstractmethod
    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Order]:
        ...

    @abstractmethod
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
        ...

    @abstractmethod
    async def add(self, order: Order) -> Order:
        ...

    @abstractmethod
    async def save(self, order: Order) -> Order:
        ...

    @abstractmethod
    async def delete(self, order: Order) -> None:
        ...
