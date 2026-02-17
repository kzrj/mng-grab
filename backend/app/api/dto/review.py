from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewBase(BaseModel):
    customer_id: int
    courier_id: int
    score: int = Field(..., ge=1, le=5)
    text: str | None = None


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    customer_id: int | None = None
    courier_id: int | None = None
    score: int | None = Field(None, ge=1, le=5)
    text: str | None = None


class ReviewRead(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
