from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

_engine = None
_session_factory = None


def init_db(database_url: str) -> None:
    """Initialize the database engine and session factory."""
    global _engine, _session_factory
    _engine = create_engine(
        str(database_url),
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
    )
    _session_factory = sessionmaker(bind=_engine)


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
