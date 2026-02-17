from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CourierBase(BaseModel):
    phone: str = Field(..., min_length=1, max_length=20)
    description: str | None = None


class CourierCreate(CourierBase):
    pass


class CourierUpdate(BaseModel):
    phone: str | None = Field(None, min_length=1, max_length=20)
    description: str | None = None


class CourierRead(CourierBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
