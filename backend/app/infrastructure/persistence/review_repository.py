from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.review.entity import Review
from app.domain.review.repository import IReviewRepository
from app.infrastructure.persistence.models import ReviewModel


class ReviewRepository(IReviewRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_entity(self, model: ReviewModel) -> Review:
        return Review(
            id=model.id,
            customer_id=model.customer_id,
            courier_id=model.courier_id,
            score=model.score,
            text=model.text,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def get_by_id(self, id: int) -> Review | None:
        result = await self._session.execute(select(ReviewModel).where(ReviewModel.id == id))
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Review]:
        result = await self._session.execute(select(ReviewModel).offset(skip).limit(limit))
        return [self._to_entity(m) for m in result.scalars().all()]

    async def add(self, review: Review) -> Review:
        model = ReviewModel(
            customer_id=review.customer_id,
            courier_id=review.courier_id,
            score=review.score,
            text=review.text,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def save(self, review: Review) -> Review:
        result = await self._session.execute(select(ReviewModel).where(ReviewModel.id == review.id))
        model = result.scalar_one()
        model.score = review.score
        model.text = review.text
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, review: Review) -> None:
        result = await self._session.execute(select(ReviewModel).where(ReviewModel.id == review.id))
        model = result.scalar_one()
        await self._session.delete(model)
        await self._session.flush()
