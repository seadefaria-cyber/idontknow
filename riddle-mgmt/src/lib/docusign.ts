import { dbGet, dbRun } from "@/lib/db";

// Use env to pick demo vs production
const isDemo = (process.env.DOCUSIGN_BASE_URL || "").includes("demo");
const DOCUSIGN_AUTH_URL = isDemo
  ? "https://account-d.docusign.com/oauth/auth"
  : "https://account.docusign.com/oauth/auth";
const DOCUSIGN_TOKEN_URL = isDemo
  ? "https://account-d.docusign.com/oauth/token"
  : "https://account.docusign.com/oauth/token";

interface DocuSignConnection {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
  email: string | null;
  account_id: string | null;
  base_uri: string | null;
  connected_at: string;
}

interface DocuSignTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    scope: "signature openid",
    client_id: process.env.DOCUSIGN_CLIENT_ID || "",
    redirect_uri: process.env.DOCUSIGN_REDIRECT_URI || "",
    state,
  });
  return `${DOCUSIGN_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<DocuSignTokenResponse> {
  const auth = Buffer.from(
    `${process.env.DOCUSIGN_CLIENT_ID}:${process.env.DOCUSIGN_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(DOCUSIGN_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DocuSign token exchange failed: ${text}`);
  }
  return res.json();
}

export async function getUserInfo(accessToken: string): Promise<{ email: string; name: string; accountId: string; baseUri: string }> {
  const userinfoUrl = isDemo ? "https://account-d.docusign.com/oauth/userinfo" : "https://account.docusign.com/oauth/userinfo";
  const res = await fetch(userinfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to get DocuSign user info");
  const data = await res.json();
  // Get the default account
  const account = data.accounts?.find((a: { is_default: boolean }) => a.is_default) || data.accounts?.[0];
  return {
    email: data.email || "",
    name: data.name || "",
    accountId: account?.account_id || "",
    baseUri: account?.base_uri || "https://demo.docusign.net",
  };
}

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

export async function refreshTokenIfNeeded(conn: DocuSignConnection): Promise<DocuSignConnection> {
  const raw = conn.access_token_expires_at;
  const expiresAt = new Date(raw.endsWith("Z") ? raw : raw + "Z").getTime();
  const now = Date.now();

  if (expiresAt - now > 5 * 60 * 1000) {
    return conn;
  }

  const auth = Buffer.from(
    `${process.env.DOCUSIGN_CLIENT_ID}:${process.env.DOCUSIGN_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(DOCUSIGN_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: conn.refresh_token,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh DocuSign token");
  }

  const tokens: DocuSignTokenResponse = await res.json();
  const accessExpires = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await dbRun(
    "UPDATE docusign_connections SET access_token = ?, refresh_token = ?, access_token_expires_at = ? WHERE id = ?",
    [tokens.access_token, tokens.refresh_token || conn.refresh_token, accessExpires, conn.id]
  );

  return {
    ...conn,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || conn.refresh_token,
    access_token_expires_at: accessExpires,
  };
}

function apiBase(conn?: DocuSignConnection | null): string {
  const base = conn?.base_uri || process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net";
  const accountId = conn?.account_id || process.env.DOCUSIGN_ACCOUNT_ID;
  return `${base}/restapi/v2.1/accounts/${accountId}`;
}

export async function createEnvelope(
  accessToken: string,
  documentBase64: string,
  documentName: string,
  signerEmail: string,
  signerName: string,
  signerClientUserId: string
): Promise<{ envelopeId: string }> {
  const res = await fetch(`${apiBase()}/envelopes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documents: [
        {
          documentBase64,
          name: documentName,
          fileExtension: documentName.split(".").pop() || "pdf",
          documentId: "1",
        },
      ],
      recipients: {
        signers: [
          {
            email: signerEmail,
            name: signerName,
            recipientId: "1",
            clientUserId: signerClientUserId,
            routingOrder: "1",
            tabs: {
              signHereTabs: [
                {
                  documentId: "1",
                  pageNumber: "1",
                  xPosition: "100",
                  yPosition: "700",
                },
              ],
              dateSignedTabs: [
                {
                  documentId: "1",
                  pageNumber: "1",
                  xPosition: "100",
                  yPosition: "750",
                },
              ],
            },
          },
        ],
      },
      status: "sent",
      emailSubject: `Please sign: ${documentName}`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DocuSign create envelope failed: ${text}`);
  }

  const data = await res.json();
  return { envelopeId: data.envelopeId };
}

export async function getSigningUrl(
  accessToken: string,
  envelopeId: string,
  signerEmail: string,
  signerName: string,
  signerClientUserId: string,
  returnUrl: string
): Promise<string> {
  const res = await fetch(`${apiBase()}/envelopes/${envelopeId}/views/recipient`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      returnUrl,
      authenticationMethod: "none",
      email: signerEmail,
      userName: signerName,
      clientUserId: signerClientUserId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DocuSign get signing URL failed: ${text}`);
  }

  const data = await res.json();
  return data.url;
}

export async function getEnvelopeStatus(
  accessToken: string,
  envelopeId: string
): Promise<string> {
  const res = await fetch(`${apiBase()}/envelopes/${envelopeId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error("Failed to get envelope status");

  const data = await res.json();
  return data.status;
}

export interface DocuSignEnvelope {
  envelopeId: string;
  emailSubject: string;
  status: string; // "completed" | "sent" | "delivered" | "voided" | "declined" | "created"
  sentDateTime?: string;
  completedDateTime?: string;
  createdDateTime?: string;
  statusChangedDateTime?: string;
}

export async function listEnvelopes(accessToken: string, conn?: DocuSignConnection | null): Promise<DocuSignEnvelope[]> {
  // Fetch envelopes from the last 2 years
  const fromDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    from_date: fromDate,
    order: "desc",
    order_by: "status_changed",
  });

  const url = `${apiBase(conn)}/envelopes?${params.toString()}`;
  console.log("DocuSign listEnvelopes URL:", url);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("DocuSign list envelopes failed:", res.status, text);
    return [];
  }

  const data = await res.json();
  console.log("DocuSign listEnvelopes result count:", data.resultSetSize, "total:", data.totalSetSize);
  return (data.envelopes || []) as DocuSignEnvelope[];
}
