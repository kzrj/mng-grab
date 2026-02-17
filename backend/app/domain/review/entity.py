from dataclasses import dataclass
from datetime import datetime


@dataclass
class Review:
    """Отзыв — Aggregate Root."""

    id: int
    customer_id: int
    courier_id: int
    score: int  # 1-5
    text: str | None
    created_at: datetime
    updated_at: datetime

    def update(self, score: int | None = None, text: str | None = None) -> None:
        """Обновление отзыва."""
        if score is not None:
            if not 1 <= score <= 5:
                raise ValueError("Балл должен быть от 1 до 5")
            self.score = score
        if text is not None:
            self.text = text
