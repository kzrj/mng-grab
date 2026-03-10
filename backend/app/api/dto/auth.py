from typing import Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    phone: str = Field(..., min_length=1, max_length=20)
    password: str = Field(..., min_length=1)


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=1, max_length=20)
    password: str = Field(..., min_length=1, max_length=255)
    role: Literal["customer", "courier"] = Field(..., description="Заказчик или курьер")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
