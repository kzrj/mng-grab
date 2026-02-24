from abc import ABC, abstractmethod

from app.domain.account.entity import Account


class IAccountRepository(ABC):
    @abstractmethod
    async def get_by_id(self, id: int) -> Account | None:
        ...

    @abstractmethod
    async def get_by_phone(self, phone: str) -> Account | None:
        ...

    @abstractmethod
    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Account]:
        ...

    @abstractmethod
    async def add(self, account: Account) -> Account:
        ...

    @abstractmethod
    async def save(self, account: Account) -> Account:
        ...

    @abstractmethod
    async def delete(self, account: Account) -> None:
        ...
