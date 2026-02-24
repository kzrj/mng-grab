from dataclasses import dataclass
from datetime import datetime


@dataclass
class Account:
    """Аккаунт — для авторизации (имя, телефон, пароль)."""

    id: int
    name: str
    phone: str
    password: str
    created_at: datetime
    updated_at: datetime

    def update(self, name: str | None = None, phone: str | None = None, password: str | None = None) -> None:
        if name is not None:
            if not name.strip():
                raise ValueError("Имя не может быть пустым")
            self.name = name
        if phone is not None:
            if not phone.strip():
                raise ValueError("Телефон не может быть пустым")
            self.phone = phone
        if password is not None:
            if not password:
                raise ValueError("Пароль не может быть пустым")
            self.password = password
