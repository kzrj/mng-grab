from dataclasses import dataclass
from datetime import datetime


@dataclass
class Courier:
    """Курьер — Aggregate Root."""

    id: int
    phone: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    def update(self, phone: str | None = None, description: str | None = None) -> None:
        """Обновление данных курьера."""
        if phone is not None:
            if not phone.strip():
                raise ValueError("Телефон не может быть пустым")
            self.phone = phone
        if description is not None:
            self.description = description
