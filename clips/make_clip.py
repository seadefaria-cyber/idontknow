#!/usr/bin/env python3
"""
Post Agency — Clip Caption Overlay Tool v3

Style: Clean floating text with thin outline. Apple-native aesthetic.
Feels like it was made on an iPhone and posted directly.

- No background pill or bubble — text floats on the video
- Helvetica Neue Bold (Apple font)
- Auto-contrast: white text on dark footage, black text on light footage
- Thin clean outline for readability
- Apple system emojis via pilmoji

Usage:
    python3 make_clip.py <video_file> "Your caption here" [output_name]
"""

import subprocess
import sys
import os
import re
from PIL import Image, ImageDraw, ImageFont
from pilmoji import Pilmoji
from pilmoji.source import AppleEmojiSource


# Regex to match emoji characters (covers most common emoji ranges)
EMOJI_RE = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport & map
    "\U0001F1E0-\U0001F1FF"  # flags
    "\U0001F900-\U0001F9FF"  # supplemental symbols
    "\U0001FA00-\U0001FA6F"  # chess symbols
    "\U0001FA70-\U0001FAFF"  # symbols extended-A
    "\U00002702-\U000027B0"  # dingbats
    "\U0000FE00-\U0000FE0F"  # variation selectors
    "\U0000200D"             # zero width joiner
    "\U000023F0-\U000023FA"  # misc symbols
    "\U00002600-\U000026FF"  # misc symbols
    "\U0000270A-\U0000270D"  # misc symbols
    "]+",
    flags=re.UNICODE,
)


def strip_emojis(text):
    """Remove emoji characters from text, preserving spacing."""
    return EMOJI_RE.sub("", text).strip()


# ============================================================
# STYLE CONFIG
# ============================================================

# Output dimensions (9:16 TikTok/IG)
OUTPUT_WIDTH = 1080
OUTPUT_HEIGHT = 1920

# Text
FONT_SIZE = 36
LINE_SPACING = 6
OUTLINE_WIDTH = 2                   # Thin, clean outline

# Position within safe zone
# Safe zones: top 15%, bottom 25%, right 15% (TikTok/IG buttons)
POSITION_Y_PCT = 0.55               # Slightly higher to avoid bottom UI
MAX_WIDTH_PCT = 0.72                # Narrower to avoid right-side buttons

# ============================================================

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(SCRIPT_DIR, "raw")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "output")
SOUNDS_DIR = os.path.join(SCRIPT_DIR, "sounds")
FONTS_DIR = os.path.join(SCRIPT_DIR, "fonts")

# Montserrat Bold (THE TikTok caption font), then system fallbacks
# For .ttc files: (path, index) where index selects the weight
FONT_CANDIDATES = [
    (os.path.join(FONTS_DIR, "Montserrat-Bold.ttf"), None),  # Montserrat Bold (TikTok standard)
    ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", None),  # Arial Bold fallback
    ("/System/Library/Fonts/HelveticaNeue.ttc", 1),        # Helvetica Neue Bold
    ("/System/Library/Fonts/SFNS.ttf", None),              # SF Pro (Apple system)
]


def find_font():
    """Find the best Apple-native font available."""
    for path, index in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                if index is not None:
                    font = ImageFont.truetype(path, FONT_SIZE, index=index)
                else:
                    font = ImageFont.truetype(path, FONT_SIZE)
                return font, path, index
            except Exception:
                continue
    return ImageFont.load_default(), None, None


def detect_brightness(video_path):
    """Extract a frame and detect brightness at the caption area."""
    tmp_frame = "/tmp/post_brightness_check.jpg"
    cmd = [
        "ffmpeg", "-y", "-ss", "1", "-i", video_path,
        "-frames:v", "1", "-q:v", "2", tmp_frame,
    ]
    subprocess.run(cmd, capture_output=True, text=True)

    try:
        img = Image.open(tmp_frame).convert("RGB")
        w, h = img.size
        # Sample the band where the caption will sit
        y_start = max(0, int(h * (POSITION_Y_PCT - 0.06)))
        y_end = min(h, int(h * (POSITION_Y_PCT + 0.06)))
        region = img.crop((int(w * 0.15), y_start, int(w * 0.85), y_end))
        pixels = list(region.getdata())
        if not pixels:
            return 50
        # Perceived brightness (human eye weighting)
        brightness = sum(
            p[0] * 0.299 + p[1] * 0.587 + p[2] * 0.114 for p in pixels
        ) / len(pixels)
        return brightness
    except Exception:
        return 50  # Default dark → white text


def wrap_text(text, font, max_width):
    """Word-wrap text to fit within max_width pixels."""
    words = text.split()
    lines = []
    current_line = ""

    for word in words:
        test = f"{current_line} {word}".strip()
        bbox = font.getbbox(test)
        w = bbox[2] - bbox[0]
        if w <= max_width:
            current_line = test
        else:
            if current_line:
                lines.append(current_line)
            current_line = word

    if current_line:
        lines.append(current_line)

    return lines if lines else [text]


def create_overlay(caption, overlay_path, text_color, outline_color):
    """Create transparent PNG with floating outlined text + Apple emojis."""
    img = Image.new("RGBA", (OUTPUT_WIDTH, OUTPUT_HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Load font
    font, font_path, font_index = find_font()
    if font_path:
        name = os.path.basename(font_path)
        weight = "Bold" if font_index == 1 else "Regular" if font_index == 0 else ""
        print(f"Font: {name} {weight}".strip())

    # Wrap text
    max_text_px = int(OUTPUT_WIDTH * MAX_WIDTH_PCT)
    lines = wrap_text(caption, font, max_text_px)

    # Measure each line
    line_sizes = []
    for line in lines:
        bbox = font.getbbox(line)
        w = bbox[2] - bbox[0]
        h = max(bbox[3] - bbox[1], FONT_SIZE + 4)
        line_sizes.append((w, h))

    # Calculate text block position
    text_block_h = sum(s[1] for s in line_sizes) + LINE_SPACING * (len(lines) - 1)
    start_y = int(OUTPUT_HEIGHT * POSITION_Y_PCT) - text_block_h // 2

    outline_rgba = outline_color + (255,) if len(outline_color) == 3 else outline_color

    # Pass 1: Draw outline (text at offsets, emojis stripped to avoid
    # ugly placeholder glyphs bleeding through behind real Apple emojis)
    y = start_y
    for i, line in enumerate(lines):
        lw, lh = line_sizes[i]
        x = (OUTPUT_WIDTH - lw) // 2
        line_no_emoji = strip_emojis(line)

        for dx in range(-OUTLINE_WIDTH, OUTLINE_WIDTH + 1):
            for dy in range(-OUTLINE_WIDTH, OUTLINE_WIDTH + 1):
                if dx == 0 and dy == 0:
                    continue
                # Circular mask for smoother outline
                if dx * dx + dy * dy > OUTLINE_WIDTH * OUTLINE_WIDTH + 1:
                    continue
                draw.text((x + dx, y + dy), line_no_emoji, font=font, fill=outline_rgba)

        y += lh + LINE_SPACING

    # Pass 2: Draw main text with Apple emojis on top
    y = start_y
    with Pilmoji(img, source=AppleEmojiSource) as pilmoji:
        for i, line in enumerate(lines):
            lw, lh = line_sizes[i]
            x = (OUTPUT_WIDTH - lw) // 2
            pilmoji.text((x, y), line, font=font, fill=text_color[:3])
            y += lh + LINE_SPACING

    img.save(overlay_path)
    return overlay_path


def get_video_dimensions(video_path):
    """Get original video width and height."""
    cmd = [
        "ffprobe", "-v", "quiet",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-of", "csv=p=0",
        video_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    for line in result.stdout.strip().split("\n"):
        parts = line.strip().split(",")
        if len(parts) == 2:
            try:
                return int(parts[0]), int(parts[1])
            except ValueError:
                continue
    return None, None


def make_clip(video_path, caption, output_name=None, sound_path=None,
              sound_volume=0.5, text_style="auto", subtitle_path=None):
    """
    Create a captioned clip with black bars (no stretching) and optional sound.

    text_style: 'auto' (detect brightness), 'light' (white text), 'dark' (black text)
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Resolve video path
    if not os.path.isabs(video_path):
        if os.path.exists(os.path.join(SCRIPT_DIR, video_path)):
            video_path = os.path.join(SCRIPT_DIR, video_path)
        elif os.path.exists(os.path.join(RAW_DIR, video_path)):
            video_path = os.path.join(RAW_DIR, video_path)

    if not os.path.exists(video_path):
        print(f"Error: Video not found: {video_path}")
        return None

    # Resolve sound path
    if sound_path and not os.path.isabs(sound_path):
        if os.path.exists(os.path.join(SOUNDS_DIR, sound_path)):
            sound_path = os.path.join(SOUNDS_DIR, sound_path)
        elif os.path.exists(os.path.join(SCRIPT_DIR, sound_path)):
            sound_path = os.path.join(SCRIPT_DIR, sound_path)

    # Determine text colors
    if text_style == "auto":
        brightness = detect_brightness(video_path)
        if brightness < 120:
            text_color = (255, 255, 255)    # White text
            outline_color = (0, 0, 0)       # Black outline
            style_label = "white text, black outline"
        else:
            text_color = (0, 0, 0)          # Black text
            outline_color = (255, 255, 255) # White outline
            style_label = "black text, white outline"
        print(f"Brightness: {brightness:.0f}/255 → {style_label}")
    elif text_style == "light":
        text_color = (255, 255, 255)
        outline_color = (0, 0, 0)
    else:
        text_color = (0, 0, 0)
        outline_color = (255, 255, 255)

    # Generate overlay PNG
    overlay_path = "/tmp/post_caption_overlay.png"
    create_overlay(caption, overlay_path, text_color, outline_color)

    # Output path
    if output_name is None:
        base = os.path.splitext(os.path.basename(video_path))[0]
        output_name = base

    output_path = os.path.join(OUTPUT_DIR, f"{output_name}_captioned.mp4")

    # Get original video dimensions
    orig_w, orig_h = get_video_dimensions(video_path)
    if not orig_w:
        orig_w, orig_h = 1080, 1920

    # Calculate scaling to fit within 1080x1920 without stretching
    scale_w = OUTPUT_WIDTH / orig_w
    scale_h = OUTPUT_HEIGHT / orig_h
    scale = min(scale_w, scale_h)
    new_w = int(orig_w * scale)
    new_h = int(orig_h * scale)
    new_w = new_w - (new_w % 2)
    new_h = new_h - (new_h % 2)

    # Build filter: black background + centered video + caption overlay
    filter_complex = (
        f"color=black:{OUTPUT_WIDTH}x{OUTPUT_HEIGHT}:d=999[bg];"
        f"[0:v]scale={new_w}:{new_h}[vid];"
        f"[bg][vid]overlay=(W-w)/2:(H-h)/2:shortest=1[base];"
        f"[base][1:v]overlay=0:0[captioned]"
    )

    # Add speech subtitles if provided (ASS format)
    if subtitle_path and os.path.exists(subtitle_path):
        # Escape path for ffmpeg filter
        escaped_path = subtitle_path.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")
        filter_complex += f";[captioned]ass='{escaped_path}'[out]"
    else:
        filter_complex += ";[captioned]copy[out]"

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", overlay_path,
    ]

    # Add sound input if provided
    if sound_path and os.path.exists(sound_path):
        cmd.extend(["-i", sound_path])
        filter_complex += (
            f";[0:a]volume=1.0[orig];"
            f"[2:a]volume={sound_volume}[music];"
            f"[orig][music]amix=inputs=2:duration=first:dropout_transition=2[aout]"
        )
        audio_map = ["-map", "[aout]"]
    else:
        audio_map = ["-map", "0:a?"]

    cmd.extend([
        "-filter_complex", filter_complex,
        "-map", "[out]",
    ])
    cmd.extend(audio_map)
    cmd.extend([
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        "-shortest",
        output_path,
    ])

    print(f"Processing: {os.path.basename(video_path)}")
    print(f"Caption: \"{caption}\"")
    if sound_path:
        print(f"Sound: {os.path.basename(sound_path)} at {int(sound_volume*100)}%")
    print(f"Output: {output_path}")
    print()

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"FFmpeg error:\n{result.stderr[-800:]}")
        return None

    print(f"Done! Clip saved to: {output_path}")
    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 make_clip.py <video_file> \"Your caption\" [output_name]")
        print()
        print("Examples:")
        print('  python3 make_clip.py raw/concert.mp4 "There\'s no way this kid did this 💀"')
        sys.exit(1)

    video = sys.argv[1]
    caption = sys.argv[2]
    output = sys.argv[3] if len(sys.argv) > 3 else None
    make_clip(video, caption, output)
