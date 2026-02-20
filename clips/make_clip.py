#!/usr/bin/env python3
"""
Post Agency — Clip Pipeline v4

Full pipeline: Download → Trim → Caption → Sound → Output

Style: Clean floating text with thin outline. Apple-native aesthetic.
Feels like it was made on an iPhone and posted directly.

Usage:
    # Basic
    python3 make_clip.py raw/concert.mp4 "Caption here"

    # With trimming
    python3 make_clip.py raw/concert.mp4 "Caption" --start 0:32 --end 0:47

    # From URL with auto sound
    python3 make_clip.py "https://youtube.com/..." "Caption" --start 0:32 --end 0:47 --sound auto

    # Pick a specific sound by name
    python3 make_clip.py raw/clip.mp4 "Caption" --sound "Nettspend - Dazed.mp3"
"""

import argparse
import subprocess
import sys
import os
import re
import random
from PIL import Image, ImageDraw, ImageFont
from pilmoji import Pilmoji
from pilmoji.source import AppleEmojiSource


# Regex to match emoji characters (for outline stripping)
EMOJI_RE = re.compile(
    "["
    "\U0001F600-\U0001F64F"
    "\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF"
    "\U0001F1E0-\U0001F1FF"
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "\U0001F900-\U0001F9FF"
    "\U0001FA00-\U0001FA6F"
    "\U0001FA70-\U0001FAFF"
    "\U00002600-\U000027BF"
    "\u200d\ufe0f"
    "]+", flags=re.UNICODE
)


# ============================================================
# STYLE CONFIG
# ============================================================

# Output dimensions (9:16 TikTok/IG)
OUTPUT_WIDTH = 1080
OUTPUT_HEIGHT = 1920

# Text
FONT_SIZE = 38
LINE_SPACING = 8
OUTLINE_WIDTH = 5                   # Thick TikTok-native stroke

# Position within safe zone
# Safe zones: top 15%, bottom 25%, right 15% (TikTok/IG buttons)
POSITION_Y_PCT = 0.55               # Slightly higher to avoid bottom UI
MAX_WIDTH_PCT = 0.62                # Narrow — keeps text centered, clear of side buttons

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


def create_overlay(caption, overlay_path, text_color, outline_color, use_pill=False):
    """Create transparent PNG with text overlay + Apple emojis.

    use_pill: True for TikTok-style black rounded rectangle behind white text.
    """
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

    if use_pill:
        # TikTok-style: solid black rounded rectangle behind white text
        pad_x, pad_y = 24, 14
        pill_radius = 8
        max_line_w = max(s[0] for s in line_sizes)
        pill_w = max_line_w + pad_x * 2
        pill_h = text_block_h + pad_y * 2
        pill_x = (OUTPUT_WIDTH - pill_w) // 2
        pill_y = start_y - pad_y
        draw.rounded_rectangle(
            [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
            radius=pill_radius,
            fill=(0, 0, 0, 210),
        )
        # Draw text (white on black pill)
        y = start_y
        with Pilmoji(img, source=AppleEmojiSource) as pilmoji:
            for i, line in enumerate(lines):
                lw, lh = line_sizes[i]
                x = (OUTPUT_WIDTH - lw) // 2
                pilmoji.text((x, y), line, font=font, fill=(255, 255, 255))
                y += lh + LINE_SPACING
        print("Style: TikTok pill (black bg, white text)")
    else:
        # Floating text with outline
        outline_rgba = outline_color + (255,) if len(outline_color) == 3 else outline_color

        # Pass 1: Draw outline (strip emojis — PIL renders them as boxes)
        y = start_y
        for i, line in enumerate(lines):
            lw, lh = line_sizes[i]
            x = (OUTPUT_WIDTH - lw) // 2
            line_no_emoji = EMOJI_RE.sub("", line)
            for dx in range(-OUTLINE_WIDTH, OUTLINE_WIDTH + 1):
                for dy in range(-OUTLINE_WIDTH, OUTLINE_WIDTH + 1):
                    if dx == 0 and dy == 0:
                        continue
                    if dx * dx + dy * dy > OUTLINE_WIDTH * OUTLINE_WIDTH + 1:
                        continue
                    draw.text((x + dx, y + dy), line_no_emoji, font=font, fill=outline_rgba)
            y += lh + LINE_SPACING

        # Pass 2: Draw main text with Apple emojis
        y = start_y
        with Pilmoji(img, source=AppleEmojiSource) as pilmoji:
            for i, line in enumerate(lines):
                lw, lh = line_sizes[i]
                x = (OUTPUT_WIDTH - lw) // 2
                pilmoji.text((x, y), line, font=font, fill=text_color[:3])
                y += lh + LINE_SPACING
        print(f"Style: floating text")

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


def get_video_fps(video_path):
    """Get video frame rate as a float."""
    cmd = [
        "ffprobe", "-v", "quiet",
        "-select_streams", "v:0",
        "-show_entries", "stream=r_frame_rate",
        "-of", "csv=p=0",
        video_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    rate_str = result.stdout.strip().split("\n")[0].strip()
    if "/" in rate_str:
        num, den = rate_str.split("/")
        return float(num) / float(den)
    try:
        return float(rate_str)
    except ValueError:
        return 30.0


# ============================================================
# PIPELINE: Download → Trim → Sound Selection
# ============================================================

def download_video(url):
    """Download video from URL using yt-dlp to clips/raw/."""
    os.makedirs(RAW_DIR, exist_ok=True)
    output_template = os.path.join(RAW_DIR, "%(title)s.%(ext)s")
    cmd = [
        "yt-dlp",
        "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--merge-output-format", "mp4",
        "-o", output_template,
        "--print", "after_move:filepath",
        url,
    ]
    print(f"Downloading: {url}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Download error:\n{result.stderr[-500:]}")
        return None
    filepath = result.stdout.strip().split("\n")[-1]
    print(f"Saved to: {filepath}")
    return filepath


def trim_video(video_path, start=None, end=None):
    """Trim video to timestamps. Returns (path, was_trimmed)."""
    if not start and not end:
        return video_path, False

    trimmed = "/tmp/post_trimmed_clip.mp4"
    cmd = ["ffmpeg", "-y", "-i", video_path]
    if start:
        cmd.extend(["-ss", start])
    if end:
        cmd.extend(["-to", end])
    cmd.extend([
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k",
        trimmed,
    ])

    print(f"Trimming: {start or 'start'} → {end or 'end'}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Trim error:\n{result.stderr[-500:]}")
        return video_path, False
    return trimmed, True


def pick_sound(sound_input):
    """Resolve sound: 'auto' picks random from library, otherwise resolve path."""
    if sound_input == "auto":
        if not os.path.isdir(SOUNDS_DIR):
            print("No sounds directory found")
            return None
        sounds = [f for f in os.listdir(SOUNDS_DIR)
                  if f.endswith((".mp3", ".m4a", ".wav"))]
        if not sounds:
            print("No sounds found in library")
            return None
        choice = random.choice(sounds)
        print(f"Auto-picked sound: {choice}")
        return os.path.join(SOUNDS_DIR, choice)

    # Try direct path, then sounds dir, then with .mp3 extension
    for candidate in [sound_input,
                      os.path.join(SOUNDS_DIR, sound_input),
                      os.path.join(SOUNDS_DIR, sound_input + ".mp3")]:
        if os.path.exists(candidate):
            return candidate
    print(f"Sound not found: {sound_input}")
    return None


def list_sounds():
    """Print available sounds in the library."""
    if not os.path.isdir(SOUNDS_DIR):
        print("No sounds directory")
        return
    sounds = sorted(f for f in os.listdir(SOUNDS_DIR)
                    if f.endswith((".mp3", ".m4a", ".wav")))
    print(f"\nAvailable sounds ({len(sounds)}):")
    for s in sounds:
        print(f"  {s}")
    print()


# ============================================================
# CORE: Caption overlay + composite
# ============================================================

def make_clip(video_path, caption, output_name=None, sound_path=None,
              sound_volume=0.5, text_style="auto", subtitle_path=None,
              text_duration=None, use_pill=False, zoom_pct=0):
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
    elif text_style == "yellow":
        text_color = (255, 255, 0)
        outline_color = (0, 0, 0)
    else:
        text_color = (0, 0, 0)
        outline_color = (255, 255, 255)

    # Generate overlay PNG
    overlay_path = "/tmp/post_caption_overlay.png"
    create_overlay(caption, overlay_path, text_color, outline_color, use_pill=use_pill)

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
    # Slow zoom (Ken Burns) on source video if requested
    if zoom_pct > 0:
        fps = get_video_fps(video_path)
        zoom_max = 1 + zoom_pct / 100.0
        # Increment per frame — reaches max zoom over ~26s
        total_frames = int(fps * 30)  # estimate ~30s max
        zoom_inc = zoom_pct / 100.0 / total_frames
        vid_chain = (
            f"[0:v]zoompan=z='min(1+{zoom_inc:.8f}*on,{zoom_max})':"
            f"d=1:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':"
            f"s={orig_w}x{orig_h}:fps={fps:.2f}[zoomed];"
            f"[zoomed]scale={new_w}:{new_h}[vid]"
        )
        print(f"Zoom: {zoom_pct}% slow zoom-in (source {fps:.1f}fps)")
    else:
        vid_chain = f"[0:v]scale={new_w}:{new_h}[vid]"

    if text_duration:
        # TikTok-style: show text overlay then disappear
        filter_complex = (
            f"color=black:{OUTPUT_WIDTH}x{OUTPUT_HEIGHT}:d=999[bg];"
            f"{vid_chain};"
            f"[bg][vid]overlay=(W-w)/2:(H-h)/2:shortest=1[base];"
            f"[base][1:v]overlay=0:0:enable='between(t,0,{text_duration})'[captioned]"
        )
        print(f"Text overlay: visible for {text_duration}s then disappears")
    else:
        filter_complex = (
            f"color=black:{OUTPUT_WIDTH}x{OUTPUT_HEIGHT}:d=999[bg];"
            f"{vid_chain};"
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
    parser = argparse.ArgumentParser(
        description="Post Agency — Clip Pipeline v4",
        epilog=(
            "Examples:\n"
            '  python3 make_clip.py raw/concert.mp4 "There\'s no way this kid did this 💀"\n'
            '  python3 make_clip.py raw/concert.mp4 "Caption" --start 0:32 --end 0:47\n'
            '  python3 make_clip.py "https://youtube.com/..." "Caption" --sound auto\n'
            '  python3 make_clip.py raw/clip.mp4 "Caption" --sound "Nettspend - Dazed.mp3"\n'
            "  python3 make_clip.py --list-sounds\n"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("input", nargs="?", help="Video file path or URL")
    parser.add_argument("caption", nargs="?", help="Caption text for the clip")
    parser.add_argument("-o", "--output", help="Output filename (without extension)")
    parser.add_argument("--start", help="Start timestamp (e.g., 0:32)")
    parser.add_argument("--end", help="End timestamp (e.g., 0:47)")
    parser.add_argument("--sound", help='Sound: filename, path, or "auto" for random')
    parser.add_argument("--volume", type=float, default=0.5,
                        help="Sound volume 0.0-1.0 (default: 0.5)")
    parser.add_argument("--style", default="auto", choices=["auto", "light", "dark", "yellow"],
                        help="Text contrast style (default: auto)")
    parser.add_argument("--subs", help="ASS subtitle file for speech captions")
    parser.add_argument("--text-duration", type=float,
                        help="Seconds to show text overlay before fading (TikTok style)")
    parser.add_argument("--pill", action="store_true",
                        help="TikTok pill style: white text on black rounded rectangle")
    parser.add_argument("--zoom", type=float, default=0,
                        help="Slow zoom-in percentage (e.g., 5 for 5%% Ken Burns zoom)")
    parser.add_argument("--list-sounds", action="store_true",
                        help="List available sounds and exit")
    args = parser.parse_args()

    # List sounds mode
    if args.list_sounds:
        list_sounds()
        sys.exit(0)

    if not args.input or not args.caption:
        parser.print_help()
        sys.exit(1)

    # Step 1: Download if URL
    video_path = args.input
    if video_path.startswith(("http://", "https://")):
        video_path = download_video(video_path)
        if not video_path:
            print("Download failed.")
            sys.exit(1)

    # Step 2: Trim if timestamps given
    video_path, was_trimmed = trim_video(video_path, args.start, args.end)

    # Step 3: Resolve sound
    sound_path = None
    if args.sound:
        sound_path = pick_sound(args.sound)

    # Step 4: Make the clip
    result = make_clip(
        video_path,
        args.caption,
        output_name=args.output,
        sound_path=sound_path,
        sound_volume=args.volume,
        text_style=args.style,
        subtitle_path=args.subs,
        text_duration=args.text_duration,
        use_pill=args.pill,
        zoom_pct=args.zoom,
    )

    # Step 5: Clean up temp trim file
    if was_trimmed and os.path.exists(video_path):
        os.remove(video_path)

    if not result:
        print("Clip creation failed.")
        sys.exit(1)
