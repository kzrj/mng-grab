"""
Сессия БД для Celery-задач.

В задачах мы вызываем asyncio.run(coro), поэтому каждый запуск создаёт новый event loop.
Глобальные engine/async_session из app.infrastructure.database создаются при импорте
и оказываются привязаны к другому loop → "Future attached to a different loop".

Фабрика создаёт engine и сессию внутри корутины задачи, в текущем loop.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine


def get_session_factory():
    """
    Создать фабрику сессий в текущем event loop.
    Вызывать из async-функции задачи (внутри asyncio.run(...)).
    """
    from app.config import settings

    engine = create_async_engine(settings.database_url, echo=False)
    return async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
