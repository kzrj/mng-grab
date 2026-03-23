from datetime import date

from sqlalchemy import select, update, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.order.entity import Order
from app.domain.order.repository import IOrderRepository
from app.infrastructure.persistence.models import OrderModel, CustomerModel, AccountModel


class OrderRepository(IOrderRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_entity(self, model: OrderModel) -> Order:
        return Order(
            id=model.id,
            where_to=model.where_to,
            where_from=model.where_from,
            price=model.price,
            status=model.status,
            date_when=model.date_when,
            customer_id=model.customer_id,
            courier_id=model.courier_id,
            information=model.information,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def get_by_id(self, id: int) -> Order | None:
        result = await self._session.execute(select(OrderModel).where(OrderModel.id == id))
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Order]:
        result = await self._session.execute(select(OrderModel).offset(skip).limit(limit))
        return [self._to_entity(m) for m in result.scalars().all()]

    async def search(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        statuses: list[str] | None = None,
        customer_name: str | None = None,
        customer_id: int | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        place: str | None = None,
    ) -> list[Order]:
        stmt = (
            select(OrderModel)
            .join(CustomerModel, OrderModel.customer_id == CustomerModel.id)
            .join(AccountModel, CustomerModel.account_id == AccountModel.id, isouter=True)
        )
        if statuses is not None and len(statuses) > 0:
            stmt = stmt.where(OrderModel.status.in_(statuses))
        if customer_name:
            pattern_name = f"%{customer_name}%"
            stmt = stmt.where(AccountModel.name.ilike(pattern_name))
        if customer_id is not None:
            stmt = stmt.where(OrderModel.customer_id == customer_id)
        if date_from is not None:
            stmt = stmt.where(OrderModel.date_when >= date_from)
        if date_to is not None:
            stmt = stmt.where(OrderModel.date_when <= date_to)
        if place:
            pattern = f"%{place}%"
            stmt = stmt.where(
                or_(
                    OrderModel.where_from.ilike(pattern),
                    OrderModel.where_to.ilike(pattern),
                )
            )
        stmt = stmt.offset(skip).limit(limit)
        result = await self._session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def add(self, order: Order) -> Order:
        model = OrderModel(
            where_to=order.where_to,
            where_from=order.where_from,
            price=order.price,
            status=order.status,
            date_when=order.date_when,
            customer_id=order.customer_id,
            courier_id=order.courier_id,
            information=order.information,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def save(self, order: Order) -> Order:
        result = await self._session.execute(select(OrderModel).where(OrderModel.id == order.id))
        model = result.scalar_one()
        model.where_to = order.where_to
        model.where_from = order.where_from
        model.price = order.price
        model.status = order.status
        model.date_when = order.date_when
        model.courier_id = order.courier_id
        model.information = order.information
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, order: Order) -> None:
        result = await self._session.execute(select(OrderModel).where(OrderModel.id == order.id))
        model = result.scalar_one()
        await self._session.delete(model)
        await self._session.flush()

    async def bulk_set_status_where_not(self, new_status: str, exclude_status: str) -> int:
        """Один запрос: SET status = new_status WHERE status != exclude_status. Возвращает число обновлённых строк."""
        result = await self._session.execute(
            update(OrderModel).where(OrderModel.status != exclude_status).values(status=new_status)
        )
        return result.rowcount or 0
