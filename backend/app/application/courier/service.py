from datetime import datetime

from app.domain.courier.entity import Courier
from app.domain.courier.repository import ICourierRepository


class CourierService:
    """Application Service для курьеров."""

    def __init__(self, repository: ICourierRepository):
        self._repo = repository

    async def create(
        self, phone: str, description: str | None = None, account_id: int | None = None
    ) -> Courier:
        if not phone or not phone.strip():
            raise ValueError("Телефон обязателен")
        courier = Courier(
            id=0,
            phone=phone.strip(),
            description=description,
            account_id=account_id,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        return await self._repo.add(courier)

    async def get_by_id(self, id: int) -> Courier | None:
        return await self._repo.get_by_id(id)

    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Courier]:
        return await self._repo.get_all(skip=skip, limit=limit)

    async def update(
        self,
        id: int,
        phone: str | None = None,
        description: str | None = None,
        account_id: int | None = None,
    ) -> Courier | None:
        courier = await self._repo.get_by_id(id)
        if not courier:
            return None
        courier.update(phone=phone, description=description)
        if account_id is not None:
            courier.account_id = account_id
        return await self._repo.save(courier)

    async def delete(self, id: int) -> bool:
        courier = await self._repo.get_by_id(id)
        if not courier:
            return False
        await self._repo.delete(courier)
        return True
