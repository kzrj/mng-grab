from fastapi import APIRouter

from app.api.v1.endpoints import accounts, auth, couriers, customers, orders, reviews, seed

api_router = APIRouter()

api_router.include_router(seed.router)
api_router.include_router(auth.router)
api_router.include_router(accounts.router)
api_router.include_router(customers.router)
api_router.include_router(couriers.router)
api_router.include_router(orders.router)
api_router.include_router(reviews.router)


@api_router.get("/health")
def health():
    return {"status": "ok"}
