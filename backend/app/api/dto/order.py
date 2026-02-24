from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class OrderBase(BaseModel):
    where_to: str = Field(..., min_length=1, max_length=255)
    where_from: str = Field(..., min_length=1, max_length=255)
    price: float = Field(default=0, ge=0)
    status: str = Field(default="new", max_length=50)
    date_when: date
    customer_id: int
    courier_id: int | None = None


class OrderCreate(BaseModel):
    """Создание заказа. customer_id задаётся на бэкенде из JWT (только заказчик)."""
    where_to: str = Field(..., min_length=1, max_length=255)
    where_from: str = Field(..., min_length=1, max_length=255)
    price: float = Field(default=0, ge=0)
    date_when: date
    status: str = Field(default="new", max_length=50)


class OrderUpdate(BaseModel):
    where_to: str | None = Field(None, min_length=1, max_length=255)
    where_from: str | None = Field(None, min_length=1, max_length=255)
    price: float | None = Field(None, ge=0)
    status: str | None = Field(None, max_length=50)
    date_when: date | None = None
    customer_id: int | None = None
    courier_id: int | None = None


class OrderRead(OrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
