#!/usr/bin/env python3
"""Retry the 5 failed Instagram posts with longer wait times."""

import subprocess
import time

BASE_TIME = 1771351200
INTERVAL = 10800

def run_applescript(script):
    result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=20)
    return result.stdout.strip()

def run_js(js):
    escaped = js.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
    script = f'tell application "Google Chrome" to tell active tab of front window to execute javascript "{escaped}"'
    return run_applescript(script)

def navigate(url):
    run_applescript(f'tell application "Google Chrome" to set URL of active tab of front window to "{url}"')

def switch_ig_profile(profile_name):
    navigate("https://app.later.com/9JJW1/schedule/calendar")
    time.sleep(3)
    run_js('var btn = document.querySelector("button.cCA--account__title"); if (btn) btn.click();')
    time.sleep(1)
    run_js(f'var items = document.querySelectorAll("li, [class*=listItem]"); items.forEach(function(item) {{ var text = item.textContent.trim(); if (text.includes("{profile_name}") && text.length < 60) item.click(); }});')
    time.sleep(0.5)
    run_js('var btns = document.querySelectorAll("button, a"); btns.forEach(function(b) { if (b.innerText.trim().includes("View") && b.innerText.trim().includes("Calendar")) b.click(); });')
    time.sleep(2)

def schedule_one(media_id, caption, sched_time):
    url = f"https://app.later.com/9JJW1/schedule/calendar/post/{media_id}/new?backTo=cluster.schedule.calendar&scheduledTime={sched_time}"
    navigate(url)
    time.sleep(6)  # Longer wait

    result = run_js(
        'var cm = document.querySelector("button[class*=changeMedia]"); '
        '"media:" + (cm ? "yes" : "no");'
    )
    if "media:no" in result:
        # Extra wait and retry check
        time.sleep(3)
        result = run_js('var cm = document.querySelector("button[class*=changeMedia]"); "media:" + (cm ? "yes" : "no");')
        if "media:no" in result:
            return "FAIL"

    cap_js = caption.replace("\\", "\\\\").replace("'", "\\'").replace('"', '\\"').replace("\n", "\\n")
    run_js(f'var ta = document.querySelector("textarea[placeholder*=caption]"); if (ta) {{ ta.focus(); ta.value = "{cap_js}"; ta.dispatchEvent(new Event("input", {{bubbles: true}})); ta.dispatchEvent(new Event("change", {{bubbles: true}})); }}')
    time.sleep(0.5)
    run_js('var btn = document.querySelector(".qa--media_modal__primary_button"); if (btn) btn.click();')

    for _ in range(15):
        time.sleep(1)
        url_check = run_js("window.location.href")
        if "/calendar" in url_check and "/new" not in url_check:
            return "OK"
    return "FAIL"

# Failed posts to retry
retries = [
    ("rapnews.world", 494760009, "Wait til you hear why Nettspend started making music \U0001f633\n\n#nettspend #gq #music #origin #10essentials #interview #hiphop #rap #fyp #viral", 6),
    ("rapnews.world", 494760011, "Nettspend cleanses every room he walks into \U0001f480\n\n#nettspend #gq #palosanto #spiritual #10essentials #interview #hiphop #rap #fyp #viral", 7),
    ("rapnews.world", 494760013, "Nettspend went to Japan and came back with this \U0001f633\n\n#nettspend #gq #chromehearts #japan #10essentials #interview #hiphop #rap #fyp #viral", 8),
    ("nettspend.world", 494760013, "Nettspend went to Japan and came back with this \U0001f633\n\n#nettspend #gq #chromehearts #japan #10essentials #interview #hiphop #rap #fyp #viral", 8),
    ("nettspend.world", 494760014, "Nobody expected Nettspend to say this on camera \U0001f64f\n\n#nettspend #gq #faith #baptized #10essentials #interview #hiphop #rap #fyp #viral", 9),
]

current_profile = None
ok = 0
fail = 0

for profile, media_id, caption, clip_idx in retries:
    if profile != current_profile:
        print(f"\nSwitching to @{profile}...")
        switch_ig_profile(profile)
        current_profile = profile

    offset = 5400 if profile == "nettspend.world" else 0
    sched_time = BASE_TIME + offset + (clip_idx * INTERVAL)

    short = caption.split("\n")[0][:50]
    print(f"  RETRY: {short}... ", end="", flush=True)

    result = schedule_one(media_id, caption, sched_time)
    if result == "OK":
        ok += 1
        print("SCHEDULED")
    else:
        fail += 1
        print("FAILED")

print(f"\nRetry done: {ok} ok, {fail} failed")
