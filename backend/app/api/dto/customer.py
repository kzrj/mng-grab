from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CustomerBase(BaseModel):
    phone: str = Field(..., min_length=1, max_length=20)
    description: str | None = None


class CustomerCreate(CustomerBase):
    account_id: int | None = None


class CustomerUpdate(BaseModel):
    phone: str | None = Field(None, min_length=1, max_length=20)
    description: str | None = None
    account_id: int | None = None


class CustomerRead(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    account_id: int | None = None
    created_at: datetime
    updated_at: datetime
