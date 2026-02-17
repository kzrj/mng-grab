from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession

from app.config import settings
from app.infrastructure.persistence import (
    Base,
    CustomerModel,
    CourierModel,
    OrderModel,
    ReviewModel,
)

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
