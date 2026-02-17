from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.router import api_router
from app.infrastructure.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="MNG Grab API", version="0.1.0", lifespan=lifespan)
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "MNG Grab API"}
