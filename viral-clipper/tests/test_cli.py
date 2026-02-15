from unittest.mock import patch, MagicMock

import pytest


class TestCli:
    @patch("src.cli.get_settings")
    def test_no_command_exits(self, mock_settings):
        mock_settings.return_value = MagicMock()

        from src.cli import main

        with patch("sys.argv", ["cli"]):
            with pytest.raises(SystemExit) as exc_info:
                main()
            assert exc_info.value.code == 1

    @patch("src.cli.init_db")
    @patch("src.cli.get_settings")
    @patch("src.cli.process_url")
    def test_process_url_dispatch(self, mock_process, mock_settings, mock_init):
        mock_settings.return_value = MagicMock(database_url="postgresql://test/test")

        from src.cli import main

        with patch("sys.argv", ["cli", "process-url", "1", "https://youtube.com/watch?v=abc"]):
            main()

        mock_process.assert_called_once_with(1, "https://youtube.com/watch?v=abc")

    @patch("src.cli.init_db")
    @patch("src.cli.get_settings")
    @patch("src.cli.process_file")
    def test_process_file_dispatch(self, mock_process, mock_settings, mock_init):
        mock_settings.return_value = MagicMock(database_url="postgresql://test/test")

        from src.cli import main

        with patch("sys.argv", ["cli", "process-file", "1", "/tmp/video.mp4"]):
            main()

        mock_process.assert_called_once_with(1, "/tmp/video.mp4")

    def test_process_file_not_found(self):
        from src.cli import process_file

        with pytest.raises(SystemExit):
            process_file(1, "/nonexistent/path/video.mp4")
