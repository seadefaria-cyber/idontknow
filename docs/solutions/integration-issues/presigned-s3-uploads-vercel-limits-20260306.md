---
title: Presigned S3 Uploads, Mobile Layout & Portal Branding Fixes
date: 2026-03-06
category: integration-issues
tags: [s3-presigned-urls, mobile-responsive, tailwind-css, next.js, vercel, reimbursement-undo, white-label-branding]
severity: medium
component: FilesSection, RoyaltiesSection, ReimbursementsSection, TabBar, DashboardHeader
related_components: [Creative, Royalties, Finances, Dashboard, Homepage, Footer]
symptoms:
  - File uploads fail for files >4.5MB on Vercel serverless functions
  - Tab bar tabs crammed together on iPhone with no spacing
  - Content bleeding to screen edges on mobile (no side padding)
  - Finances hero grid bottom row not centered
  - Gear icon floating awkwardly near tabs
  - No way to undo reimbursed expenses
  - Portal lacked professional branding (no logo, no attribution)
root_cause: >
  Vercel serverless functions enforce a 4.5MB request body limit; file uploads proxied through
  Next.js API routes hit this ceiling. Mobile layout used fixed desktop grid assumptions.
  Reimbursement flow lacked state reversal. Branding not centralized.
resolution: >
  Implemented presigned S3 URL pattern for all upload routes (Creative, Royalties).
  Applied mobile-first Tailwind responsive classes. Added undo button for reimbursed expenses.
  Integrated brand logo and "Powered by" attribution via centralized brand.ts config.
prevention: >
  Always use presigned URLs for file uploads on serverless platforms. Design mobile-first
  with flex-wrap patterns. Audit all status-changing mutations for reversibility. Centralize
  branding in env-driven config from day one.
---

# Presigned S3 Uploads, Mobile Layout & Portal Branding Fixes

## Problem Summary

Five related issues on the Riddle MGMT portal (riddlellc.biz) needed simultaneous resolution:

1. **File uploads fail for large files** — Vercel's 4.5MB serverless body limit blocked uploads
2. **Mobile layout broken** — Tab bar, content padding, finances grid all cramped on iPhone
3. **No undo for reimbursed expenses** — Admin couldn't reverse a paid status
4. **Missing branding** — No logo in portal header, no agency attribution
5. **Awkward UI placement** — Gear icon floating near tabs looked unprofessional

## Solution 1: Presigned S3 Uploads (Vercel Body Limit Bypass)

### Root Cause

Vercel serverless functions limit request bodies to 4.5MB. When users uploaded large media files via FormData, the request was proxied through the Next.js API route, hitting this ceiling and failing silently or with 413 errors.

### Solution: 3-Step Presigned URL Pattern

Bypass Vercel entirely — the browser uploads directly to S3:

1. **Get presigned URL** — Server generates a time-limited S3 PUT URL (~1KB JSON response)
2. **Upload to S3** — Browser PUTs the raw file directly to S3 (no Vercel involvement)
3. **Register metadata** — POST JSON to the API route to save the file record in the database

### Presign Endpoint (`/api/files/presign/route.ts`)

```typescript
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { fileName, contentType, userId: requestedUserId, folder } = await req.json();
  const userId = session.role === "admin" && requestedUserId ? requestedUserId : session.userId;
  const fileId = uuid();
  const ext = path.extname(fileName);
  const storedName = `${fileId}${ext}`;
  const s3Key = `${userId}/${folder || "creative"}/${storedName}`;
  const presignedUrl = await getPresignedUploadUrl(s3Key, contentType || "application/octet-stream");

  return NextResponse.json({ presignedUrl, s3Key, fileId, storedName });
}
```

### Client-Side Upload Flow (`FilesSection.tsx`)

```typescript
// Step 1: Get presigned URL
const presignRes = await fetch("/api/files/presign", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ fileName: file.name, contentType: file.type, userId, folder: "creative" }),
});
const { presignedUrl, s3Key, fileId, storedName } = await presignRes.json();

// Step 2: Upload directly to S3
await fetch(presignedUrl, {
  method: "PUT",
  headers: { "Content-Type": file.type || "application/octet-stream" },
  body: file,  // Raw file, NOT FormData
});

// Step 3: Register in database
await fetch("/api/files/upload", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ fileId, s3Key, storedName, originalName: file.name, fileSize: file.size, mimeType: file.type }),
});
```

### Dual Content-Type Detection (Upload Routes)

Each upload route supports both flows via Content-Type header:

```typescript
const contentType = req.headers.get("content-type") || "";
if (contentType.includes("application/json")) {
  return await handlePresignedUpload(req, session);  // New flow
}
return await handleFormDataUpload(req, session);     // Legacy flow
```

### Critical: S3 403 Fix

Do NOT include `ServerSideEncryption` in presigned URL generation. When the presign includes SSE but the client PUT doesn't match, S3 returns 403 Forbidden.

### Files Changed

| File | Change |
|------|--------|
| `/api/files/presign/route.ts` | New presign endpoint for Creative |
| `/api/royalties/presign/route.ts` | New presign endpoint for Royalties |
| `/api/files/upload/route.ts` | Dual Content-Type handler |
| `/api/files/upload-own/route.ts` | Client self-upload variant |
| `/api/royalties/route.ts` | Dual Content-Type handler |
| `FilesSection.tsx` | 3-step presigned upload flow |
| `RoyaltiesSection.tsx` | 3-step presigned upload flow |

---

## Solution 2: Mobile Layout Fixes

### Tab Bar (`TabBar.tsx`)

```tsx
<div className="flex items-center justify-center gap-1 sm:gap-1 min-w-max mx-auto">
  <button className="px-2.5 sm:px-4 py-3 text-[10px] sm:text-xs tracking-[0.08em] sm:tracking-[0.12em] uppercase whitespace-nowrap">
    {tab.label}
  </button>
</div>
```

Key: `min-w-max` prevents tab text compression. `text-[10px]` and `tracking-[0.08em]` on mobile.

### Finances Hero Grid (`ReimbursementsSection.tsx`)

```tsx
<div className="flex flex-wrap justify-center sm:grid sm:grid-cols-5 gap-1">
  <button className="w-[31%] sm:w-auto py-3 sm:py-2 rounded-lg">
    {/* stat card */}
  </button>
</div>
```

Mobile: `flex-wrap` with `w-[31%]` items (3 per row, centered). Desktop: 5-column grid.

### Dashboard Container

```tsx
<div className="px-5 sm:px-10 md:px-16 pt-8 sm:pt-32 pb-20">
```

Mobile: `px-5` and `pt-8`. Desktop: wider padding and more top space.

---

## Solution 3: Undo Reimbursement Button

Added circular undo arrow on each reimbursed expense item:

```tsx
{role === "admin" && (
  <button
    onClick={(e) => { e.stopPropagation(); handleReview(r.id, "submitted"); }}
    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-orange-500 hover:bg-orange-50 transition-all"
    title="Back to Pending"
  >
    <svg>{/* counter-clockwise arrow */}</svg>
  </button>
)}
```

Uses existing `handleReview(id, status)` with `"submitted"` to revert to pending.

---

## Solution 4: Portal Branding

### Logo in Dashboard Header (`DashboardHeader.tsx`)

```tsx
{brand.logoUrl && (
  <img
    src={brand.logoUrl}
    alt={brand.name}
    className="h-8 sm:h-10 brightness-0 opacity-70 mb-4 animate-fade-in"
  />
)}
```

`brightness-0` converts any colored logo to pure black. `opacity-70` keeps it subtle.

### "Powered by DeFaria Technologies" (Homepage + Portal Footer)

```tsx
{brand.showPoweredBy && (
  <a href={brand.poweredByUrl} target="_blank" rel="noopener noreferrer"
    className="text-[9px] tracking-[0.2em] uppercase text-gray-200 hover:text-gray-400 transition-colors">
    Powered by {brand.poweredByName} Technologies
  </a>
)}
```

All values from `brand.ts` reading `NEXT_PUBLIC_*` env vars — white-label ready.

---

## Solution 5: Footer Cleanup

Removed gear icon from tab area. Added "Settings" text link in footer:

```tsx
<div className="flex items-center gap-4">
  <button onClick={() => setShowSettings(!showSettings)}
    className="text-[10px] tracking-[0.15em] uppercase transition-colors">
    Settings
  </button>
  <span className="text-gray-100">|</span>
  <button onClick={handleLogout}
    className="text-[10px] text-gray-200 hover:text-gray-400 transition-colors tracking-[0.15em] uppercase">
    Sign Out
  </button>
</div>
```

---

## Prevention Strategies

1. **Always use presigned URLs for file uploads on serverless** — Vercel's 4.5MB limit is a hard constraint. Never proxy file bodies through API routes.
2. **Design mobile-first** — Start with `flex flex-wrap` and `w-[31%]` patterns, override with `sm:grid` on desktop. Test on 375px viewport.
3. **Audit status mutations for reversibility** — Every PATCH endpoint that changes status should have an undo path. Use a unified `handleReview(id, status)` accepting all valid states.
4. **Centralize branding in env vars from day one** — `brand.ts` reading `NEXT_PUBLIC_*` env vars prevents hardcoded branding and enables white-labeling.
5. **Keep settings/controls in consistent locations** — Footer for account-level settings, not floating near content areas.

## Related Documentation

- [DocuSign OAuth Integration](docusign-oauth-integration-20260303.md) — Same portal, covers Vercel env var management and per-user connection architecture
