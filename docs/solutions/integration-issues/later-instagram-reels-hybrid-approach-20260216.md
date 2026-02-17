---
module: Social Media Automation
date: 2026-02-16
problem_type: integration_issue
component: later_com_api
symptoms:
  - "Later.com API rejects Instagram video posts with error: Videos scheduled to Instagram must be reels"
  - "All Instagram Reel type variations fail: InstagramReel, InstagramPost, Reel, InstagramReelPost"
  - "TikTok posts work fine via API with type TikTokPost"
root_cause: api_limitation
severity: high
tags: [later-com, instagram-reels, tiktok, browser-automation, applescript, social-media-scheduling]
---

# Later.com Instagram Reels API Limitation — Hybrid Scheduling Solution

## Problem

When automating Later.com post scheduling for 15 video clips across 4 social profiles (2 TikTok, 2 Instagram), the API worked for TikTok but rejected all Instagram Reel post creation attempts.

**Error:** `Videos scheduled to Instagram must be reels`

This error occurred regardless of type field value sent to `POST /api/v2/grams`.

## Investigation Steps

| # | Approach | Result |
|---|----------|--------|
| 1 | `type: "TikTokPost"` | Worked for TikTok |
| 2 | `type: "InstagramReel"` | Failed |
| 3 | `type: "InstagramPost"` | Failed |
| 4 | `type: "Reel"` | Failed |
| 5 | `type: "InstagramReelPost"` | Failed |
| 6 | `type: "InstagramReelsPost"` | Failed |
| 7 | No type field (let server infer) | Failed |
| 8 | Added `is_reel: true` | Failed |
| 9 | Added `gram_type: "reel"` | Failed |
| 10 | Added `post_format: "reel"` | Failed |
| 11 | Searched Later.com JS bundle for correct type | Found "InstagramReel" — still failed |
| 12 | Verified IG profile permissions | Had `instagram_business_content_publish`, `auto_publish_ready: true` |

## Root Cause

Later.com's `/api/v2/grams` endpoint does not support creating Instagram Reel posts via API. The Instagram Reel creation flow requires a UI-based workflow that sets up internal application state not exposed through the REST API. This is a Later.com platform limitation, not an Instagram API limitation.

## Working Solution

### TikTok: Direct API (28 posts)

```python
# POST /api/v2/grams — works for TikTok
fetch("/api/v2/grams", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf_token
    },
    body: JSON.stringify({
        gram: {
            media_item_id: 494759977,
            social_profile_id: 9987522,
            caption: "Your caption here",
            scheduled_time: 1771351200,  // Unix timestamp
            auto_publish: true,
            type: "TikTokPost"
        }
    })
})
```

### Instagram: Chrome UI Automation (31 posts)

Since the API doesn't work, automate the Later.com UI via Chrome AppleScript JS injection:

**Step 1: Switch calendar profile to Instagram**
```python
def switch_ig_profile(profile_name):
    navigate("https://app.later.com/{group_id}/schedule/calendar")
    # Click "Select Profiles" → click target IG profile → "View on Calendar"
```

**Step 2: Navigate to URL with media pre-attached**
```
https://app.later.com/{group_id}/schedule/calendar/post/{media_id}/new?scheduledTime={unix_ts}
```
The `{media_id}` in the URL path causes Later to pre-attach that media to the post form.

**Step 3: Fill caption via JS injection**
```python
run_js('''
    var ta = document.querySelector("textarea[placeholder*=caption]");
    ta.focus();
    ta.value = "Your caption";
    ta.dispatchEvent(new Event("input", {bubbles: true}));
    ta.dispatchEvent(new Event("change", {bubbles: true}));
''')
```

**Step 4: Click Schedule Post**
```python
run_js('document.querySelector(".qa--media_modal__primary_button").click()')
```

**Step 5: Wait for navigation back to calendar (confirms success)**

### Key API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v2/social_profiles?group_id={id}` | GET | List connected profiles |
| `/api/v2/media_items?group_id={id}&page=1&per_page=30` | GET | List uploaded media with filenames |
| `/api/v2/grams` | POST | Create scheduled post (TikTok only) |
| `/api/v2/grams/{id}` | GET | Get post details |
| `/api/v2/grams/{id}` | DELETE | Delete post |

### Scripts Created

- `clips/schedule_all.py` — TikTok API batch scheduler (all 15 clips to both TikTok profiles)
- `clips/schedule_ig.py` — Instagram UI automation scheduler (all 15 clips to both IG profiles)
- `clips/schedule_ig_retry.py` — Retry script for failed posts with longer page load waits

## Result

**59 posts scheduled across 4 profiles:**
- @nettspend590 (TikTok): 15 posts via API
- @nettspend.clips7 (TikTok): 14 posts via API
- @rapnews.world (Instagram): 15 posts via UI automation
- @nettspend.world (Instagram): 15 posts via UI automation

All set to Auto Publish, spaced 3 hours apart starting Feb 17, 2026 at noon EST.

## Prevention & Best Practices

### Chrome AppleScript Setup
- Enable: **View > Developer > Allow JavaScript from Apple Events** in Chrome
- This setting can reset after Chrome updates — always verify before running automation
- Test with a simple `document.title` check before starting batch operations

### Timing & Retry Logic
- Wait 4-6 seconds after page navigation before interacting with DOM
- For media attachment failures, retry with longer wait (up to 9 seconds)
- Check for `button[class*=changeMedia]` to verify media attached successfully
- Validate return to calendar URL after scheduling to confirm success

### Session Management
- CSRF token: Extract from `<meta name="csrf-token">` — expires after 24-48 hours
- Keep the same Chrome tab/window active throughout automation
- Verify login state before starting batch operations

### Future Migration Path
- Monitor Instagram Graph API for Reels support (check quarterly)
- Consider alternatives: Buffer, Hootsuite, or direct Instagram Graph API
- The AppleScript approach is a workaround — migrate when API support arrives

## Related Documentation

- [Social Media Platform Account Creation Limits](../integration-issues/social-media-platform-account-creation-limits.md)
- [Post Clipping Agency Platform Plan](../../plans/2026-02-14-feat-post-clipping-agency-platform-plan.md)
- [Nettspend Accounts Tracker](../../clients/nettspend/accounts.md)
- [Nettspend Clipping Style Guide](../../clients/nettspend/clipping-style.md)
