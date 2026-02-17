from abc import ABC, abstractmethod

from app.domain.customer.entity import Customer


class ICustomerRepository(ABC):
    """Интерфейс репозитория заказчиков. Domain определяет контракт."""

    @abstractmethod
    async def get_by_id(self, id: int) -> Customer | None:
        ...

    @abstractmethod
    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Customer]:
        ...

    @abstractmethod
    async def add(self, customer: Customer) -> Customer:
        ...

    @abstractmethod
    async def save(self, customer: Customer) -> Customer:
        ...

    @abstractmethod
    async def delete(self, customer: Customer) -> None:
        ...
