from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Enum as SQLEnum, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base


class PlatformType(str, Enum):
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"
    TWITTER = "twitter"


class AccountStatus(str, Enum):
    ACTIVE = "active"
    WARNED = "warned"
    SUSPENDED = "suspended"
    BANNED = "banned"


class PostStatus(str, Enum):
    QUEUED = "queued"
    POSTING = "posting"
    POSTED = "posted"
    FAILED = "failed"


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    platform: Mapped[PlatformType] = mapped_column(
        SQLEnum(PlatformType, native_enum=False)
    )
    username: Mapped[str] = mapped_column(String(100))
    credentials_encrypted: Mapped[str]
    cookie_path: Mapped[Optional[str]] = mapped_column(default=None)
    status: Mapped[AccountStatus] = mapped_column(
        SQLEnum(AccountStatus, native_enum=False),
        default=AccountStatus.ACTIVE,
    )
    last_posted_at: Mapped[Optional[datetime]]
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    client: Mapped["Client"] = relationship()
    post_jobs: Mapped[list["PostJob"]] = relationship(back_populates="account")


class PostJob(Base):
    __tablename__ = "post_jobs"
    __table_args__ = (
        Index("idx_posts_scheduled", "scheduled_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    clip_id: Mapped[int] = mapped_column(ForeignKey("generated_clips.id"))
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"))
    scheduled_at: Mapped[datetime]
    posted_at: Mapped[Optional[datetime]]
    platform_post_id: Mapped[Optional[str]]
    status: Mapped[PostStatus] = mapped_column(
        SQLEnum(PostStatus, native_enum=False),
        default=PostStatus.QUEUED,
    )
    error_message: Mapped[Optional[str]]
    post_caption: Mapped[str]
    hashtags: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    clip: Mapped["GeneratedClip"] = relationship(back_populates="post_jobs")
    account: Mapped["Account"] = relationship(back_populates="post_jobs")
