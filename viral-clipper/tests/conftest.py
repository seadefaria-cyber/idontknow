import os
from contextlib import contextmanager

import pytest
from cryptography.fernet import Fernet
from sqlalchemy import JSON, create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.models.base import Base

# Make PostgreSQL JSONB compile as JSON on SQLite so tests work without Postgres.
from sqlalchemy.dialects.postgresql import JSONB

JSONB_original_visit = None


@pytest.fixture(autouse=True, scope="session")
def _register_jsonb_for_sqlite():
    """Register JSONB -> JSON compilation rule for SQLite."""
    from sqlalchemy.ext.compiler import compiles

    @compiles(JSONB, "sqlite")
    def _compile_jsonb_sqlite(type_, compiler, **kw):
        return compiler.visit_JSON(JSON(), **kw)


@pytest.fixture
def fernet_key():
    """Pre-generated real Fernet key for encryption tests."""
    return Fernet.generate_key().decode()


@pytest.fixture
def settings(tmp_path, fernet_key, monkeypatch):
    """Create a Settings instance with test-friendly env vars."""
    monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost/test")
    monkeypatch.setenv("CLAUDE_API_KEY", "sk-ant-test-key-for-testing-1234567890")
    monkeypatch.setenv("ENCRYPTION_KEY", fernet_key)
    monkeypatch.setenv("DASHBOARD_SECRET_KEY", "a" * 32)
    monkeypatch.setenv("STORAGE_BASE_PATH", str(tmp_path / "storage"))
    monkeypatch.setenv("USE_NVENC", "false")
    monkeypatch.setenv("WHISPERX_DEVICE", "cpu")

    from src.config import Settings

    return Settings()


@pytest.fixture
def db_engine():
    """In-memory SQLite engine for testing."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db_session(db_engine):
    """Database session backed by in-memory SQLite."""
    Session = sessionmaker(bind=db_engine)
    session = Session()
    yield session
    session.rollback()
    session.close()


@pytest.fixture
def mock_db_session(db_session, monkeypatch):
    """Patch get_db_session to yield the test db_session."""

    @contextmanager
    def _fake_get_db_session():
        try:
            yield db_session
            db_session.flush()
        except Exception:
            db_session.rollback()
            raise

    # Patch in the source module AND in every consumer module that did
    # "from src.database import get_db_session" (which creates a local binding).
    _modules_using_get_db_session = [
        "src.database",
        "src.services.ingestion_service",
        "src.services.clipping_service",
        "src.services.distribution_service",
        "src.tasks.ingestion_tasks",
        "src.tasks.ai_tasks",
        "src.tasks.clipper_tasks",
        "src.tasks.distribution_tasks",
        "src.cli",
    ]
    for mod in _modules_using_get_db_session:
        try:
            monkeypatch.setattr(f"{mod}.get_db_session", _fake_get_db_session)
        except AttributeError:
            pass  # Module not imported yet; that's fine

    return db_session


@pytest.fixture
def sample_transcript():
    """WhisperX transcript dict with 2 segments and word timestamps."""
    return {
        "segments": [
            {
                "start": 0.0,
                "end": 5.0,
                "text": "This is the first segment",
                "words": [
                    {"word": "This", "start": 0.0, "end": 0.3},
                    {"word": "is", "start": 0.4, "end": 0.5},
                    {"word": "the", "start": 0.6, "end": 0.7},
                    {"word": "first", "start": 0.8, "end": 1.0},
                    {"word": "segment", "start": 1.1, "end": 1.5},
                ],
            },
            {
                "start": 5.0,
                "end": 10.0,
                "text": "This is the second segment",
                "words": [
                    {"word": "This", "start": 5.0, "end": 5.3},
                    {"word": "is", "start": 5.4, "end": 5.5},
                    {"word": "the", "start": 5.6, "end": 5.7},
                    {"word": "second", "start": 5.8, "end": 6.0},
                    {"word": "segment", "start": 6.1, "end": 6.5},
                ],
            },
        ],
        "language": "en",
    }


@pytest.fixture
def sample_words():
    """Flat word list for captioner/profanity tests."""
    return [
        {"word": "Hello", "start": 0.0, "end": 0.3},
        {"word": "world", "start": 0.4, "end": 0.7},
        {"word": "this", "start": 0.8, "end": 1.0},
        {"word": "is", "start": 1.1, "end": 1.2},
        {"word": "great", "start": 1.3, "end": 1.6},
    ]
