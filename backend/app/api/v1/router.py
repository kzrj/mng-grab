from fastapi import APIRouter

from app.api.v1.endpoints import couriers, customers, orders, reviews

api_router = APIRouter()

api_router.include_router(customers.router)
api_router.include_router(couriers.router)
api_router.include_router(orders.router)
api_router.include_router(reviews.router)


@api_router.get("/health")
def health():
    return {"status": "ok"}
