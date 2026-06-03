from pydantic_settings import BaseSettings, SettingsConfigDict


def _as_asyncpg(url: str) -> str:
    """Force the asyncpg driver on the DSN.

    Managed hosts (Render, Railway, Fly, Heroku) inject a plain
    ``postgresql://`` (sometimes legacy ``postgres://``) URL. SQLAlchemy's
    async engine needs the ``+asyncpg`` driver, so normalise whatever the
    platform gives us. A URL that already names a driver is left untouched.
    """
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://") :]
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Async Postgres DSN. Compose sets this; the default matches docker-compose.
    database_url: str = "postgresql+asyncpg://bijli:bijli@localhost:5432/bijli_mitra"

    # CORS: the frontend origin. Comma-separate for multiple (e.g. Vercel URL).
    frontend_origin: str = "http://localhost:3000"

    # Default UI language when the client doesn't specify one.
    default_language: str = "hi"


settings = Settings()
settings.database_url = _as_asyncpg(settings.database_url)
