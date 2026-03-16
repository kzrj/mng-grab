# Миграции БД

Миграции выполняются **автоматически при старте приложения**.

При запуске FastAPI в `lifespan` вызывается `init_db()` (`app/infrastructure/database.py`), который:

1. Создаёт таблицы по ORM-моделям (`Base.metadata.create_all`).
2. Добавляет недостающие колонки и таблицы через `_run_account_migrations()` (в т.ч. таблица `accounts`, колонки `account_id` у customers/couriers, колонка `balance` у accounts с дефолтом 100).

**Как применить миграции:** просто запустите бэкенд (например `uvicorn app.main:app`). При первом запросе БД инициализируется и все миграции выполнятся.

Для уже существующей БД используется `ADD COLUMN IF NOT EXISTS`, поэтому повторный запуск безопасен — лишние изменения не применяются.

**Ручной запуск** (если нужно только накатить миграции без поднятия API):

```bash
cd backend
python -c "
import asyncio
from app.infrastructure.database import init_db
asyncio.run(init_db())
print('Миграции выполнены.')
"
```
