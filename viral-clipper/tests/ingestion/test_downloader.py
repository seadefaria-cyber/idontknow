import socket
from unittest.mock import MagicMock, patch

import pytest

from src.exceptions import URLValidationError
from src.ingestion.downloader import validate_url


def _mock_getaddrinfo_public(*args, **kwargs):
    """Return a public IP for DNS resolution."""
    return [(None, None, None, None, ("93.184.216.34", 0))]


class TestValidateUrl:
    @patch("src.ingestion.downloader.socket.getaddrinfo", _mock_getaddrinfo_public)
    def test_valid_https_youtube(self):
        url = "https://www.youtube.com/watch?v=abc123"
        assert validate_url(url) == url

    def test_http_rejected(self):
        with pytest.raises(URLValidationError, match="HTTPS"):
            validate_url("http://youtube.com/watch?v=abc")

    def test_missing_host(self):
        with pytest.raises(URLValidationError, match="missing host"):
            validate_url("https://")

    @patch("src.ingestion.downloader.socket.getaddrinfo", _mock_getaddrinfo_public)
    def test_disallowed_domain(self):
        with pytest.raises(URLValidationError, match="not allowed"):
            validate_url("https://evil.com/video")

    @pytest.mark.parametrize(
        "domain",
        [
            "youtube.com",
            "youtu.be",
            "tiktok.com",
            "instagram.com",
            "twitter.com",
            "x.com",
        ],
    )
    @patch("src.ingestion.downloader.socket.getaddrinfo", _mock_getaddrinfo_public)
    def test_allowed_domains(self, domain):
        url = f"https://{domain}/video/123"
        assert validate_url(url) == url

    @patch("src.ingestion.downloader.socket.getaddrinfo", _mock_getaddrinfo_public)
    def test_www_stripped(self):
        url = "https://www.youtube.com/watch?v=abc"
        assert validate_url(url) == url

    @pytest.mark.parametrize(
        "ip",
        [
            "10.0.0.1",
            "172.16.0.1",
            "192.168.1.1",
            "169.254.1.1",
            "127.0.0.1",
            "0.0.0.1",
        ],
    )
    def test_blocked_ips(self, ip):
        with patch(
            "src.ingestion.downloader.socket.getaddrinfo",
            return_value=[(None, None, None, None, (ip, 0))],
        ):
            with pytest.raises(URLValidationError, match="blocked"):
                validate_url(f"https://youtube.com/watch?v=abc")

    def test_dns_failure(self):
        with patch(
            "src.ingestion.downloader.socket.getaddrinfo",
            side_effect=socket.gaierror("DNS failed"),
        ):
            with pytest.raises(URLValidationError, match="Cannot resolve"):
                validate_url("https://youtube.com/watch?v=abc")


class TestContentDownloaderDownload:
    @patch("src.ingestion.downloader.yt_dlp.YoutubeDL")
    @patch("src.ingestion.downloader.validate_url", return_value="https://youtube.com/watch?v=test")
    def test_successful_download(self, mock_validate, mock_ydl_class, settings, tmp_path):
        from src.ingestion.downloader import ContentDownloader

        # Create the expected output file
        output_file = settings.get_source_storage_path(1) / "test123.mp4"
        output_file.write_bytes(b"fake video")

        mock_ydl = MagicMock()
        mock_ydl.__enter__ = MagicMock(return_value=mock_ydl)
        mock_ydl.__exit__ = MagicMock(return_value=False)
        mock_ydl.extract_info.return_value = {"id": "test123", "title": "Test"}
        mock_ydl.prepare_filename.return_value = str(output_file)
        mock_ydl_class.return_value = mock_ydl

        downloader = ContentDownloader(settings)
        result = downloader.download("https://youtube.com/watch?v=test", 1)
        assert result == output_file
