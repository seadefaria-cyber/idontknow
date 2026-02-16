"""Synchronous pipeline orchestrator — no Redis required.

Processes a video file end-to-end:
  transcribe → detect moments → generate hooks → extract clips → burn captions → crop to 9:16
"""
from pathlib import Path

import structlog

from src.config import Settings

logger = structlog.get_logger()


class PipelineService:
    """Runs the full clipping pipeline synchronously on a single video."""

    def __init__(self, settings: Settings):
        self.settings = settings

    def process_video(self, video_path: Path, output_dir: Path) -> list[Path]:
        """Process a single video through the full pipeline.

        Args:
            video_path: Path to source video file.
            output_dir: Directory to write finished clips to.

        Returns:
            List of paths to generated clip files.
        """
        output_dir.mkdir(parents=True, exist_ok=True)

        # Step 1: Transcribe
        print("  [1/5] Transcribing audio...")
        transcript = self._transcribe(video_path)
        segments = transcript.get("segments", [])
        if not segments:
            print("  No speech detected in video. Skipping.")
            return []

        word_count = sum(len(s.get("words", [])) for s in segments)
        print(f"  Transcription complete: {len(segments)} segments, {word_count} words")

        # Step 2: Detect viral moments
        print("  [2/5] Detecting viral moments...")
        moments = self._detect_moments(transcript)
        if not moments:
            print("  No viral moments detected. Skipping.")
            return []
        print(f"  Found {len(moments)} moment(s)")

        # Step 3: Generate hooks for each moment
        print("  [3/5] Generating hooks...")
        hooks_by_moment = {}
        for moment in moments:
            hooks = self._generate_hooks(moment, transcript)
            hooks_by_moment[id(moment)] = hooks
            print(f"    Moment [{moment.start_time:.1f}s-{moment.end_time:.1f}s] "
                  f"score={moment.viral_score}: {len(hooks)} hook(s)")

        # Step 4-5: Extract, caption, and crop each clip
        print("  [4/5] Extracting and processing clips...")
        from src.clipper.ffmpeg_ops import FFmpegService
        ffmpeg = FFmpegService(self.settings)

        finished_clips = []
        clip_num = 0

        for moment in moments:
            hooks = hooks_by_moment.get(id(moment), [])
            if not hooks:
                continue

            # Use the best hook (first one)
            hook = hooks[0]
            clip_num += 1

            try:
                clip_path = self._process_clip(
                    ffmpeg=ffmpeg,
                    video_path=video_path,
                    output_dir=output_dir,
                    clip_num=clip_num,
                    moment=moment,
                    hook=hook,
                    transcript=transcript,
                )
                if clip_path:
                    finished_clips.append(clip_path)
                    print(f"    Clip {clip_num}: {clip_path.name} "
                          f"[{moment.start_time:.1f}s-{moment.end_time:.1f}s]")
            except Exception as e:
                print(f"    Clip {clip_num} FAILED: {e}")
                logger.exception("clip_processing_failed", clip_num=clip_num)

        print(f"  [5/5] Done — {len(finished_clips)} clip(s) ready")
        return finished_clips

    def _transcribe(self, video_path: Path) -> dict:
        """Transcribe video using WhisperX."""
        from src.ingestion.transcriber import WhisperXTranscriber
        transcriber = WhisperXTranscriber(self.settings)
        return transcriber.transcribe(video_path)

    def _detect_moments(self, transcript: dict) -> list:
        """Detect viral moments using Claude."""
        from src.ai.moment_detector import MomentDetector
        detector = MomentDetector(self.settings)
        return detector.detect_moments(transcript, max_moments=10)

    def _generate_hooks(self, moment, transcript: dict) -> list:
        """Generate hooks for a moment using Claude."""
        from src.ai.hook_writer import HookWriter
        writer = HookWriter(self.settings)
        return writer.generate_hooks(
            start_time=moment.start_time,
            end_time=moment.end_time,
            transcript=transcript,
            num_variations=3,
        )

    def _process_clip(
        self,
        ffmpeg: "FFmpegService",
        video_path: Path,
        output_dir: Path,
        clip_num: int,
        moment,
        hook,
        transcript: dict,
    ) -> Path | None:
        """Extract, caption, and crop a single clip.

        Pipeline: extract → burn captions → add hook overlay → crop to 9:16
        """
        temp_dir = output_dir / ".temp"
        temp_dir.mkdir(exist_ok=True)

        prefix = f"clip_{clip_num:03d}"

        # Step A: Extract raw clip from source
        raw_path = temp_dir / f"{prefix}_raw.mp4"
        ffmpeg.extract_clip(
            source_path=video_path,
            output_path=raw_path,
            start_time=moment.start_time,
            end_time=moment.end_time,
        )

        # Step B: Generate and burn captions
        words = self._get_words_for_range(transcript, moment.start_time, moment.end_time)
        current_input = raw_path

        if words:
            from src.clipper.captioner import generate_ass_captions
            ass_path = temp_dir / f"{prefix}.ass"
            generate_ass_captions(
                words=words,
                output_path=ass_path,
                clip_start_time=moment.start_time,
            )

            captioned_path = temp_dir / f"{prefix}_captioned.mp4"
            ffmpeg.burn_captions(
                input_path=current_input,
                ass_path=ass_path,
                output_path=captioned_path,
            )
            current_input = captioned_path

        # Step C: Add hook text overlay
        if hook.hook_text:
            hooked_path = temp_dir / f"{prefix}_hooked.mp4"
            ffmpeg.add_hook_overlay(
                input_path=current_input,
                output_path=hooked_path,
                hook_text=hook.hook_text,
                duration=3.0,
            )
            current_input = hooked_path

        # Step D: Crop to vertical 9:16
        final_path = output_dir / f"{prefix}.mp4"
        ffmpeg.crop_to_vertical(
            input_path=current_input,
            output_path=final_path,
        )

        # Clean up temp files
        for f in temp_dir.iterdir():
            if f.name.startswith(prefix):
                f.unlink(missing_ok=True)

        if final_path.exists() and final_path.stat().st_size > 0:
            return final_path
        return None

    def _get_words_for_range(
        self,
        transcript: dict,
        start_time: float,
        end_time: float,
    ) -> list[dict]:
        """Extract word-level timestamps for a time range from the transcript."""
        words = []
        for segment in transcript.get("segments", []):
            for word in segment.get("words", []):
                w_start = word.get("start", 0)
                w_end = word.get("end", 0)
                if w_end >= start_time and w_start <= end_time:
                    words.append(word)
        return words
