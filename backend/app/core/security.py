"""JWT: создание и проверка токена. В payload только account_id (sub) и exp."""

import time

import jwt
from jwt import PyJWTError

from app.config import settings


def create_access_token(account_id: int) -> str:
    """Создать JWT: sub = account_id, exp = срок действия."""
    now = int(time.time())
    payload = {
        "sub": str(account_id),
        "exp": now + settings.jwt_expire_minutes * 60,
    }
    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> int | None:
    """Проверить токен и вернуть account_id (sub). При ошибке — None."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        sub = payload.get("sub")
        if sub is None:
            return None
        return int(sub)
    except (PyJWTError, ValueError):
        return None
