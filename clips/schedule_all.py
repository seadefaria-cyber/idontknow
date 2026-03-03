#!/usr/bin/env python3
"""
Automate scheduling all 15 clips to all 4 Later.com profiles via Chrome JS injection.
"""

import subprocess
import time
import json

# CSRF token from Later session
CSRF = "Uk66NE8aqvnfYh4LffM0ZrfjUEDu2sVgk8w78uP9DCMa981jJcRh-JelPuugoXoSA-WPiCa4SS4x_3AZxMhqXA"

# Social profiles
PROFILES = {
    "nettspend590": {"id": 9987522, "type": "TikTokPost", "platform": "tiktok"},
    "nettspend.clips7": {"id": 9987523, "type": "TikTokPost", "platform": "tiktok"},
    "rapnews.world": {"id": 9987518, "type": "InstagramReel", "platform": "instagram"},
    "nettspend.world": {"id": 9987520, "type": "InstagramReel", "platform": "instagram"},
}

# Media items mapped to captions (media_id -> {filename, caption})
CLIPS = [
    {
        "media_id": 494759977,
        "file": "gq_01_blockbuster",
        "caption": "Nettspend lost something in Blockbuster the night before it closed forever 💀\n\n#nettspend #gq #10essentials #blockbuster #interview #hiphop #rap #fyp #viral #foryoupage",
    },
    {
        "media_id": 494759979,
        "file": "gq_02_crystalball",
        "caption": "Wait til you see what Nettspend does with a crystal ball 😭\n\n#nettspend #gq #crystalball #10essentials #interview #hiphop #rap #fyp #viral #foryoupage",
    },
    {
        "media_id": 494759984,
        "file": "gq_03_ipod",
        "caption": "This kid carries an iPod Nano in case of the apocalypse 💀\n\n#nettspend #gq #ipod #apocalypse #10essentials #interview #hiphop #rap #fyp #viral",
    },
    {
        "media_id": 494759993,
        "file": "gq_04_playlist",
        "caption": "Nettspend's apocalypse playlist is not what you'd expect 😳\n\n#nettspend #gq #playlist #apocalypse #yunglean #10essentials #hiphop #rap #fyp #viral",
    },
    {
        "media_id": 494759999,
        "file": "gq_05_photographer",
        "caption": "Nobody knew Nettspend has this secret hobby 📸\n\n#nettspend #gq #photography #ricoh #10essentials #interview #hiphop #rap #fyp #viral",
    },
    {
        "media_id": 494760005,
        "file": "gq_06_film",
        "caption": "This kid just explained film cameras better than your art teacher 😭\n\n#nettspend #gq #filmcamera #analog #10essentials #interview #hiphop #rap #fyp #viral",
    },
    {
        "media_id": 494760009,
        "file": "gq_07_fifthgrade",
        "caption": "Wait til you hear why Nettspend started making music 😳\n\n#nettspend #gq #music #origin #10essentials #interview #hiphop #rap #fyp #viral",
    },
    {
        "media_id": 494760011,
        "file": "gq_08_palosanto",
        "caption": "Nettspend cleanses every room he walks into 💀\n\n#nettspend #gq #palosanto #spiritual #10essentials #interview #hiphop #rap #fyp #viral",
    },
    {
        "media_id": 494760013,
        "file": "gq_09_chromhearts",
        "caption": "Nettspend went to Japan and came back with this 😳\n\n#nettspend #gq #chromehearts #japan #10essentials #interview #hiphop #rap #fyp #viral",
    },
    {
        "media_id": 494760014,
        "file": "gq_10_baptized",
        "caption": "Nobody expected Nettspend to say this on camera 🙏\n\n#nettspend #gq #faith #baptized #10essentials #interview #hiphop #rap #fyp #viral",
    },
    {
        "media_id": 494760015,
        "file": "viral_02",
        "caption": "Nettspend is not from this planet 🔥\n\n#nettspend #edit #viral #hiphop #rap #fyp #foryoupage #music #concert #live",
    },
    {
        "media_id": 494760018,
        "file": "viral_03",
        "caption": "This sound changed everything 🔥\n\n#nettspend #edit #viral #hiphop #rap #fyp #foryoupage #music #newmusic",
    },
    {
        "media_id": 494760020,
        "file": "viral_05",
        "caption": "Nettspend really different from everyone else 😤\n\n#nettspend #edit #viral #hiphop #rap #fyp #foryoupage #music #different",
    },
    {
        "media_id": 494760021,
        "file": "viral_06",
        "caption": "No one does it like Nettspend 🔥\n\n#nettspend #edit #viral #hiphop #rap #fyp #foryoupage #music #goat",
    },
    {
        "media_id": 494760023,
        "file": "viral_08",
        "caption": "This kid is the future of music 😳\n\n#nettspend #edit #viral #hiphop #rap #fyp #foryoupage #music #future",
    },
]

# Already posted: gq_01_blockbuster to nettspend590
ALREADY_POSTED = {(494759977, 9987522)}

# Base time: Feb 17, 2026 12:00 PM EST (Unix timestamp)
# EST = UTC-5, so 12:00 PM EST = 17:00 UTC
BASE_TIME = 1771351200  # 2026-02-17 12:00 PM EST

# Stagger: 3 hours between clips on same profile, 45 min offset per profile
CLIP_INTERVAL = 3 * 3600  # 3 hours
PROFILE_OFFSETS = {
    9987522: 0,          # nettspend590: starts at 12:00 PM
    9987523: 45 * 60,    # nettspend.clips7: starts at 12:45 PM
    9987518: 90 * 60,    # rapnews.world: starts at 1:30 PM
    9987520: 135 * 60,   # nettspend.world: starts at 2:15 PM
}


def run_js(js_code):
    """Execute JavaScript in Chrome's active tab via AppleScript."""
    escaped = js_code.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
    cmd = f'''osascript -e 'tell application "Google Chrome"
    tell active tab of front window
        execute javascript "{escaped}"
    end tell
end tell' '''
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
    if result.returncode != 0:
        return f"ERROR: {result.stderr}"
    return result.stdout.strip()


def schedule_post(media_id, caption, profile_id, post_type, scheduled_time):
    """Create a scheduled post via Later's API."""
    caption_escaped = caption.replace('\\', '\\\\').replace("'", "\\'").replace('"', '\\"').replace('\n', '\\n')

    js = f"""
    fetch('/api/v2/grams', {{
        method: 'POST',
        credentials: 'same-origin',
        headers: {{
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-Token': '{CSRF}'
        }},
        body: JSON.stringify({{
            gram: {{
                media_item_id: {media_id},
                social_profile_id: {profile_id},
                caption: "{caption_escaped}",
                scheduled_time: {scheduled_time},
                auto_publish: true,
                type: "{post_type}"
            }}
        }})
    }})
    .then(r => r.json())
    .then(d => {{
        var g = d.gram || d;
        document.title = 'OK:' + (g.id || 'no-id') + '|' + (g.state || g.error || 'unknown');
    }})
    .catch(e => {{ document.title = 'FAIL:' + e.message; }});
    'scheduling...';
    """

    run_js(js)
    time.sleep(2)

    # Read result from title
    title_result = subprocess.run(
        ["osascript", "-e", 'tell application "Google Chrome" to return title of active tab of front window'],
        capture_output=True, text=True, timeout=10
    )
    return title_result.stdout.strip()


def main():
    total = 0
    success = 0
    failed = 0

    for profile_name, profile_info in PROFILES.items():
        pid = profile_info["id"]
        ptype = profile_info["type"]
        offset = PROFILE_OFFSETS[pid]

        print(f"\n{'='*50}")
        print(f"PROFILE: @{profile_name} ({profile_info['platform']})")
        print(f"{'='*50}")

        for i, clip in enumerate(CLIPS):
            mid = clip["media_id"]

            # Skip already posted
            if (mid, pid) in ALREADY_POSTED:
                print(f"  SKIP: {clip['file']} (already posted)")
                continue

            sched_time = BASE_TIME + offset + (i * CLIP_INTERVAL)
            total += 1

            print(f"  [{total}] {clip['file']} → @{profile_name} ... ", end="", flush=True)

            result = schedule_post(mid, clip["caption"], pid, ptype, sched_time)

            if result.startswith("OK:"):
                success += 1
                print(f"SCHEDULED ({result})")
            else:
                failed += 1
                print(f"FAILED ({result})")

            time.sleep(1)  # Rate limit

    print(f"\n{'='*50}")
    print(f"DONE! {success} scheduled, {failed} failed out of {total} total")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
