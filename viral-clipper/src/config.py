import platform
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _detect_mac_font() -> str:
    """Auto-detect a bold sans-serif font on macOS."""
    mac_font_paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    for font_path in mac_font_paths:
        if Path(font_path).exists():
            return font_path
    return "/System/Library/Fonts/Helvetica.ttc"


def _detect_font_path() -> str:
    """Detect the best available font for the current OS."""
    if platform.system() == "Darwin":
        return _detect_mac_font()
    linux_fonts = [
        "/usr/share/fonts/truetype/montserrat/Montserrat-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
    ]
    for font_path in linux_fonts:
        if Path(font_path).exists():
            return font_path
    return "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database — defaults to SQLite for local Mac usage
    database_url: str = Field(
        default="sqlite:///./data/clipper.db",
        description="Database connection URL (SQLite or PostgreSQL)",
    )

    # Redis — optional, not needed for synchronous mode
    redis_url: Optional[str] = Field(
        default=None,
        description="Redis connection URL for Dramatiq (optional)",
    )

    # AI
    claude_api_key: str = Field(
        default="",
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
        default="",
        description="Fernet encryption key for credentials",
    )
    dashboard_secret_key: str = Field(
        default="not-needed-for-cli-mode-placeholder1",
        description="Secret key for session cookies",
    )

    # Storage
    storage_base_path: Path = Field(
        default=Path("./storage"),
        description="Base directory for all file storage",
    )

    # WhisperX — Mac defaults (CPU, smaller model)
    whisperx_model: str = Field(
        default="base",
        description="WhisperX model name (base for CPU, large-v3 for GPU)",
    )
    whisperx_device: str = Field(
        default="cpu",
        description="Device for WhisperX (cpu or cuda)",
    )
    whisperx_compute_type: str = Field(
        default="int8",
        description="Compute type for WhisperX (int8 for CPU, float16 for GPU)",
    )
    max_concurrent_transcriptions: int = Field(
        default=1,
        ge=1,
        le=10,
        description="Max parallel WhisperX jobs",
    )

    # FFmpeg
    ffmpeg_max_workers: int = Field(
        default=2,
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

    # Font — auto-detected per OS
    font_path: str = Field(
        default="",
        description="Path to bold font for captions (auto-detected if empty)",
    )

    # Proxy
    proxy_url: Optional[str] = Field(
        default=None,
        description="Rotating residential proxy URL",
    )

    # Playwright
    playwright_headless: bool = Field(
        default=False,
        description="Run Playwright in headless mode (set True after initial login)",
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.storage_base_path.mkdir(parents=True, exist_ok=True)
        if not self.font_path:
            self.font_path = _detect_font_path()

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

    def get_cookies_path(self) -> Path:
        """Get the directory for browser session cookies."""
        path = self.storage_base_path / "cookies"
        path.mkdir(parents=True, exist_ok=True)
        return path

    def get_screenshots_path(self) -> Path:
        """Get the directory for debug screenshots."""
        path = self.storage_base_path / "screenshots"
        path.mkdir(parents=True, exist_ok=True)
        return path


def get_settings() -> Settings:
    """Get the application settings singleton."""
    return Settings()
