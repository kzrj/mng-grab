"""Тестовые данные для заполнения БД (аккаунты, 5 кастомеров, 5 курьеров)."""

ACCOUNTS = [
    {"name": "Иван Петров", "phone": "+79001234501", "password": "pass01"},
    {"name": "Мария Сидорова", "phone": "+79001234502", "password": "pass02"},
    {"name": "Алексей Козлов", "phone": "+79001234503", "password": "pass03"},
    {"name": "Елена Новикова", "phone": "+79001234504", "password": "pass04"},
    {"name": "Дмитрий Волков", "phone": "+79001234505", "password": "pass05"},
    {"name": "Андрей Курьер", "phone": "+79007654321", "password": "pass21"},
    {"name": "Ольга Курьер", "phone": "+79007654322", "password": "pass22"},
    {"name": "Сергей Курьер", "phone": "+79007654323", "password": "pass23"},
    {"name": "Наталья Курьер", "phone": "+79007654324", "password": "pass24"},
    {"name": "Михаил Курьер", "phone": "+79007654325", "password": "pass25"},
]

CUSTOMERS = [
    {"phone": "+79001234501", "description": "Иван Петров, офис на Ленина", "account_index": 0},
    {"phone": "+79001234502", "description": "Мария Сидорова, доставка до квартиры", "account_index": 1},
    {"phone": "+79001234503", "description": "Алексей Козлов, склад №3", "account_index": 2},
    {"phone": "+79001234504", "description": "Елена Новикова, ресторан Апельсин", "account_index": 3},
    {"phone": "+79001234505", "description": "Дмитрий Волков, магазин Продукты", "account_index": 4},
]

COURIERS = [
    {"phone": "+79007654321", "description": "Андрей, на машине, центр", "account_index": 5},
    {"phone": "+79007654322", "description": "Ольга, пеший курьер, район вокзала", "account_index": 6},
    {"phone": "+79007654323", "description": "Сергей, велосипед, весь город", "account_index": 7},
    {"phone": "+79007654324", "description": "Наталья, машина, срочные заказы", "account_index": 8},
    {"phone": "+79007654325", "description": "Михаил, пеший, микрорайон Северный", "account_index": 9},
]
