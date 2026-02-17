#!/usr/bin/env python3
"""Batch generate captioned clips from viral Nettspend content."""

from make_clip import make_clip

clips = [
    {
        "video": "raw/viral_02_segment.mp4",
        "caption": "They really gave this kid his own movie set... 💀",
        "output": "viral_02_edit",
        "sound": "sounds/Nettspend - Stressed.mp3",
    },
    {
        "video": "raw/viral_03_segment.mp4",
        "caption": "Nobody can explain why this generation loves this 😭",
        "output": "viral_03_edit",
        "sound": "sounds/Nettspend - Fall N Luv.mp3",
    },
    {
        "video": "raw/viral_05_segment.mp4",
        "caption": "This is what a sold out tour looks like at 20 😳",
        "output": "viral_05_edit",
        "sound": "sounds/Nettspend - Out the Way.mp3",
    },
    {
        "video": "raw/viral_06_segment.mp4",
        "caption": "There's something about this kid nobody can figure out 🤦‍♂️",
        "output": "viral_06_edit",
        "sound": "sounds/Nettspend - Taste.mp3",
    },
    {
        "video": "raw/viral_08_segment.mp4",
        "caption": "Watch what happens when Nettspend takes Rolling Loud 😳😳",
        "output": "viral_08_edit",
        "sound": "sounds/Nettspend - Dazed.mp3",
    },
]

for i, clip in enumerate(clips, 1):
    print(f"\n{'='*60}")
    print(f"CLIP {i}/5")
    print(f"{'='*60}")
    result = make_clip(
        clip["video"],
        clip["caption"],
        clip["output"],
        sound_path=clip["sound"],
        sound_volume=0.5,
    )
    if result:
        print(f"SUCCESS: {result}")
    else:
        print(f"FAILED: {clip['output']}")

print(f"\n{'='*60}")
print("ALL DONE!")
print(f"{'='*60}")
