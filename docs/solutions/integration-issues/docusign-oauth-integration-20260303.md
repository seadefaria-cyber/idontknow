---
title: "DocuSign OAuth Integration — Per-User Connections, Token Bugs & Go Live"
date: 2026-03-03
category: integration-issues
component: docusign
severity: high
status: resolved
tags:
  - docusign
  - oauth
  - token-refresh
  - per-user-connections
  - demo-vs-production
  - api-integration
  - next-js
  - vercel
related:
  - claude-api-to-cli-migration-AIPipeline-20260216.md
  - linux-to-mac-portability.md
---

# DocuSign OAuth Integration — Per-User Connections, Token Bugs & Go Live

## Problem Summary

Multiple issues discovered while integrating DocuSign eSignature API into the Riddle MGMT portal (Next.js on Vercel). The integration needed to support per-user DocuSign connections where each client connects their own account.

**Symptoms:**
- `unauthorized_client` error during OAuth token exchange
- Token refresh always failing (NaN comparison)
- getUserInfo returning 403
- Envelopes API returning 0 results
- Production OAuth showing "client id not registered"

## Root Causes

### 1. Token Refresh Double-Z Bug
`access_token_expires_at` stored as ISO string ending in "Z" (e.g., `2026-03-03T07:08:12.000Z`). Code blindly appended "Z", creating `2026-03-03T07:08:12.000ZZ` which `new Date()` parsed as NaN. Token was always treated as expired.

### 2. Missing `openid` OAuth Scope
Scope was `"signature"` but the `/oauth/userinfo` endpoint requires `openid` scope. Without it, getUserInfo fails with 403 and no account_id/base_uri is stored.

### 3. Wrong Client Secret on Vercel
`DOCUSIGN_CLIENT_SECRET` env var had wrong value. DocuSign returned `{"error":"invalid_grant","error_description":"unauthorized_client"}`.

### 4. Single Global Connection Architecture
Original design stored one DocuSign connection for all users. Each client needed their own connection to their own DocuSign account.

### 5. Demo vs Production Environment
Integration key created in sandbox only works at `account-d.docusign.com`. Production requires completing the "Go Live" review process, which requires the DocuSign account to have an API-enabled plan (Standard $25/mo+).

## Solutions

### Fix 1: Safe Date Parsing for Token Refresh

**File:** `src/lib/docusign.ts`

```typescript
// Before (broken):
const expiresAt = new Date(conn.access_token_expires_at + "Z").getTime();

// After (fixed):
const raw = conn.access_token_expires_at;
const expiresAt = new Date(raw.endsWith("Z") ? raw : raw + "Z").getTime();
```

**Lesson:** Never blindly append timezone suffixes to date strings. Always check first.

### Fix 2: Add `openid` to OAuth Scope

**File:** `src/lib/docusign.ts`

```typescript
export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    scope: "signature openid",  // was just "signature"
    client_id: process.env.DOCUSIGN_CLIENT_ID || "",
    redirect_uri: process.env.DOCUSIGN_REDIRECT_URI || "",
    state,
  });
  return `${DOCUSIGN_AUTH_URL}?${params.toString()}`;
}
```

**Lesson:** DocuSign's userinfo endpoint requires the `openid` scope. Without it, you can sign documents but can't retrieve account metadata.

### Fix 3: Per-User Connection Architecture

**File:** `src/lib/docusign.ts`

```typescript
export async function getConnection(userId?: string): Promise<DocuSignConnection | null> {
  if (userId) {
    const row = await dbGet<DocuSignConnection>(
      "SELECT * FROM docusign_connections WHERE user_id = ? ORDER BY connected_at DESC LIMIT 1",
      [userId]
    );
    return row ?? null;
  }
  // Fallback: get any connection (admin use)
  const row = await dbGet<DocuSignConnection>(
    "SELECT * FROM docusign_connections ORDER BY connected_at DESC LIMIT 1"
  );
  return row ?? null;
}
```

**Callback** (`src/app/api/docusign/callback/route.ts`):
```typescript
// Delete existing connection for THIS user only
await dbRun("DELETE FROM docusign_connections WHERE user_id = ?", [userId]);
```

**All routes updated:** envelopes, send, sign, status, disconnect — all pass `session.userId` to `getConnection()`.

### Fix 4: Dynamic Demo/Production URL Switching

**File:** `src/lib/docusign.ts`

```typescript
const isDemo = (process.env.DOCUSIGN_BASE_URL || "").includes("demo");
const DOCUSIGN_AUTH_URL = isDemo
  ? "https://account-d.docusign.com/oauth/auth"
  : "https://account.docusign.com/oauth/auth";
const DOCUSIGN_TOKEN_URL = isDemo
  ? "https://account-d.docusign.com/oauth/token"
  : "https://account.docusign.com/oauth/token";
```

**To switch to production:** Change `DOCUSIGN_BASE_URL` env var from `https://demo.docusign.net` to `https://na1.docusign.net` and redeploy.

### Fix 5: Resilient OAuth Callback

```typescript
let email = "", accountId = "", baseUri = "https://demo.docusign.net";
try {
  const userInfo = await getUserInfo(tokens.access_token);
  email = userInfo.email;
  accountId = userInfo.accountId;
  baseUri = userInfo.baseUri;
} catch (infoErr) {
  // Fall back to env vars — connection still saved
  accountId = process.env.DOCUSIGN_ACCOUNT_ID || "";
  baseUri = process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net";
}
```

## Prevention Strategies

1. **Date string handling:** Always use safe parsing — check for existing timezone suffixes before appending
2. **OAuth scopes:** Document all required scopes upfront. Test userinfo endpoint immediately after adding OAuth
3. **Env var verification:** After setting secrets on Vercel, verify with `vercel env ls` and test the flow immediately
4. **Multi-tenant design:** Design per-user from the start. Adding user-scoping later requires touching every route
5. **Demo/Production parity:** Use env vars to switch environments, never hardcode URLs. Test the switch early

## DocuSign Go Live Checklist

- [ ] DocuSign account on Standard plan or higher ($25/mo)
- [ ] Submit Go Live request in DocuSign admin → Settings → Apps and Keys
- [ ] Wait for DocuSign review (up to 48 hours)
- [ ] Once approved, update `DOCUSIGN_BASE_URL` to `https://na1.docusign.net`
- [ ] Redeploy to Vercel
- [ ] Disconnect and reconnect DocuSign in portal
- [ ] Verify envelopes appear in Legal tab

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/docusign.ts` | Core lib: auth, tokens, refresh, envelopes, signing |
| `src/app/api/docusign/callback/route.ts` | OAuth callback with resilient fallbacks |
| `src/app/api/docusign/envelopes/route.ts` | Fetch user's envelopes |
| `src/app/api/docusign/connect/route.ts` | Initiate OAuth flow |
| `src/app/api/docusign/disconnect/route.ts` | Per-user disconnect |
| `src/app/api/docusign/send/route.ts` | Send document for signature |
| `src/app/api/docusign/sign/route.ts` | Get embedded signing URL |
| `src/components/portal/LegalSection.tsx` | UI: DocuSign envelopes + portal docs |
| `src/components/portal/IntegrationsSection.tsx` | Connect/disconnect in gear icon |

## Environment Variables

| Variable | Demo Value | Production Value |
|----------|-----------|-----------------|
| `DOCUSIGN_BASE_URL` | `https://demo.docusign.net` | `https://na1.docusign.net` |
| `DOCUSIGN_CLIENT_ID` | Same for both | Same for both |
| `DOCUSIGN_CLIENT_SECRET` | Same for both | Same for both |
| `DOCUSIGN_REDIRECT_URI` | `https://riddlellc.biz/api/docusign/callback` | Same |
| `DOCUSIGN_ACCOUNT_ID` | Demo account ID | Production account ID |

## Related Documentation

- [Claude API to CLI Migration](claude-api-to-cli-migration-AIPipeline-20260216.md) — Environment variable management patterns
- [Linux to Mac Portability](linux-to-mac-portability.md) — Credential storage and graceful degradation patterns
