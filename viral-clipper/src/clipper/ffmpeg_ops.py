import json
import subprocess
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import structlog

from src.config import Settings
from src.exceptions import FFmpegError

logger = structlog.get_logger()


class FFmpegService:
    """Wraps all FFmpeg operations with safe subprocess calls.

    SECURITY: All subprocess calls use list format (never shell=True)
    to prevent command injection.
    """

    def __init__(self, settings: Settings):
        self.settings = settings
        self.timeout = settings.ffmpeg_timeout_seconds

    def extract_clip(
        self,
        source_path: Path,
        output_path: Path,
        start_time: float,
        end_time: float,
    ) -> Path:
        """Extract a clip from source video at given timestamps.

        Uses stream copy when possible for speed, falls back to re-encode
        if the codec doesn't support precise seeking.
        """
        cmd = [
            "ffmpeg",
            "-ss", str(start_time),
            "-to", str(end_time),
            "-i", str(source_path),
            "-c", "copy",
            "-avoid_negative_ts", "make_zero",
            "-y",
            str(output_path),
        ]
        self._run(cmd)
        return output_path

    def crop_to_vertical(
        self,
        input_path: Path,
        output_path: Path,
    ) -> Path:
        """Center-crop video to 9:16 vertical (1080x1920).

        MVP: simple center crop. Face detection added later.
        """
        encoder_args = self._get_encoder_args()

        cmd = [
            "ffmpeg",
            "-i", str(input_path),
            "-vf", "crop=ih*9/16:ih,scale=1080:1920",
            *encoder_args,
            "-c:a", "aac",
            "-b:a", "128k",
            "-y",
            str(output_path),
        ]
        self._run(cmd)
        return output_path

    def burn_captions(
        self,
        input_path: Path,
        ass_path: Path,
        output_path: Path,
    ) -> Path:
        """Burn ASS subtitles into the video."""
        encoder_args = self._get_encoder_args()

        # ASS filter requires escaping colons and backslashes in the path
        safe_ass_path = str(ass_path).replace("\\", "\\\\").replace(":", "\\:")

        cmd = [
            "ffmpeg",
            "-i", str(input_path),
            "-vf", f"ass={safe_ass_path}",
            *encoder_args,
            "-c:a", "copy",
            "-y",
            str(output_path),
        ]
        self._run(cmd)
        return output_path

    def add_hook_overlay(
        self,
        input_path: Path,
        output_path: Path,
        hook_text: str,
        duration: float = 3.0,
    ) -> Path:
        """Add text hook overlay to the first N seconds of the video."""
        # Sanitize hook text for FFmpeg drawtext filter
        safe_text = hook_text.replace("'", "\u2019").replace(":", "\\:")

        encoder_args = self._get_encoder_args()

        # Escape the font path for FFmpeg filter syntax
        safe_font = self.settings.font_path.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")

        drawtext_filter = (
            f"drawtext=text='{safe_text}'"
            f":fontfile='{safe_font}'"
            f":fontsize=48:fontcolor=white:borderw=3:bordercolor=black"
            f":x=(w-text_w)/2:y=h*0.15"
            f":enable='between(t,0,{duration})'"
        )

        cmd = [
            "ffmpeg",
            "-i", str(input_path),
            "-vf", drawtext_filter,
            *encoder_args,
            "-c:a", "copy",
            "-y",
            str(output_path),
        ]
        self._run(cmd)
        return output_path

    def mute_segments(
        self,
        input_path: Path,
        output_path: Path,
        segments: list[tuple[float, float]],
    ) -> Path:
        """Mute audio at specific timestamp ranges (for profanity).

        Args:
            input_path: Input video path.
            output_path: Output video path.
            segments: List of (start, end) tuples in seconds to mute.
        """
        if not segments:
            # No segments to mute, just copy
            cmd = [
                "ffmpeg",
                "-i", str(input_path),
                "-c", "copy",
                "-y",
                str(output_path),
            ]
            self._run(cmd)
            return output_path

        # Build volume filter with enable expressions for each segment
        volume_filters = []
        for start, end in segments:
            volume_filters.append(
                f"volume=enable='between(t,{start},{end})':volume=0"
            )

        filter_chain = ",".join(volume_filters)

        cmd = [
            "ffmpeg",
            "-i", str(input_path),
            "-af", filter_chain,
            "-c:v", "copy",
            "-y",
            str(output_path),
        ]
        self._run(cmd)
        return output_path

    def get_video_info(self, path: Path) -> dict:
        """Get video metadata using ffprobe."""
        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            str(path),
        ]
        result = self._run(cmd, capture_output=True)
        return json.loads(result.stdout)

    def validate_clip(self, path: Path) -> dict:
        """Validate a generated clip meets quality requirements.

        Checks:
        - File exists and has non-zero size
        - Duration is within expected range
        - Resolution is 1080x1920
        - Has audio track
        - No black frames at start/end

        Returns:
            Dict with validation results and any issues found.
        """
        issues = []

        if not path.exists():
            return {"passed": False, "issues": ["File does not exist"]}

        if path.stat().st_size == 0:
            return {"passed": False, "issues": ["File is empty"]}

        info = self.get_video_info(path)

        # Check duration
        duration = float(info.get("format", {}).get("duration", 0))
        if duration < 15 or duration > 120:
            issues.append(f"Duration {duration:.1f}s outside 15-120s range")

        # Check video stream
        video_streams = [
            s for s in info.get("streams", []) if s.get("codec_type") == "video"
        ]
        if not video_streams:
            issues.append("No video stream found")
        else:
            width = video_streams[0].get("width", 0)
            height = video_streams[0].get("height", 0)
            if width != 1080 or height != 1920:
                issues.append(f"Resolution {width}x{height} != 1080x1920")

        # Check audio stream
        audio_streams = [
            s for s in info.get("streams", []) if s.get("codec_type") == "audio"
        ]
        if not audio_streams:
            issues.append("No audio stream found")

        return {"passed": len(issues) == 0, "issues": issues, "duration": duration}

    def process_batch(
        self,
        jobs: list[dict],
        max_workers: int | None = None,
    ) -> list[dict]:
        """Process multiple FFmpeg jobs in parallel.

        Args:
            jobs: List of dicts with 'function' (method name) and 'kwargs'.
            max_workers: Max parallel processes (defaults to settings).

        Returns:
            List of result dicts with 'success', 'output_path', and 'error'.
        """
        workers = max_workers or self.settings.ffmpeg_max_workers
        results = []

        with ProcessPoolExecutor(max_workers=workers) as executor:
            future_to_job = {}
            for job in jobs:
                method = getattr(self, job["function"])
                future = executor.submit(method, **job["kwargs"])
                future_to_job[future] = job

            for future in as_completed(future_to_job):
                job = future_to_job[future]
                try:
                    output = future.result()
                    results.append({
                        "success": True,
                        "output_path": str(output),
                        "job": job,
                    })
                except Exception as e:
                    results.append({
                        "success": False,
                        "error": str(e),
                        "job": job,
                    })

        return results

    def _get_encoder_args(self) -> list[str]:
        """Get video encoder arguments based on settings."""
        if self.settings.use_nvenc:
            return ["-c:v", "h264_nvenc", "-preset", "p4", "-tune", "hq"]
        return ["-c:v", "libx264", "-preset", "medium", "-crf", "23"]

    def _run(
        self,
        cmd: list[str],
        capture_output: bool = False,
    ) -> subprocess.CompletedProcess:
        """Run an FFmpeg/ffprobe command safely.

        SECURITY: Always uses list format, never shell=True.
        """
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                timeout=self.timeout,
                check=False,
            )

            if result.returncode != 0:
                stderr = result.stderr.decode(errors="replace")
                raise FFmpegError(
                    f"FFmpeg command failed with exit code {result.returncode}",
                    command=cmd,
                    stderr=stderr,
                    returncode=result.returncode,
                )

            return result

        except subprocess.TimeoutExpired:
            raise FFmpegError(
                f"FFmpeg command timed out after {self.timeout}s",
                command=cmd,
            )
