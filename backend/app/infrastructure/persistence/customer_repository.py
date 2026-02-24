from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.customer.entity import Customer
from app.domain.customer.repository import ICustomerRepository
from app.infrastructure.persistence.models import CustomerModel


class CustomerRepository(ICustomerRepository):
    """Реализация репозитория заказчиков через SQLAlchemy."""

    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_entity(self, model: CustomerModel) -> Customer:
        return Customer(
            id=model.id,
            phone=model.phone,
            description=model.description,
            account_id=model.account_id,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def get_by_id(self, id: int) -> Customer | None:
        result = await self._session.execute(select(CustomerModel).where(CustomerModel.id == id))
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_account_id(self, account_id: int) -> Customer | None:
        result = await self._session.execute(
            select(CustomerModel).where(CustomerModel.account_id == account_id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Customer]:
        result = await self._session.execute(select(CustomerModel).offset(skip).limit(limit))
        return [self._to_entity(m) for m in result.scalars().all()]

    async def add(self, customer: Customer) -> Customer:
        model = CustomerModel(
            phone=customer.phone,
            description=customer.description,
            account_id=customer.account_id,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def save(self, customer: Customer) -> Customer:
        result = await self._session.execute(select(CustomerModel).where(CustomerModel.id == customer.id))
        model = result.scalar_one()
        model.phone = customer.phone
        model.description = customer.description
        model.account_id = customer.account_id
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, customer: Customer) -> None:
        result = await self._session.execute(select(CustomerModel).where(CustomerModel.id == customer.id))
        model = result.scalar_one()
        await self._session.delete(model)
        await self._session.flush()
