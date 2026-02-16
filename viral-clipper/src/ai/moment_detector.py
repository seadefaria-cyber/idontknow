from typing import Any

import structlog
from pydantic import BaseModel, Field

from src.ai.claude_cli import call_claude
from src.ai.prompts import MOMENT_DETECTION_SYSTEM, MOMENT_DETECTION_USER
from src.config import Settings
from src.exceptions import AIDetectionError

logger = structlog.get_logger()


class ViralMoment(BaseModel):
    """A single viral-worthy moment detected in a transcript."""

    start_time: float = Field(description="Start timestamp in seconds")
    end_time: float = Field(description="End timestamp in seconds")
    hook_text: str = Field(description="Scroll-stopping hook text (max 10 words)")
    caption_text: str = Field(description="Post caption with hashtags")
    viral_score: int = Field(ge=0, le=100, description="Viral potential score")
    reasoning: str = Field(description="Why this moment is clip-worthy")


class MomentAnalysis(BaseModel):
    """Complete analysis result from moment detection."""

    moments: list[ViralMoment] = Field(description="Detected viral moments")


class MomentDetector:
    """Detects viral-worthy moments in transcripts using Claude."""

    def __init__(self, settings: Settings):
        self.settings = settings

    def detect_moments(
        self,
        transcript: dict[str, Any],
        max_moments: int = 10,
    ) -> list[ViralMoment]:
        """Analyze a transcript and return ranked viral moments.

        Uses Claude with structured outputs for guaranteed valid responses.
        Sends transcript in sliding windows to manage token costs.

        Args:
            transcript: WhisperX transcript dict with segments.
            max_moments: Maximum number of moments to detect.

        Returns:
            List of ViralMoment sorted by viral_score descending.
        """
        transcript_text = self._format_transcript(transcript)

        # Use sliding window for long transcripts (>8k tokens ~= 32k chars)
        if len(transcript_text) > 32000:
            return self._detect_with_windows(transcript_text, max_moments)

        return self._detect_single(transcript_text, max_moments)

    def _detect_single(
        self,
        transcript_text: str,
        max_moments: int,
    ) -> list[ViralMoment]:
        """Detect moments from a single transcript chunk."""
        user_prompt = MOMENT_DETECTION_USER.format(
            max_moments=max_moments,
            transcript=transcript_text,
        )

        try:
            response_text = call_claude(
                system_prompt=MOMENT_DETECTION_SYSTEM,
                user_prompt=user_prompt,
            )

            analysis = MomentAnalysis.model_validate_json(response_text)

            moments = sorted(
                analysis.moments,
                key=lambda m: m.viral_score,
                reverse=True,
            )

            logger.info(
                "moments_detected",
                count=len(moments),
                top_score=moments[0].viral_score if moments else 0,
            )

            return moments

        except Exception as e:
            raise AIDetectionError(f"Moment detection failed: {e}") from e

    def _detect_with_windows(
        self,
        transcript_text: str,
        max_moments: int,
    ) -> list[ViralMoment]:
        """Detect moments using sliding windows for long transcripts.

        Splits transcript into overlapping windows of ~6000 words,
        detects moments in each window, then deduplicates and ranks.
        """
        window_size = 24000  # chars (~6000 words)
        overlap = 4000  # chars overlap between windows
        all_moments: list[ViralMoment] = []

        pos = 0
        window_num = 0
        while pos < len(transcript_text):
            window = transcript_text[pos : pos + window_size]
            window_num += 1

            logger.info(
                "processing_window",
                window=window_num,
                start_char=pos,
                length=len(window),
            )

            moments = self._detect_single(window, max_moments=max_moments)
            all_moments.extend(moments)

            pos += window_size - overlap

        # Deduplicate moments with overlapping timestamps
        deduped = self._deduplicate_moments(all_moments)

        # Return top N by score
        return sorted(deduped, key=lambda m: m.viral_score, reverse=True)[
            :max_moments
        ]

    def _deduplicate_moments(
        self,
        moments: list[ViralMoment],
    ) -> list[ViralMoment]:
        """Remove duplicate moments that overlap significantly."""
        if not moments:
            return []

        sorted_moments = sorted(moments, key=lambda m: m.start_time)
        result: list[ViralMoment] = [sorted_moments[0]]

        for moment in sorted_moments[1:]:
            last = result[-1]
            # If overlap is more than 50% of the shorter clip, it's a duplicate
            overlap_start = max(last.start_time, moment.start_time)
            overlap_end = min(last.end_time, moment.end_time)
            overlap_duration = max(0, overlap_end - overlap_start)

            shorter_duration = min(
                last.end_time - last.start_time,
                moment.end_time - moment.start_time,
            )

            if shorter_duration > 0 and overlap_duration / shorter_duration > 0.5:
                # Keep the one with higher viral score
                if moment.viral_score > last.viral_score:
                    result[-1] = moment
            else:
                result.append(moment)

        return result

    def _format_transcript(self, transcript: dict[str, Any]) -> str:
        """Format a WhisperX transcript dict into readable text with timestamps."""
        lines = []
        for segment in transcript.get("segments", []):
            start = segment.get("start", 0)
            end = segment.get("end", 0)
            text = segment.get("text", "").strip()
            if text:
                lines.append(f"[{start:.1f}s - {end:.1f}s] {text}")
        return "\n".join(lines)
