#!/usr/bin/env python3
"""
Automate scheduling all 15 clips to Instagram profiles via Later.com UI automation.
Uses Chrome AppleScript + URL-based media attachment.
"""

import subprocess
import time

# Clips: media_id -> caption
CLIPS = [
    (494759977, "Nettspend lost something in Blockbuster the night before it closed forever \U0001f480\n\n#nettspend #gq #10essentials #blockbuster #interview #hiphop #rap #fyp #viral #foryoupage"),
    (494759979, "Wait til you see what Nettspend does with a crystal ball \U0001f62d\n\n#nettspend #gq #crystalball #10essentials #interview #hiphop #rap #fyp #viral #foryoupage"),
    (494759984, "This kid carries an iPod Nano in case of the apocalypse \U0001f480\n\n#nettspend #gq #ipod #apocalypse #10essentials #interview #hiphop #rap #fyp #viral"),
    (494759993, "Nettspend's apocalypse playlist is not what you'd expect \U0001f633\n\n#nettspend #gq #playlist #apocalypse #yunglean #10essentials #hiphop #rap #fyp #viral"),
    (494759999, "Nobody knew Nettspend has this secret hobby \U0001f4f8\n\n#nettspend #gq #photography #ricoh #10essentials #interview #hiphop #rap #fyp #viral"),
    (494760005, "This kid just explained film cameras better than your art teacher \U0001f62d\n\n#nettspend #gq #filmcamera #analog #10essentials #interview #hiphop #rap #fyp #viral"),
    (494760009, "Wait til you hear why Nettspend started making music \U0001f633\n\n#nettspend #gq #music #origin #10essentials #interview #hiphop #rap #fyp #viral"),
    (494760011, "Nettspend cleanses every room he walks into \U0001f480\n\n#nettspend #gq #palosanto #spiritual #10essentials #interview #hiphop #rap #fyp #viral"),
    (494760013, "Nettspend went to Japan and came back with this \U0001f633\n\n#nettspend #gq #chromehearts #japan #10essentials #interview #hiphop #rap #fyp #viral"),
    (494760014, "Nobody expected Nettspend to say this on camera \U0001f64f\n\n#nettspend #gq #faith #baptized #10essentials #interview #hiphop #rap #fyp #viral"),
    (494760015, "Nettspend is not from this planet \U0001f525\n\n#nettspend #edit #viral #hiphop #rap #fyp #foryoupage #music #concert #live"),
    (494760018, "This sound changed everything \U0001f525\n\n#nettspend #edit #viral #hiphop #rap #fyp #foryoupage #music #newmusic"),
    (494760020, "Nettspend really different from everyone else \U0001f624\n\n#nettspend #edit #viral #hiphop #rap #fyp #foryoupage #music #different"),
    (494760021, "No one does it like Nettspend \U0001f525\n\n#nettspend #edit #viral #hiphop #rap #fyp #foryoupage #music #goat"),
    (494760023, "This kid is the future of music \U0001f633\n\n#nettspend #edit #viral #hiphop #rap #fyp #foryoupage #music #future"),
]

# Schedule times: 3 hours apart starting tomorrow noon EST
BASE_TIME = 1771351200  # Feb 17, 2026 12:00 PM EST
INTERVAL = 10800  # 3 hours

# Already posted
ALREADY_DONE = {
    "rapnews.world": {494759977},  # gq_01 already scheduled
}


def run_applescript(script):
    """Run AppleScript and return output."""
    result = subprocess.run(
        ["osascript", "-e", script],
        capture_output=True, text=True, timeout=20
    )
    return result.stdout.strip()


def run_js(js):
    """Execute JS in Chrome active tab."""
    # Escape for AppleScript string
    escaped = js.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
    script = f'tell application "Google Chrome" to tell active tab of front window to execute javascript "{escaped}"'
    return run_applescript(script)


def get_title():
    """Get Chrome active tab title."""
    return run_applescript('tell application "Google Chrome" to return title of active tab of front window')


def navigate(url):
    """Navigate Chrome to URL."""
    run_applescript(f'tell application "Google Chrome" to set URL of active tab of front window to "{url}"')


def wait_for_calendar(timeout=15):
    """Wait until we're back on the calendar page."""
    for _ in range(timeout):
        time.sleep(1)
        url = run_js("window.location.href")
        if "/calendar" in url and "/new" not in url:
            return True
    return False


def schedule_one_post(media_id, caption, sched_time):
    """Schedule a single Instagram post through the UI."""
    # Navigate to create post with media pre-attached
    url = f"https://app.later.com/9JJW1/schedule/calendar/post/{media_id}/new?backTo=cluster.schedule.calendar&scheduledTime={sched_time}"
    navigate(url)
    time.sleep(4)  # Wait for page load

    # Verify media is attached
    result = run_js(
        'var cm = document.querySelector("button[class*=changeMedia]"); '
        'var err = document.querySelector("[class*=error]"); '
        '"media:" + (cm ? "yes" : "no") + " err:" + (err ? err.innerText.trim().substring(0,40) : "none");'
    )
    if "media:no" in result or "need at least" in result:
        return f"FAIL: media not attached ({result})"

    # Fill caption - escape for JS string
    cap_js = caption.replace("\\", "\\\\").replace("'", "\\'").replace('"', '\\"').replace("\n", "\\n")
    run_js(
        f'var ta = document.querySelector("textarea[placeholder*=caption]"); '
        f'if (ta) {{ ta.focus(); ta.value = "{cap_js}"; '
        f'ta.dispatchEvent(new Event("input", {{bubbles: true}})); '
        f'ta.dispatchEvent(new Event("change", {{bubbles: true}})); }}'
    )
    time.sleep(0.5)

    # Click Schedule Post
    run_js('var btn = document.querySelector(".qa--media_modal__primary_button"); if (btn) btn.click();')

    # Wait for navigation back to calendar
    if wait_for_calendar():
        return "OK"
    else:
        return "FAIL: didn't return to calendar"


def switch_ig_profile(profile_name):
    """Switch calendar to show a specific Instagram profile."""
    # Go to calendar
    navigate("https://app.later.com/9JJW1/schedule/calendar")
    time.sleep(3)

    # Click Select Profiles
    run_js('var btn = document.querySelector("button.cCA--account__title"); if (btn) btn.click();')
    time.sleep(1)

    # Click the target profile
    run_js(
        f'var items = document.querySelectorAll("li, [class*=listItem]"); '
        f'items.forEach(function(item) {{ '
        f'  var text = item.textContent.trim(); '
        f'  if (text.includes("{profile_name}") && text.length < 60) item.click(); '
        f'}});'
    )
    time.sleep(0.5)

    # Click View on Calendar
    run_js(
        'var btns = document.querySelectorAll("button, a"); '
        'btns.forEach(function(b) { '
        '  if (b.innerText.trim().includes("View") && b.innerText.trim().includes("Calendar")) b.click(); '
        '});'
    )
    time.sleep(2)


def main():
    profiles = [
        ("rapnews.world", 0),
        ("nettspend.world", 5400),  # 1.5 hour offset
    ]

    total = 0
    success = 0
    failed = 0

    for profile_name, time_offset in profiles:
        print(f"\n{'='*50}")
        print(f"PROFILE: @{profile_name} (Instagram)")
        print(f"{'='*50}")

        # Switch calendar to this profile
        print(f"  Switching to @{profile_name}...")
        switch_ig_profile(profile_name)

        already = ALREADY_DONE.get(profile_name, set())

        for i, (media_id, caption) in enumerate(CLIPS):
            if media_id in already:
                print(f"  SKIP: media {media_id} (already done)")
                continue

            sched_time = BASE_TIME + time_offset + (i * INTERVAL)
            total += 1

            short_cap = caption.split("\n")[0][:50]
            print(f"  [{total}] {short_cap}... ", end="", flush=True)

            result = schedule_one_post(media_id, caption, sched_time)

            if result == "OK":
                success += 1
                print("SCHEDULED")
            else:
                failed += 1
                print(result)

    print(f"\n{'='*50}")
    print(f"DONE! {success} scheduled, {failed} failed out of {total} total")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
