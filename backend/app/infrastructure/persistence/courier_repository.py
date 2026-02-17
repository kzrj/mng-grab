from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.courier.entity import Courier
from app.domain.courier.repository import ICourierRepository
from app.infrastructure.persistence.models import CourierModel


class CourierRepository(ICourierRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_entity(self, model: CourierModel) -> Courier:
        return Courier(
            id=model.id,
            phone=model.phone,
            description=model.description,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def get_by_id(self, id: int) -> Courier | None:
        result = await self._session.execute(select(CourierModel).where(CourierModel.id == id))
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Courier]:
        result = await self._session.execute(select(CourierModel).offset(skip).limit(limit))
        return [self._to_entity(m) for m in result.scalars().all()]

    async def add(self, courier: Courier) -> Courier:
        model = CourierModel(phone=courier.phone, description=courier.description)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def save(self, courier: Courier) -> Courier:
        result = await self._session.execute(select(CourierModel).where(CourierModel.id == courier.id))
        model = result.scalar_one()
        model.phone = courier.phone
        model.description = courier.description
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, courier: Courier) -> None:
        result = await self._session.execute(select(CourierModel).where(CourierModel.id == courier.id))
        model = result.scalar_one()
        await self._session.delete(model)
        await self._session.flush()
