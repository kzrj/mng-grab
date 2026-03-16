import os
import sys
from pathlib import Path

# Корень backend в PYTHONPATH, чтобы в воркере находился пакет app
_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from celery import Celery


celery_app = Celery(
    "mng_grab_worker",
    broker=os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/1"),
    include=["worker.tasks.orders"],
)

celery_app.conf.update(
    timezone="Europe/Moscow",
    enable_utc=True,
    beat_schedule={
        "print-orders-every-10-seconds": {
            "task": "worker.tasks.orders.print_orders",
            "schedule": 10.0,
        },
        "expire-orders-every-5-minutes": {
            "task": "worker.tasks.orders.expire_orders",
            "schedule": 300.0,
        },
    },
)

