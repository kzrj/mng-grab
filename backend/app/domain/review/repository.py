from abc import ABC, abstractmethod

from app.domain.review.entity import Review


class IReviewRepository(ABC):
    """Интерфейс репозитория отзывов."""

    @abstractmethod
    async def get_by_id(self, id: int) -> Review | None:
        ...

    @abstractmethod
    async def get_all(self, *, skip: int = 0, limit: int = 100) -> list[Review]:
        ...

    @abstractmethod
    async def add(self, review: Review) -> Review:
        ...

    @abstractmethod
    async def save(self, review: Review) -> Review:
        ...

    @abstractmethod
    async def delete(self, review: Review) -> None:
        ...
