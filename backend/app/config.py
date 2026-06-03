from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Async Postgres DSN. Compose sets this; the default matches docker-compose.
    database_url: str = "postgresql+asyncpg://bijli:bijli@localhost:5432/bijli_mitra"

    # CORS: the frontend origin. Comma-separate for multiple (e.g. Vercel URL).
    frontend_origin: str = "http://localhost:3000"

    # Default UI language when the client doesn't specify one.
    default_language: str = "hi"


settings = Settings()
