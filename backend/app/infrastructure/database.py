from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession

from app.config import settings
from app.infrastructure.persistence import (
    Base,
    AccountModel,
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


async def _run_account_migrations(conn) -> None:
    """Создать таблицу accounts и колонки account_id в customers/couriers, если их ещё нет."""
    await conn.execute(text("""
        CREATE TABLE IF NOT EXISTS accounts (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """))
    await conn.execute(text("""
        ALTER TABLE customers
        ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id)
    """))
    await conn.execute(text("""
        ALTER TABLE couriers
        ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id)
    """))
    await conn.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_customers_account_id ON customers (account_id)"
    ))
    await conn.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_couriers_account_id ON couriers (account_id)"
    ))


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
        await _run_account_migrations(conn)