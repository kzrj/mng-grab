from abc import ABC, abstractmethod

from app.domain.courier.entity import Courier


class ICourierRepository(ABC):
    """Интерфейс репозитория курьеров."""

    @abstractmethod
    async def get_by_id(self, id: int) -> Courier | None:
        ...

    @abstractmethod
    async def get_by_account_id(self, account_id: int) -> Courier | None:
        ...

    @abstractmethod
    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Courier]:
        ...

    @abstractmethod
    async def add(self, courier: Courier) -> Courier:
        ...

    @abstractmethod
    async def save(self, courier: Courier) -> Courier:
        ...

    @abstractmethod
    async def delete(self, courier: Courier) -> None:
        ...
