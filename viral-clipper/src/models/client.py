from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import JSON, Enum as SQLEnum, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base


class SourceStatus(str, Enum):
    PENDING = "pending"
    TRANSCRIBING = "transcribing"
    READY = "ready"
    FAILED = "failed"


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    sources: Mapped[list["Source"]] = relationship(back_populates="client")


class Source(Base):
    __tablename__ = "sources"
    __table_args__ = (
        Index("idx_sources_client_status", "client_id", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    url: Mapped[Optional[str]]
    file_path: Mapped[str]
    title: Mapped[str]
    duration_seconds: Mapped[float]
    transcript_json: Mapped[Optional[dict]] = mapped_column(JSON)
    status: Mapped[SourceStatus] = mapped_column(
        SQLEnum(SourceStatus, native_enum=False),
        default=SourceStatus.PENDING,
    )
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    client: Mapped["Client"] = relationship(back_populates="sources")
    moments: Mapped[list["ClipMoment"]] = relationship(back_populates="source")
