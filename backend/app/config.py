from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    env: str = "development"
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/mng_grab"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
