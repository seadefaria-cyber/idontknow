from pathlib import Path
from typing import Any

import structlog

from src.clipper.ffmpeg_ops import FFmpegService

logger = structlog.get_logger()

# Common profanity words to detect and mute.
# This is a minimal starter list — extend based on client needs.
PROFANITY_WORDS = {
    "fuck", "fucking", "fucked", "fucker",
    "shit", "shitting", "shitty",
    "bitch", "bitches",
    "ass", "asshole",
    "damn", "damned",
    "hell",
    "dick",
    "crap",
    "bastard",
    "cunt",
    "piss",
    "cock",
    "whore",
    "slut",
}

# Buffer in seconds around each profanity word to ensure it's fully muted
MUTE_BUFFER_SECONDS = 0.05


class ProfanityFilter:
    """Detects profanity in transcripts and mutes those segments in video."""

    def __init__(self, ffmpeg: FFmpegService):
        self.ffmpeg = ffmpeg

    def detect_profanity(
        self,
        words: list[dict[str, Any]],
    ) -> list[tuple[float, float]]:
        """Find profanity in word-level timestamps.

        Args:
            words: List of word dicts from WhisperX with 'word', 'start', 'end'.

        Returns:
            List of (start, end) tuples marking segments to mute.
        """
        segments = []
        for word_info in words:
            word = word_info.get("word", "").strip().lower()
            # Strip punctuation for matching
            clean_word = "".join(c for c in word if c.isalpha())
            if clean_word in PROFANITY_WORDS:
                start = word_info.get("start", 0) - MUTE_BUFFER_SECONDS
                end = word_info.get("end", 0) + MUTE_BUFFER_SECONDS
                if start < 0:
                    start = 0
                segments.append((start, end))

        # Merge overlapping segments
        merged = self._merge_segments(segments)

        if merged:
            logger.info(
                "profanity_detected",
                count=len(merged),
                total_mute_seconds=sum(e - s for s, e in merged),
            )

        return merged

    def mute_profanity(
        self,
        input_path: Path,
        output_path: Path,
        words: list[dict[str, Any]],
    ) -> Path:
        """Detect and mute profanity in a video clip.

        Args:
            input_path: Input video path.
            output_path: Output video path.
            words: Word-level timestamps from WhisperX.

        Returns:
            Path to the output video (muted or copied if no profanity).
        """
        segments = self.detect_profanity(words)
        return self.ffmpeg.mute_segments(input_path, output_path, segments)

    def _merge_segments(
        self,
        segments: list[tuple[float, float]],
    ) -> list[tuple[float, float]]:
        """Merge overlapping or adjacent mute segments."""
        if not segments:
            return []

        sorted_segs = sorted(segments, key=lambda s: s[0])
        merged = [sorted_segs[0]]

        for start, end in sorted_segs[1:]:
            last_start, last_end = merged[-1]
            if start <= last_end:
                merged[-1] = (last_start, max(last_end, end))
            else:
                merged.append((start, end))

        return merged
