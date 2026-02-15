from datetime import datetime
from enum import Enum

from sqlalchemy import Enum as SQLEnum, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base


class MomentStatus(str, Enum):
    DETECTED = "detected"
    GENERATING = "generating"
    READY = "ready"
    POSTED = "posted"
    FAILED = "failed"


class ClipMoment(Base):
    __tablename__ = "clip_moments"
    __table_args__ = (
        Index("idx_clips_client_status", "client_id", "status"),
        Index(
            "idx_clips_viral_score",
            "viral_score",
            postgresql_where="status = 'detected'",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"))
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    start_time: Mapped[float]
    end_time: Mapped[float]
    viral_score: Mapped[int]
    hook_text: Mapped[str]
    caption_text: Mapped[str]
    reasoning: Mapped[str]
    status: Mapped[MomentStatus] = mapped_column(
        SQLEnum(MomentStatus, native_enum=False),
        default=MomentStatus.DETECTED,
    )
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    source: Mapped["Source"] = relationship(back_populates="moments")
    generated_clips: Mapped[list["GeneratedClip"]] = relationship(
        back_populates="moment"
    )


class GeneratedClip(Base):
    __tablename__ = "generated_clips"
    __table_args__ = (
        Index("idx_clips_client_created", "client_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    moment_id: Mapped[int] = mapped_column(ForeignKey("clip_moments.id"))
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    file_path: Mapped[str]
    duration: Mapped[float]
    resolution: Mapped[str] = mapped_column(String(20), default="1080x1920")
    caption_style: Mapped[str]
    hook_type: Mapped[str]
    variation_number: Mapped[int] = mapped_column(default=1)
    quality_check_passed: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    moment: Mapped["ClipMoment"] = relationship(back_populates="generated_clips")
    post_jobs: Mapped[list["PostJob"]] = relationship(back_populates="clip")
