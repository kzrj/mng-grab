from datetime import datetime

from app.domain.review.entity import Review
from app.domain.review.repository import IReviewRepository


class ReviewService:
    """Application Service для отзывов."""

    def __init__(self, repository: IReviewRepository):
        self._repo = repository

    async def create(self, customer_id: int, courier_id: int, score: int, text: str | None = None) -> Review:
        if not 1 <= score <= 5:
            raise ValueError("Балл должен быть от 1 до 5")
        review = Review(
            id=0,
            customer_id=customer_id,
            courier_id=courier_id,
            score=score,
            text=text,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        return await self._repo.add(review)

    async def get_by_id(self, id: int) -> Review | None:
        return await self._repo.get_by_id(id)

    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Review]:
        return await self._repo.get_all(skip=skip, limit=limit)

    async def update(self, id: int, score: int | None = None, text: str | None = None) -> Review | None:
        review = await self._repo.get_by_id(id)
        if not review:
            return None
        review.update(score=score, text=text)
        return await self._repo.save(review)

    async def delete(self, id: int) -> bool:
        review = await self._repo.get_by_id(id)
        if not review:
            return False
        await self._repo.delete(review)
        return True
