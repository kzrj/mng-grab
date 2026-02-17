from abc import ABC, abstractmethod

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
    async def add(self, order: Order) -> Order:
        ...

    @abstractmethod
    async def save(self, order: Order) -> Order:
        ...

    @abstractmethod
    async def delete(self, order: Order) -> None:
        ...
