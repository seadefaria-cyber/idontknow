from contextlib import contextmanager
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

_engine = None
_session_factory = None


def init_db(database_url: str) -> None:
    """Initialize the database engine and session factory.

    Supports both SQLite and PostgreSQL connection strings.
    """
    global _engine, _session_factory

    is_sqlite = database_url.startswith("sqlite")

    if is_sqlite:
        # Ensure the directory for the SQLite file exists
        if ":///" in database_url:
            db_path = database_url.split("///", 1)[1]
            Path(db_path).parent.mkdir(parents=True, exist_ok=True)

        _engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False},
        )

        @event.listens_for(_engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    else:
        _engine = create_engine(
            str(database_url),
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=3600,
        )

    _session_factory = sessionmaker(bind=_engine)


def create_tables() -> None:
    """Create all database tables from ORM models."""
    if _engine is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    from src.models.base import Base
    import src.models.client  # noqa: F401
    import src.models.content  # noqa: F401
    import src.models.distribution  # noqa: F401

    Base.metadata.create_all(_engine)


def get_engine():
    """Get the SQLAlchemy engine."""
    if _engine is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return _engine


@contextmanager
def get_db_session() -> Session:
    """Context manager for database sessions with auto commit/rollback."""
    if _session_factory is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    session = _session_factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
