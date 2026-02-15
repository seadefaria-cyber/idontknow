from pathlib import Path
from typing import Optional

from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: PostgresDsn = Field(
        description="PostgreSQL connection URL",
    )

    # Redis
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL for Dramatiq",
    )

    # AI
    claude_api_key: str = Field(
        min_length=10,
        description="Anthropic Claude API key",
    )
    claude_model_bulk: str = Field(
        default="claude-sonnet-4-5-20250929",
        description="Model for bulk work (moment detection, hooks)",
    )
    claude_model_complex: str = Field(
        default="claude-opus-4-6",
        description="Model for complex analysis (strategy, learning)",
    )

    # Security
    encryption_key: str = Field(
        min_length=32,
        description="Fernet encryption key for credentials",
    )
    dashboard_secret_key: str = Field(
        min_length=32,
        description="Secret key for session cookies",
    )

    # Storage
    storage_base_path: Path = Field(
        default=Path("./storage"),
        description="Base directory for all file storage",
    )

    # WhisperX
    whisperx_model: str = Field(
        default="large-v3",
        description="WhisperX model name",
    )
    whisperx_device: str = Field(
        default="cuda",
        description="Device for WhisperX (cuda or cpu)",
    )
    whisperx_compute_type: str = Field(
        default="float16",
        description="Compute type for WhisperX (float16 or int8)",
    )
    max_concurrent_transcriptions: int = Field(
        default=2,
        ge=1,
        le=10,
        description="Max parallel WhisperX jobs",
    )

    # FFmpeg
    ffmpeg_max_workers: int = Field(
        default=4,
        ge=1,
        le=20,
        description="Max parallel FFmpeg processes",
    )
    ffmpeg_timeout_seconds: int = Field(
        default=300,
        description="Timeout for FFmpeg operations",
    )
    use_nvenc: bool = Field(
        default=False,
        description="Use NVIDIA NVENC for GPU-accelerated encoding",
    )

    # Proxy
    proxy_url: Optional[str] = Field(
        default=None,
        description="Rotating residential proxy URL (Bright Data)",
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.storage_base_path.mkdir(parents=True, exist_ok=True)

    def get_client_storage_path(self, client_id: int) -> Path:
        """Get the storage directory for a client."""
        path = self.storage_base_path / str(client_id)
        path.mkdir(parents=True, exist_ok=True)
        return path

    def get_source_storage_path(self, client_id: int) -> Path:
        """Get the source video storage directory for a client."""
        path = self.get_client_storage_path(client_id) / "sources"
        path.mkdir(parents=True, exist_ok=True)
        return path

    def get_clip_storage_path(self, client_id: int) -> Path:
        """Get the generated clips storage directory for a client."""
        path = self.get_client_storage_path(client_id) / "clips"
        path.mkdir(parents=True, exist_ok=True)
        return path

    def get_temp_path(self) -> Path:
        """Get the temp processing directory."""
        path = self.storage_base_path / "temp"
        path.mkdir(parents=True, exist_ok=True)
        return path


def get_settings() -> Settings:
    """Get the application settings singleton."""
    return Settings()
