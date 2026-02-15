from pathlib import Path

import structlog

from src.clipper.ffmpeg_ops import FFmpegService

logger = structlog.get_logger()


class VideoCropper:
    """Crops video to vertical 9:16 format for short-form platforms.

    MVP: Center crop. Later: face detection with MediaPipe.
    """

    def __init__(self, ffmpeg: FFmpegService):
        self.ffmpeg = ffmpeg

    def crop_to_vertical(self, input_path: Path, output_path: Path) -> Path:
        """Center-crop a video to 9:16 vertical (1080x1920).

        This works for ~80% of content. Face detection is added later
        for talking-head content where the speaker isn't centered.
        """
        logger.info("cropping_to_vertical", input=str(input_path))
        return self.ffmpeg.crop_to_vertical(input_path, output_path)
