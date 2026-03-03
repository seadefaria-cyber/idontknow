#!/usr/bin/env python3
"""
Generate 10 captioned interview clips from Nettspend GQ 10 Essentials.
- Speech captions: yellow Arial Bold, all caps, black outline (CapCut style)
- Hook caption: Montserrat Bold floating text (our signature style)
- Background music: 10% volume (interview audio is primary)
"""

import os
from make_clip import make_clip

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SUBS_DIR = os.path.join(SCRIPT_DIR, "raw", "subs")
os.makedirs(SUBS_DIR, exist_ok=True)


def generate_ass(text, duration, output_path, words_per_group=3):
    """Generate an ASS subtitle file with yellow all-caps speech captions."""

    # ASS header: yellow text, Arial Bold, small, black outline, bottom-center
    # PrimaryColour: &H0000FFFF = yellow (ASS format: &HAABBGGRR)
    # OutlineColour: &H00000000 = black
    # Bold: -1 (true)
    # Fontsize: 30
    # Outline: 3
    # Alignment: 2 (bottom-center)
    # MarginV: 340 (puts text at ~82% from top on 1920h canvas)
    header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,30,&H0000FFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,3,0,2,20,20,340,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    # Split text into words
    words = text.split()
    total_words = len(words)

    # Calculate timing: spread words evenly across the duration
    # Leave 0.5s at start and 0.3s at end for breathing room
    start_offset = 0.5
    end_offset = duration - 0.3
    available_time = end_offset - start_offset

    # Group words
    groups = []
    for i in range(0, total_words, words_per_group):
        chunk = words[i:i + words_per_group]
        groups.append(" ".join(chunk).upper())

    # Calculate time per group
    if len(groups) > 0:
        time_per_group = available_time / len(groups)
    else:
        return

    # Generate dialogue lines
    lines = []
    for i, group_text in enumerate(groups):
        start = start_offset + i * time_per_group
        end = start_offset + (i + 1) * time_per_group
        start_str = format_ass_time(start)
        end_str = format_ass_time(end)
        lines.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{group_text}")

    with open(output_path, "w") as f:
        f.write(header)
        f.write("\n".join(lines))
        f.write("\n")

    return output_path


def format_ass_time(seconds):
    """Format seconds to ASS timestamp H:MM:SS.CC"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    cs = int((s % 1) * 100)
    return f"{h}:{m:02d}:{int(s):02d}.{cs:02d}"


# ============================================================
# 10 CLIPS: transcript text, timing, captions, sounds
# ============================================================

clips = [
    {
        "video": "raw/gq_01_blockbuster.mp4",
        "caption": "Nettspend lost something in Blockbuster the night before it closed forever 💀",
        "output": "gq_01_blockbuster",
        "sound": "sounds/Nettspend - Stressed.mp3",
        "duration": 19,
        "transcript": "I used to have a claw you know like the claw you pull and it has the hand I left it in Blockbuster the night before Blockbuster shut down and I was never able to get it back I still think about it and I miss Blockbuster too",
    },
    {
        "video": "raw/gq_02_crystalball.mp4",
        "caption": "Wait til you see what Nettspend does with a crystal ball 😭",
        "output": "gq_02_crystalball",
        "sound": "sounds/Nettspend - Fall N Luv.mp3",
        "duration": 13,
        "transcript": "This is my crystal ball I see all my fans going crazy on the tour and I love them so much",
    },
    {
        "video": "raw/gq_03_ipod_apocalypse.mp4",
        "caption": "This kid carries an iPod Nano in case of the apocalypse 💀",
        "output": "gq_03_ipod",
        "sound": "sounds/Nettspend - Dazed.mp3",
        "duration": 11,
        "transcript": "This is my iPod Nano I'm getting ready for the apocalypse and I'm scared of cyber warfare I got all my music on here for the rest of my life",
    },
    {
        "video": "raw/gq_04_apocalypse_playlist.mp4",
        "caption": "Nettspend's apocalypse playlist is not what you'd expect 😳",
        "output": "gq_04_playlist",
        "sound": "sounds/Nettspend - Still Standing.mp3",
        "duration": 12,
        "transcript": "Songs I'm taking to the apocalypse Babyfather Yung Lean and Willie Nelson that's it maybe Mazzy Star",
    },
    {
        "video": "raw/gq_05_photographer.mp4",
        "caption": "Nobody knew Nettspend has this secret hobby 📸",
        "output": "gq_05_photographer",
        "sound": "sounds/Nettspend - Nothing Like Uuu.mp3",
        "duration": 11,
        "transcript": "I love this camera it's a Ricoh I can just spam the button get a bunch of pictures I'm an amateur photographer",
    },
    {
        "video": "raw/gq_06_film_cameras.mp4",
        "caption": "This kid just explained film cameras better than your art teacher 😭",
        "output": "gq_06_film",
        "sound": "sounds/Nettspend - Aura.mp3",
        "duration": 10,
        "transcript": "I like film cameras a lot super organic with film cameras it takes time you don't have unlimited tries",
    },
    {
        "video": "raw/gq_07_fifth_grade.mp4",
        "caption": "Wait til you hear why Nettspend started making music 😳",
        "output": "gq_07_fifthgrade",
        "sound": "sounds/Nettspend - Shut Up.mp3",
        "duration": 11,
        "transcript": "I started making music in fifth grade cuz my dad makes country music I love making music I don't want to stop nothing ever feels like it's enough",
    },
    {
        "video": "raw/gq_08_palosanto.mp4",
        "caption": "Nettspend cleanses every room he walks into 💀",
        "output": "gq_08_palosanto",
        "sound": "sounds/Nettspend - Out the Way.mp3",
        "duration": 16,
        "transcript": "This is Palo Santo it cleanses the air and makes everything smell good around me especially my house I do it at every hotel I go to the venues the car I wish I could light it in here",
    },
    {
        "video": "raw/gq_09_chromhearts.mp4",
        "caption": "Nettspend went to Japan and came back with this 😳",
        "output": "gq_09_chromhearts",
        "sound": "sounds/Nettspend - Taste.mp3",
        "duration": 11,
        "transcript": "One of my essentials is my Chrome Hearts bag I got it in Japan like two months ago it's big and I can put a lot of stuff in it",
    },
    {
        "video": "raw/gq_10_baptized.mp4",
        "caption": "Nobody expected Nettspend to say this on camera 🙏",
        "output": "gq_10_baptized",
        "sound": "sounds/Nettspend - Gas Gas.mp3",
        "duration": 8,
        "transcript": "One of my essentials is my pocket cross I love Jesus and I'm about to get baptized in a lake",
    },
]


# Generate ASS subtitle files and run clips
for i, clip in enumerate(clips, 1):
    print(f"\n{'='*60}")
    print(f"CLIP {i}/10")
    print(f"{'='*60}")

    # Generate ASS subtitle file
    sub_path = os.path.join(SUBS_DIR, f"{clip['output']}.ass")
    generate_ass(clip["transcript"], clip["duration"], sub_path)
    print(f"Subtitles: {os.path.basename(sub_path)}")

    result = make_clip(
        clip["video"],
        clip["caption"],
        clip["output"],
        sound_path=clip["sound"],
        sound_volume=0.1,           # 10% — interview audio is primary
        subtitle_path=sub_path,
    )
    if result:
        print(f"SUCCESS: {result}")
    else:
        print(f"FAILED: {clip['output']}")

print(f"\n{'='*60}")
print("ALL 10 DONE!")
print(f"{'='*60}")
