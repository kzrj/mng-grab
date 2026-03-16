import logging
from datetime import datetime

from app.domain.account.entity import Account
from app.domain.account.repository import IAccountRepository

logger = logging.getLogger(__name__)


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
            balance=100.0,
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

    async def deduct_balance(self, account_id: int, amount: float) -> None:
        """Списать сумму с баланса. ValueError при недостатке средств."""
        logger.info("deduct_balance: account_id=%s amount=%s", account_id, amount)
        if amount < 0:
            raise ValueError("Сумма списания не может быть отрицательной")
        account = await self._repo.get_by_id(account_id)
        if not account:
            logger.warning("deduct_balance: аккаунт не найден account_id=%s", account_id)
            raise ValueError("Аккаунт не найден")
        logger.info("deduct_balance: баланс до списания account_id=%s balance=%s", account_id, account.balance)
        if account.balance < amount:
            logger.warning("deduct_balance: недостаточно средств account_id=%s balance=%s amount=%s", account_id, account.balance, amount)
            raise ValueError("Недостаточно средств")
        account.balance -= amount
        logger.info("deduct_balance: списываем, баланс после account_id=%s new_balance=%s", account_id, account.balance)
        await self._repo.save(account)
        logger.info("deduct_balance: save() выполнен account_id=%s", account_id)

    async def add_balance(self, account_id: int, amount: float) -> Account:
        """Пополнить баланс аккаунта на указанную сумму > 0 и вернуть обновлённый аккаунт."""
        logger.info("add_balance: account_id=%s amount=%s", account_id, amount)
        if amount <= 0:
            raise ValueError("Сумма пополнения должна быть больше нуля")
        account = await self._repo.get_by_id(account_id)
        if not account:
            logger.warning("add_balance: аккаунт не найден account_id=%s", account_id)
            raise ValueError("Аккаунт не найден")
        account.balance += amount
        logger.info("add_balance: новый баланс account_id=%s balance=%s", account_id, account.balance)
        return await self._repo.save(account)
