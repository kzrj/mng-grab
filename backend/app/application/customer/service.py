from datetime import datetime

from app.domain.customer.entity import Customer
from app.domain.customer.repository import ICustomerRepository


class CustomerService:
    """Application Service — оркестрирует Use Cases для заказчика."""

    def __init__(self, repository: ICustomerRepository):
        self._repo = repository

    async def create(
        self, phone: str, description: str | None = None, account_id: int | None = None
    ) -> Customer:
        """Создать заказчика."""
        if not phone or not phone.strip():
            raise ValueError("Телефон обязателен")
        customer = Customer(
            id=0,
            phone=phone.strip(),
            description=description,
            account_id=account_id,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        return await self._repo.add(customer)

    async def get_by_id(self, id: int) -> Customer | None:
        return await self._repo.get_by_id(id)

    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Customer]:
        return await self._repo.get_all(skip=skip, limit=limit)

    async def update(
        self,
        id: int,
        phone: str | None = None,
        description: str | None = None,
        account_id: int | None = None,
    ) -> Customer | None:
        customer = await self._repo.get_by_id(id)
        if not customer:
            return None
        customer.update(phone=phone, description=description)
        if account_id is not None:
            customer.account_id = account_id
        return await self._repo.save(customer)

    async def delete(self, id: int) -> bool:
        customer = await self._repo.get_by_id(id)
        if not customer:
            return False
        await self._repo.delete(customer)
        return True
