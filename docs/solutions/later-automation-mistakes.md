---
title: "Later App Automation — Mistakes and Lessons Learned"
date: 2026-02-18
tags: [later, social-media, automation, browser-automation, nettspend]
status: post-mortem
---

# Later App Automation — What Went Wrong

## Context
Attempted to automate Later.com (social media scheduling app) via Chrome AppleScript/JavaScript to:
- Delete 28+ overpacked posts for rapnews.world
- Rebuild schedule across 3 profiles: rapnews.world (IG), nettspend.world (IG), nettspend.clips7 (TikTok)
- 2 posts/day per profile, 12 hours apart, Notify mode, varied times

## What Went Wrong

### 1. Posts fired all at once instead of at scheduled times
**Root cause:** Setting the date/time via JavaScript (`input.value = '2026-02-18T10:47:00'`) did NOT actually update Ember.js's internal data model. The flatpickr input value was changed in the DOM but Ember's data binding didn't pick it up. When "Schedule Post" was clicked, the posts were scheduled at the DEFAULT time (immediately or the suggested time) instead of the intended time.

**Lesson:** Ember.js uses its own data layer. Changing DOM input values + dispatching standard events (input, change) does NOT reliably update Ember's internal state. The flatpickr component needs to be updated through its API (`_flatpickr.setDate()`), and even that may not trigger Ember's observers.

### 2. Auto Publish was left ON (should have been Notify)
**Root cause:** The Auto Publish toggle is a custom Ember component (not a standard checkbox). Could not find a way to toggle it off via JavaScript. It's a dropdown button (`data-test-id="publish-switcher"`) that opens a custom dropdown, but clicking it didn't reliably open the dropdown menu with Auto/Notify options.

**Lesson:** Complex Ember.js UI components (custom toggles, dropdowns, date pickers) cannot be reliably automated through basic DOM events. They require either:
- Using the Ember app's internal API/store
- Using a proper browser automation tool (Playwright, Puppeteer) with real mouse/keyboard events
- Or doing it manually

### 3. Media was assigned sequentially, not matched to content
**Root cause:** The media library shows thumbnails without labels. Videos were selected by index (0, 1, 2...) rather than matched to the correct content (Blockbuster story, crystal ball clip, etc.). No way to identify which video is which from the thumbnail alone via JavaScript.

**Lesson:** Media matching requires visual identification. Cannot be automated without either:
- Labeled/tagged media in the library
- Visual AI to identify content from thumbnails
- Manual matching by the user

### 4. Caption setting may not have persisted
**Root cause:** Similar to the date issue — `textarea.value = "..."` + dispatching events may not have triggered Ember's change detection. The caption may have appeared in the DOM but not been saved to Ember's data model when "Schedule Post" was clicked.

**Lesson:** Same as #1 — Ember.js data binding requires updating through Ember's APIs, not raw DOM manipulation.

### 5. Last 4 nettspend.world posts had no media
**Root cause:** The media library only shows ~14 items at a time. After using all visible items, the script tried to select items beyond what was visible. The "Load More" button was never clicked.

**Lesson:** Need to handle pagination in the media library. Click "Load More" when needed.

### 6. Could not switch profiles for TikTok posts
**Root cause:** The Create Post dialog always defaults to rapnews.world. The profile switcher within the dialog opens a "Multi-Profile Post" flow that said "Not Available for 6 Social Profiles" (likely a plan limitation on the trial). No way to create a single-profile post for a different profile.

**Lesson:** On Later's trial plan, you may not be able to change the default posting profile via the multi-profile flow. Need to figure out alternative approaches (e.g., changing the default profile in account settings, or using a different entry point).

### 7. Tab navigation/loss during automation
**Root cause:** During profile switching operations, the browser sometimes navigated away from Later to other sites (Verizon, QuickBooks). Likely caused by accidentally clicking sidebar links or ad elements during JavaScript DOM traversal.

**Lesson:** JavaScript `click()` calls on DOM elements can trigger unexpected navigations. Need to be more precise about which elements are clicked, and verify the URL after each action.

## What Worked

1. **Accessing Chrome via AppleScript** — `osascript` + `execute javascript` reliably interacts with the active Chrome tab
2. **Reading page content** — Getting text, HTML, and element states works well
3. **Deleting posts** — The discard button flow (click post → click discard → confirm) worked reliably
4. **Drag-and-drop media** — Simulating DragEvent worked to add media from the library to posts
5. **Finding the Later tab** — Switching between Chrome tabs via AppleScript works

## Rules for Future Later Automation

1. **NEVER trust that JavaScript DOM changes will persist in Ember.js apps** — always verify after each action
2. **NEVER auto-schedule posts without verifying the time was actually set** — check the post detail after scheduling
3. **ALWAYS use Notify mode, never Auto** — for TikTok especially, but also Instagram to avoid algorithm penalties
4. **ALWAYS verify the correct profile** before scheduling
5. **ALWAYS match media to content manually** — don't guess from thumbnails
6. **Create posts ONE AT A TIME and verify each one** before moving to the next
7. **Take a screenshot after each post creation** to verify everything looks right
8. **Consider using Later's API directly** instead of browser automation if available
9. **For date/time changes, use the UI properly** — click the date picker, navigate to the correct date, click the correct time. Don't try to set input values programmatically.
10. **Keep the schedule document as the source of truth** — don't deviate from it

## The Correct Schedule

The intended schedule is saved at:
`/Users/seandefaria/idontknow-3/nettspend-content-schedule.md`

This contains:
- 14 posts for rapnews.world (Instagram) — Feb 18-24
- 14 posts for nettspend.world (Instagram) — Feb 19-25
- 14 posts for nettspend.clips7 (TikTok) — Feb 22-Mar 2 (with cooldown)
- All captions, times, hashtag rotations, and thumbnail guidance
- Total: 42 posts across 3 profiles

## Recovery Steps

1. Delete ALL incorrectly scheduled/posted content from Later
2. Manually recreate each post following the schedule document exactly
3. For each post: select correct profile, correct video, correct caption, correct time, Notify mode, face thumbnail
4. Verify each post after creation before moving to the next
