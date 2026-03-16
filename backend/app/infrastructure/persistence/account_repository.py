import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.account.entity import Account
from app.domain.account.repository import IAccountRepository
from app.infrastructure.persistence.models import AccountModel

logger = logging.getLogger(__name__)


class AccountRepository(IAccountRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_entity(self, model: AccountModel) -> Account:
        return Account(
            id=model.id,
            name=model.name,
            phone=model.phone,
            password=model.password,
            balance=float(model.balance),
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def get_by_id(self, id: int) -> Account | None:
        result = await self._session.execute(select(AccountModel).where(AccountModel.id == id))
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_phone(self, phone: str) -> Account | None:
        result = await self._session.execute(select(AccountModel).where(AccountModel.phone == phone))
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Account]:
        result = await self._session.execute(select(AccountModel).offset(skip).limit(limit))
        return [self._to_entity(m) for m in result.scalars().all()]

    async def add(self, account: Account) -> Account:
        model = AccountModel(
            name=account.name,
            phone=account.phone,
            password=account.password,
            balance=account.balance,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def save(self, account: Account) -> Account:
        logger.info("AccountRepository.save: account_id=%s balance=%s", account.id, account.balance)
        result = await self._session.execute(select(AccountModel).where(AccountModel.id == account.id))
        model = result.scalar_one()
        model.name = account.name
        model.phone = account.phone
        model.password = account.password
        model.balance = account.balance
        await self._session.flush()
        logger.info("AccountRepository.save: flush выполнен account_id=%s", account.id)
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, account: Account) -> None:
        result = await self._session.execute(select(AccountModel).where(AccountModel.id == account.id))
        model = result.scalar_one()
        await self._session.delete(model)
        await self._session.flush()
