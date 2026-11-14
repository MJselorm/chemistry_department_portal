from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    pass


def _create_engine(database_url: str):
    url = make_url(database_url)
    if url.get_backend_name() == "sqlite":
        return create_engine(
            url,
            pool_pre_ping=True,
            connect_args={"check_same_thread": False},
        )
    if url.get_backend_name() == "postgresql":
        query = dict(url.query)
        query.setdefault("sslmode", "require")
        return create_engine(
            url.set(query=query),
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=5,
            pool_timeout=5,
            pool_recycle=1800,
            connect_args={"connect_timeout": 5},
        )
    return create_engine(url, pool_pre_ping=True)


engine = _create_engine(get_settings().database_url)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
