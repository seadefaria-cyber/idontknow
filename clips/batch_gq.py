#!/usr/bin/env python3
"""Batch generate 10 captioned clips from Nettspend GQ 10 Essentials interview."""

from make_clip import make_clip

clips = [
    {
        "video": "raw/gq_01_blockbuster.mp4",
        "caption": "Nettspend lost something in Blockbuster the night before it closed forever 💀",
        "output": "gq_01_blockbuster",
        "sound": "sounds/Nettspend - Stressed.mp3",
    },
    {
        "video": "raw/gq_02_crystalball.mp4",
        "caption": "Wait til you see what Nettspend does with a crystal ball 😭",
        "output": "gq_02_crystalball",
        "sound": "sounds/Nettspend - Fall N Luv.mp3",
    },
    {
        "video": "raw/gq_03_ipod_apocalypse.mp4",
        "caption": "This kid carries an iPod Nano in case of the apocalypse 💀",
        "output": "gq_03_ipod",
        "sound": "sounds/Nettspend - Dazed.mp3",
    },
    {
        "video": "raw/gq_04_apocalypse_playlist.mp4",
        "caption": "Nettspend's apocalypse playlist is not what you'd expect 😳",
        "output": "gq_04_playlist",
        "sound": "sounds/Nettspend - Still Standing.mp3",
    },
    {
        "video": "raw/gq_05_photographer.mp4",
        "caption": "Nobody knew Nettspend has this secret hobby 📸",
        "output": "gq_05_photographer",
        "sound": "sounds/Nettspend - Nothing Like Uuu.mp3",
    },
    {
        "video": "raw/gq_06_film_cameras.mp4",
        "caption": "This kid just explained film cameras better than your art teacher 😭",
        "output": "gq_06_film",
        "sound": "sounds/Nettspend - Aura.mp3",
    },
    {
        "video": "raw/gq_07_fifth_grade.mp4",
        "caption": "Wait til you hear why Nettspend started making music 😳",
        "output": "gq_07_fifthgrade",
        "sound": "sounds/Nettspend - Shut Up.mp3",
    },
    {
        "video": "raw/gq_08_palosanto.mp4",
        "caption": "Nettspend cleanses every room he walks into 💀",
        "output": "gq_08_palosanto",
        "sound": "sounds/Nettspend - Out the Way.mp3",
    },
    {
        "video": "raw/gq_09_chromhearts.mp4",
        "caption": "Nettspend went to Japan and came back with this 😳",
        "output": "gq_09_chromhearts",
        "sound": "sounds/Nettspend - Taste.mp3",
    },
    {
        "video": "raw/gq_10_baptized.mp4",
        "caption": "Nobody expected Nettspend to say this on camera 🙏",
        "output": "gq_10_baptized",
        "sound": "sounds/Nettspend - Gas Gas.mp3",
    },
]

for i, clip in enumerate(clips, 1):
    print(f"\n{'='*60}")
    print(f"CLIP {i}/10")
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
print("ALL 10 DONE!")
print(f"{'='*60}")
