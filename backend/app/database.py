from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    pass


def _engine_kwargs():
    database_url = get_settings().database_url
    if database_url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}
    return {"connect_args": {"sslmode": "require"}}


engine = create_engine(get_settings().database_url, pool_pre_ping=True, **_engine_kwargs())
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
