from datetime import datetime

from app.domain.account.entity import Account
from app.domain.account.repository import IAccountRepository


class AccountService:
    def __init__(self, repository: IAccountRepository):
        self._repo = repository

    async def create(self, name: str, phone: str, password: str) -> Account:
        if not name or not name.strip():
            raise ValueError("Имя обязательно")
        if not phone or not phone.strip():
            raise ValueError("Телефон обязателен")
        if not password:
            raise ValueError("Пароль обязателен")
        existing = await self._repo.get_by_phone(phone.strip())
        if existing:
            raise ValueError("Аккаунт с таким телефоном уже существует")
        account = Account(
            id=0,
            name=name.strip(),
            phone=phone.strip(),
            password=password,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        return await self._repo.add(account)

    async def get_by_id(self, id: int) -> Account | None:
        return await self._repo.get_by_id(id)

    async def get_by_phone(self, phone: str) -> Account | None:
        return await self._repo.get_by_phone(phone)

    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Account]:
        return await self._repo.get_all(skip=skip, limit=limit)

    async def update(
        self, id: int, name: str | None = None, phone: str | None = None, password: str | None = None
    ) -> Account | None:
        account = await self._repo.get_by_id(id)
        if not account:
            return None
        if phone is not None and phone.strip() != account.phone:
            existing = await self._repo.get_by_phone(phone.strip())
            if existing:
                raise ValueError("Аккаунт с таким телефоном уже существует")
        account.update(name=name, phone=phone, password=password)
        return await self._repo.save(account)

    async def delete(self, id: int) -> bool:
        account = await self._repo.get_by_id(id)
        if not account:
            return False
        await self._repo.delete(account)
        return True
