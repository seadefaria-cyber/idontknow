from typing import Any

import anthropic
import structlog
from pydantic import BaseModel, Field

from src.ai.prompts import HOOK_GENERATION_SYSTEM, HOOK_GENERATION_USER
from src.config import Settings
from src.exceptions import AIDetectionError

logger = structlog.get_logger()


class HookVariation(BaseModel):
    """A single hook variation for a clip."""

    hook_text: str = Field(description="Text overlay for first 2-3 seconds (max 10 words)")
    post_caption: str = Field(description="Full post caption with hashtags")
    hook_style: str = Field(description="Hook pattern used (question/bold_claim/etc)")


class HookSet(BaseModel):
    """Set of hook variations for a clip moment."""

    hooks: list[HookVariation] = Field(description="Hook variations")


class HookWriter:
    """Generates scroll-stopping hooks and captions using Claude."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = anthropic.Anthropic(api_key=settings.claude_api_key)

    def generate_hooks(
        self,
        start_time: float,
        end_time: float,
        transcript: dict[str, Any],
        num_variations: int = 3,
    ) -> list[HookVariation]:
        """Generate hook variations for a clip moment.

        Args:
            start_time: Clip start timestamp in seconds.
            end_time: Clip end timestamp in seconds.
            transcript: Full WhisperX transcript dict.
            num_variations: Number of hook variations to generate.

        Returns:
            List of HookVariation with different hook styles.
        """
        excerpt = self._extract_excerpt(transcript, start_time, end_time)

        user_prompt = HOOK_GENERATION_USER.format(
            num_variations=num_variations,
            start_time=start_time,
            end_time=end_time,
            transcript_excerpt=excerpt,
        )

        try:
            response = self.client.messages.create(
                model=self.settings.claude_model_bulk,
                max_tokens=2000,
                system=HOOK_GENERATION_SYSTEM,
                messages=[{"role": "user", "content": user_prompt}],
            )

            response_text = response.content[0].text
            hook_set = HookSet.model_validate_json(response_text)

            logger.info(
                "hooks_generated",
                count=len(hook_set.hooks),
                start_time=start_time,
                end_time=end_time,
            )

            return hook_set.hooks

        except anthropic.APIError as e:
            raise AIDetectionError(f"Claude API error during hook generation: {e}") from e
        except Exception as e:
            raise AIDetectionError(f"Hook generation failed: {e}") from e

    def _extract_excerpt(
        self,
        transcript: dict[str, Any],
        start_time: float,
        end_time: float,
    ) -> str:
        """Extract the transcript text for a specific time range."""
        lines = []
        for segment in transcript.get("segments", []):
            seg_start = segment.get("start", 0)
            seg_end = segment.get("end", 0)
            # Include segments that overlap with the clip range
            if seg_end >= start_time and seg_start <= end_time:
                text = segment.get("text", "").strip()
                if text:
                    lines.append(f"[{seg_start:.1f}s] {text}")
        return "\n".join(lines)
