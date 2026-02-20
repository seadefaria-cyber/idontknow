import ipaddress
import socket
import structlog
from pathlib import Path
from urllib.parse import urlparse

import yt_dlp

from src.config import Settings
from src.exceptions import DownloadError, URLValidationError

logger = structlog.get_logger()

ALLOWED_DOMAINS = [
    "youtube.com",
    "youtu.be",
    "tiktok.com",
    "instagram.com",
    "twitter.com",
    "x.com",
]

# RFC 1918 and link-local ranges that should never be accessed
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("0.0.0.0/8"),
]


def validate_url(url: str) -> str:
    """Validate a URL against the domain allowlist and block internal IPs."""
    parsed = urlparse(url)

    if parsed.scheme != "https":
        raise URLValidationError("Only HTTPS URLs are allowed")

    if not parsed.netloc:
        raise URLValidationError("Invalid URL: missing host")

    domain = parsed.netloc.lower().replace("www.", "")
    # Strip port if present
    domain = domain.split(":")[0]

    if not any(domain.endswith(d) for d in ALLOWED_DOMAINS):
        raise URLValidationError(f"Domain not allowed: {domain}")

    # Resolve hostname and check against blocked IP ranges
    try:
        resolved_ips = socket.getaddrinfo(parsed.hostname, None)
        for _, _, _, _, sockaddr in resolved_ips:
            ip = ipaddress.ip_address(sockaddr[0])
            for network in _BLOCKED_NETWORKS:
                if ip in network:
                    raise URLValidationError(
                        f"URL resolves to blocked internal address: {ip}"
                    )
    except socket.gaierror:
        raise URLValidationError(f"Cannot resolve hostname: {parsed.hostname}")

    return url


class ContentDownloader:
    """Downloads videos from supported platforms using yt-dlp."""

    def __init__(self, settings: Settings):
        self.settings = settings

    def download(self, url: str, client_id: int) -> Path:
        """Download a video and return the path to the downloaded file.

        Args:
            url: The video URL (must pass SSRF validation).
            client_id: Client ID for storage path organization.

        Returns:
            Path to the downloaded video file.

        Raises:
            URLValidationError: If the URL fails validation.
            DownloadError: If the download fails.
        """
        validated_url = validate_url(url)
        output_dir = self.settings.get_source_storage_path(client_id)
        output_template = str(output_dir / "%(id)s.%(ext)s")

        ydl_opts = {
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "outtmpl": output_template,
            "merge_output_format": "mp4",
            "quiet": True,
            "no_warnings": True,
            "extract_flat": False,
            "noplaylist": True,
        }

        if self.settings.proxy_url:
            ydl_opts["proxy"] = self.settings.proxy_url

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(validated_url, download=True)
                if info is None:
                    raise DownloadError(f"Failed to extract info from {validated_url}")

                filename = ydl.prepare_filename(info)
                filepath = Path(filename)

                if not filepath.exists():
                    # yt-dlp may change extension after merge
                    filepath = filepath.with_suffix(".mp4")

                if not filepath.exists():
                    raise DownloadError(
                        f"Downloaded file not found at expected path: {filepath}"
                    )

                logger.info(
                    "download_complete",
                    url=validated_url,
                    client_id=client_id,
                    file_path=str(filepath),
                    duration=info.get("duration"),
                    title=info.get("title"),
                )

                return filepath

        except yt_dlp.utils.DownloadError as e:
            raise DownloadError(f"yt-dlp download failed: {e}") from e

    def get_video_info(self, url: str) -> dict:
        """Extract video metadata without downloading.

        Returns:
            Dict with title, duration, uploader, etc.
        """
        validated_url = validate_url(url)

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": False,
            "noplaylist": True,
        }

        if self.settings.proxy_url:
            ydl_opts["proxy"] = self.settings.proxy_url

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(validated_url, download=False)
                if info is None:
                    raise DownloadError(
                        f"Failed to extract info from {validated_url}"
                    )
                return {
                    "title": info.get("title", ""),
                    "duration": info.get("duration", 0),
                    "uploader": info.get("uploader", ""),
                    "id": info.get("id", ""),
                }
        except yt_dlp.utils.DownloadError as e:
            raise DownloadError(f"yt-dlp info extraction failed: {e}") from e
