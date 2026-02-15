from pathlib import Path

import dramatiq
import structlog

from src.clipper.captioner import generate_ass_captions
from src.clipper.cropper import VideoCropper
from src.clipper.ffmpeg_ops import FFmpegService
from src.clipper.profanity import ProfanityFilter
from src.config import get_settings
from src.database import get_db_session
from src.models.client import Source
from src.models.content import ClipMoment, GeneratedClip, MomentStatus

logger = structlog.get_logger()


@dramatiq.actor(max_retries=2, min_backoff=30_000, max_backoff=300_000)
def generate_clip(moment_id: int) -> None:
    """Generate a finished clip from a detected moment.

    Pipeline:
    1. Extract clip at timestamps
    2. Crop to vertical 9:16
    3. Generate ASS captions with word-by-word highlighting
    4. Burn captions into video
    5. Add hook text overlay
    6. Detect and mute profanity
    7. Validate quality
    8. Save GeneratedClip record
    """
    settings = get_settings()
    ffmpeg = FFmpegService(settings)
    cropper = VideoCropper(ffmpeg)
    profanity_filter = ProfanityFilter(ffmpeg)

    with get_db_session() as session:
        moment = session.query(ClipMoment).get(moment_id)
        if moment is None:
            logger.error("moment_not_found", moment_id=moment_id)
            return

        source = session.query(Source).get(moment.source_id)
        if source is None:
            logger.error("source_not_found", source_id=moment.source_id)
            return

        moment.status = MomentStatus.GENERATING
        session.flush()

        source_path = Path(source.file_path)
        if not source_path.exists():
            logger.error("source_file_missing", path=str(source_path))
            moment.status = MomentStatus.FAILED
            return

        clip_dir = settings.get_clip_storage_path(moment.client_id)
        temp_dir = settings.get_temp_path()
        clip_name = f"clip_{moment.id}"

        try:
            # Step 1: Extract clip at timestamps
            raw_clip = temp_dir / f"{clip_name}_raw.mp4"
            ffmpeg.extract_clip(source_path, raw_clip, moment.start_time, moment.end_time)

            # Step 2: Crop to vertical
            vertical_clip = temp_dir / f"{clip_name}_vertical.mp4"
            cropper.crop_to_vertical(raw_clip, vertical_clip)

            # Step 3: Generate ASS captions from word timestamps
            words = _extract_words_for_range(
                source.transcript_json, moment.start_time, moment.end_time
            )
            ass_path = temp_dir / f"{clip_name}.ass"
            generate_ass_captions(words, ass_path, clip_start_time=moment.start_time)

            # Step 4: Burn captions
            captioned_clip = temp_dir / f"{clip_name}_captioned.mp4"
            ffmpeg.burn_captions(vertical_clip, ass_path, captioned_clip)

            # Step 5: Add hook overlay
            hooked_clip = temp_dir / f"{clip_name}_hooked.mp4"
            ffmpeg.add_hook_overlay(captioned_clip, hooked_clip, moment.hook_text)

            # Step 6: Mute profanity
            final_clip = clip_dir / f"{clip_name}_final.mp4"
            # Adjust word timestamps relative to clip start
            clip_words = [
                {**w, "start": w["start"] - moment.start_time, "end": w["end"] - moment.start_time}
                for w in words
            ]
            profanity_filter.mute_profanity(hooked_clip, final_clip, clip_words)

            # Step 7: Validate quality
            validation = ffmpeg.validate_clip(final_clip)
            quality_passed = validation["passed"]

            if not quality_passed:
                logger.warning(
                    "clip_quality_issues",
                    moment_id=moment_id,
                    issues=validation["issues"],
                )

            # Step 8: Save GeneratedClip record
            generated = GeneratedClip(
                moment_id=moment.id,
                client_id=moment.client_id,
                file_path=str(final_clip),
                duration=validation.get("duration", moment.end_time - moment.start_time),
                caption_style="word_highlight_yellow",
                hook_type="text_overlay",
                quality_check_passed=quality_passed,
            )
            session.add(generated)
            moment.status = MomentStatus.READY

            logger.info(
                "clip_generated",
                moment_id=moment_id,
                output=str(final_clip),
                quality_passed=quality_passed,
            )

            # Cleanup temp files
            for temp_file in [raw_clip, vertical_clip, captioned_clip, hooked_clip, ass_path]:
                if temp_file.exists():
                    temp_file.unlink()

        except Exception as e:
            logger.error("clip_generation_failed", moment_id=moment_id, error=str(e))
            moment.status = MomentStatus.FAILED
            raise


def _extract_words_for_range(
    transcript: dict,
    start_time: float,
    end_time: float,
) -> list[dict]:
    """Extract word-level timestamps from transcript for a time range."""
    words = []
    for segment in transcript.get("segments", []):
        for word in segment.get("words", []):
            w_start = word.get("start", 0)
            w_end = word.get("end", 0)
            if w_end >= start_time and w_start <= end_time:
                words.append(word)
    return words
