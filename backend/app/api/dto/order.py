from datetime import date, datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class OrderStatus(StrEnum):
    ACTIVE = "active"
    EXPIRED = "expired"
    COMPLETED = "completed"
    CANCELED = "canceled"


class OrderBase(BaseModel):
    where_to: str = Field(..., min_length=1, max_length=255)
    where_from: str = Field(..., min_length=1, max_length=255)
    price: float = Field(default=0, ge=0)
    status: OrderStatus = Field(default=OrderStatus.ACTIVE)
    date_when: date
    customer_id: int
    courier_id: int | None = None


class OrderCreate(BaseModel):
    """Создание заказа. customer_id — из JWT. Цена заказа не передаётся; с баланса списывается ORDER_CREATION_PRICE."""
    where_to: str = Field(..., min_length=1, max_length=255)
    where_from: str = Field(..., min_length=1, max_length=255)
    date_when: date
    status: OrderStatus = Field(default=OrderStatus.ACTIVE)


class OrderUpdate(BaseModel):
    where_to: str | None = Field(None, min_length=1, max_length=255)
    where_from: str | None = Field(None, min_length=1, max_length=255)
    price: float | None = Field(None, ge=0)
    status: OrderStatus | None = None
    date_when: date | None = None
    customer_id: int | None = None
    courier_id: int | None = None


class OrderRead(OrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
