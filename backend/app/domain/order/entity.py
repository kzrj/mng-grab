from dataclasses import dataclass
from datetime import date, datetime


@dataclass
class Order:
    """Заказ — Aggregate Root."""

    id: int
    where_to: str
    where_from: str
    price: float
    status: str
    date_when: date
    customer_id: int
    courier_id: int | None
    created_at: datetime
    updated_at: datetime

    def assign_courier(self, courier_id: int) -> None:
        """Назначить курьера на заказ."""
        self.courier_id = courier_id

    def update_status(self, status: str) -> None:
        """Обновить статус заказа."""
        self.status = status

    def update(
        self,
        where_to: str | None = None,
        where_from: str | None = None,
        price: float | None = None,
        status: str | None = None,
        date_when: date | None = None,
        courier_id: int | None = None,
    ) -> None:
        """Обновление данных заказа."""
        if where_to is not None:
            if not where_to.strip():
                raise ValueError("Адрес назначения не может быть пустым")
            self.where_to = where_to
        if where_from is not None:
            if not where_from.strip():
                raise ValueError("Адрес отправления не может быть пустым")
            self.where_from = where_from
        if price is not None:
            if price < 0:
                raise ValueError("Цена не может быть отрицательной")
            self.price = price
        if status is not None:
            self.status = status
        if date_when is not None:
            self.date_when = date_when
        if courier_id is not None:
            self.courier_id = courier_id
