import asyncio
import sys
from pathlib import Path

# Корень backend в PYTHONPATH (в форк-воркере celery путь может быть не задан)
_backend_root = Path(__file__).resolve().parent.parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from worker.celery import celery_app
from worker.db import get_session_factory


@celery_app.task
def print_orders() -> None:
    """
    Периодическая задача: каждые 10 секунд печатает список заказов.
    Используем asyncio.run, чтобы вызвать асинхронные репозитории.
    """

    async def _print() -> None:
        from app.infrastructure.persistence.order_repository import OrderRepository
        from app.application.order.service import OrderService

        session_factory = get_session_factory()
        async with session_factory() as session:
            repo = OrderRepository(session)
            service = OrderService(repo)
            orders = await service.get_all()

            # Просто печатаем в stdout — будет видно в логах celery beat/worker
            print("=== Orders list ===")
            if not orders:
                print("No orders found")
            else:
                for o in orders:
                    print(
                        f"[{o.id}] {o.status} {o.where_from} -> {o.where_to} "
                        f"price={o.price} customer_id={o.customer_id} courier_id={o.courier_id}"
                    )
            print("===================")

    asyncio.run(_print())


@celery_app.task
def expire_orders() -> None:
    """
    Каждые 5 минут помечаем заказы как 'expired',
    если у них ещё не такой статус.
    """

    async def _expire() -> None:
        from app.infrastructure.persistence.order_repository import OrderRepository

        session_factory = get_session_factory()
        async with session_factory() as session:
            repo = OrderRepository(session)
            # Один запрос UPDATE — без цикла, чтобы не было "another operation is in progress"
            updated = await repo.bulk_set_status_where_not("expired", "expired")
            await session.commit()
            print(f"[expire_orders] updated {updated} orders to 'expired'")

    asyncio.run(_expire())

