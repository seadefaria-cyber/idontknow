from pathlib import Path
from typing import Any

import structlog

logger = structlog.get_logger()

# ASS color format is &HBBGGRR& (BGR, not RGB)
WHITE = "&H00FFFFFF&"
BLACK = "&H00000000&"
YELLOW_HIGHLIGHT = "&H0000FFFF&"  # Yellow in BGR
TRANSPARENT = "&H00000000&"


def generate_ass_captions(
    words: list[dict[str, Any]],
    output_path: Path,
    clip_start_time: float = 0.0,
) -> Path:
    """Generate an ASS subtitle file with word-by-word highlight animation.

    Style: Montserrat Bold, white text with black stroke, yellow highlight
    on the current word. This matches top-performing TikTok caption styles.

    Args:
        words: List of word dicts from WhisperX with 'word', 'start', 'end' keys.
        output_path: Path to write the .ass file.
        clip_start_time: Start time of the clip in the source video (for offset).

    Returns:
        Path to the generated .ass file.
    """
    header = _build_header()
    events = _build_events(words, clip_start_time)

    content = header + "\n[Events]\n"
    content += "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    content += events

    output_path.write_text(content, encoding="utf-8")

    logger.info(
        "captions_generated",
        word_count=len(words),
        output=str(output_path),
    )

    return output_path


def _build_header() -> str:
    """Build the ASS file header with style definitions."""
    return f"""[Script Info]
Title: Viral Clipper Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Montserrat Bold,72,{WHITE},{YELLOW_HIGHLIGHT},{BLACK},{TRANSPARENT},-1,0,0,0,100,100,0,0,1,3,0,2,40,40,200,1
Style: Highlight,Montserrat Bold,72,{YELLOW_HIGHLIGHT},{WHITE},{BLACK},{TRANSPARENT},-1,0,0,0,100,100,0,0,1,3,0,2,40,40,200,1
"""


def _build_events(
    words: list[dict[str, Any]],
    clip_start_time: float,
) -> str:
    """Build ASS dialogue events with word-by-word highlighting.

    Groups words into lines of ~4-6 words, then creates events where
    each word is highlighted in sequence while the full line is displayed.
    """
    if not words:
        return ""

    # Group words into display lines (4-6 words per line)
    lines = _group_words_into_lines(words)
    events = []

    for line_words in lines:
        if not line_words:
            continue

        line_start = line_words[0].get("start", 0) - clip_start_time
        line_end = line_words[-1].get("end", 0) - clip_start_time

        if line_start < 0:
            line_start = 0

        # Create a single event per line with override tags for word highlighting
        for i, word_info in enumerate(line_words):
            word_start = word_info.get("start", 0) - clip_start_time
            word_end = word_info.get("end", 0) - clip_start_time

            if word_start < 0:
                word_start = 0

            # Build the full line text with the current word highlighted
            text_parts = []
            for j, w in enumerate(line_words):
                word_text = w.get("word", "").strip()
                if not word_text:
                    continue
                if j == i:
                    # Highlight current word with override tag
                    text_parts.append(
                        f"{{\\c{YELLOW_HIGHLIGHT}\\b1}}{word_text}{{\\c{WHITE}\\b1}}"
                    )
                else:
                    text_parts.append(word_text)

            full_text = " ".join(text_parts)

            start_ts = _format_timestamp(word_start)
            end_ts = _format_timestamp(word_end)

            events.append(
                f"Dialogue: 0,{start_ts},{end_ts},Default,,0,0,0,,{full_text}"
            )

    return "\n".join(events) + "\n"


def _group_words_into_lines(
    words: list[dict[str, Any]],
    max_words_per_line: int = 5,
) -> list[list[dict[str, Any]]]:
    """Group words into display lines of manageable length."""
    lines = []
    current_line: list[dict[str, Any]] = []

    for word in words:
        current_line.append(word)
        if len(current_line) >= max_words_per_line:
            lines.append(current_line)
            current_line = []

    if current_line:
        lines.append(current_line)

    return lines


def _format_timestamp(seconds: float) -> str:
    """Convert seconds to ASS timestamp format (H:MM:SS.CC)."""
    if seconds < 0:
        seconds = 0
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centiseconds = int((seconds % 1) * 100)
    return f"{hours}:{minutes:02d}:{secs:02d}.{centiseconds:02d}"
