---
title: Add Commissions Upload Section to Riddle MGMT Portal
category: integration-issues
tags: [next.js, turso, s3, google-drive-sync, file-uploads, google-sign-in, dashboard, portal-feature]
components: [CommissionsSection.tsx, /api/commissions, /api/public/commissions, /portal/commission/[username], TabBar, db.ts, google-drive.ts]
severity: feature
date_solved: 2026-03-12
symptoms:
  - Portal lacked centralized commission file management
  - No public shareable link for commission uploads (like expenses had)
  - No Google Drive sync for commission documents
  - No review/approve/reject workflow for commissions
root_cause: "Feature gap — commissions needed same treatment as expenses/reimbursements with public submission, S3 storage, Google Drive sync, and admin review"
related_docs:
  - docs/solutions/integration-issues/presigned-s3-uploads-vercel-limits-20260306.md
  - docs/solutions/integration-issues/docusign-oauth-integration-20260303.md
---

# Commission Upload Feature — Riddle MGMT Portal

## Problem

Portal needed a way for external people to upload commission documents to a specific client, with Google Sign-In verification, file storage in S3 + Google Drive, and admin review workflow. Same pattern as the existing Expenses feature but for commissions.

## Solution

Replicated the Expenses architecture exactly across 11 new/modified files (1253 lines).

### Pattern: Public Upload Page + Authenticated Dashboard

This is the reusable pattern for any "external person submits something to a client" feature:

```
External link:  /portal/{feature}/[username]
                    ↓
Google Sign-In verification
                    ↓
Form submission → /api/public/{feature}
                    ↓
Server: verify token → lookup client → upload to S3 → sync to Drive → insert DB row
                    ↓
Admin sees it in dashboard tab → approve/reject
```

### Files Created

| File | Purpose |
|------|---------|
| `src/lib/db.ts` | Added `commissions` table to schema |
| `src/lib/google-drive.ts` | Added "commissions" folder recognition in categorizer |
| `src/components/portal/TabBar.tsx` | Added "Commissions" tab (key: 6) |
| `src/components/portal/CommissionsSection.tsx` | Dashboard section with stats, upload form, review UI |
| `src/app/portal/dashboard/page.tsx` | Wired section + footer link |
| `src/app/portal/commission/[username]/page.tsx` | Public upload page (Google Sign-In) |
| `src/app/portal/commissions/page.tsx` | Authenticated upload page |
| `src/app/api/commissions/route.ts` | GET list + POST create |
| `src/app/api/commissions/[id]/route.ts` | GET/PATCH/DELETE individual |
| `src/app/api/commissions/[id]/download/route.ts` | File download via S3 signed URL |
| `src/app/api/public/commissions/route.ts` | Public submission (Google token verified) |

### Database Table

```sql
CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount REAL,
  status TEXT DEFAULT 'submitted',  -- submitted | approved | rejected
  admin_notes TEXT,
  file_name TEXT,
  original_name TEXT,
  file_path TEXT,                    -- S3 key: {clientId}/commissions/{fileName}
  file_size INTEGER,
  mime_type TEXT,
  submitter_name TEXT,               -- from Google Sign-In
  submitter_email TEXT,              -- from Google Sign-In
  submitter_google_id TEXT,
  submitted_at TEXT DEFAULT (datetime('now')),
  reviewed_at TEXT,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Google Drive Sync

Files upload to S3 first, then best-effort sync to a Google Drive folder called "Commissions":

```typescript
// In both /api/public/commissions and /api/commissions
const driveConn = await getConnection(clientId);
if (driveConn) {
  const freshConn = await refreshTokenIfNeeded(driveConn);
  const folderId = await getOrCreateFolder(freshConn.access_token, "Commissions");
  await uploadFileToDrive(freshConn.access_token, originalName, mimeType, fileBuffer, folderId);
}
```

The `getOrCreateFolder` function checks if a "Commissions" folder exists in the client's Drive, creates it if not, and caches the folder ID for subsequent uploads.

### Key Design Decisions

1. **Exact pattern replication** from Expenses — reduces cognitive load, consistent UX
2. **Dual upload paths**: Public form (external people) + authenticated upload (staff/admin)
3. **S3 + Drive dual storage**: S3 for reliable storage, Drive for client visibility
4. **Best-effort Drive sync**: Drive upload failure doesn't block submission
5. **Role-based access**: Admin sees all commissions, client sees only their own

## How to Reuse This Pattern for New Features

To add another upload feature (e.g., "Invoices", "Contracts"):

1. Add table to `db.ts` schema (copy commissions table, rename)
2. Create `/api/public/{feature}/route.ts` (copy from `/api/public/commissions`)
3. Create `/api/{feature}/route.ts` + `[id]/route.ts` + `[id]/download/route.ts`
4. Create `/portal/{feature}/[username]/page.tsx` (public form)
5. Create `/portal/{feature}s/page.tsx` (authenticated page)
6. Create `{Feature}Section.tsx` component
7. Add tab to `TabBar.tsx` + wire in `dashboard/page.tsx`
8. Add folder name to `google-drive.ts` categorizer

Total: ~8 files, ~1200 lines. About 90% is copy-paste with find/replace.

## Prevention / Future Notes

- If file sizes exceed Vercel's 4.5MB body limit, switch to the presigned URL pattern (see related doc on presigned S3 uploads)
- The public API has no rate limiting — consider adding if abuse becomes an issue
- Google Drive sync requires the client to have connected their Google account in the portal integrations panel
