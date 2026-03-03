import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exchangeCode, getUserInfo } from "@/lib/docusign";
import { dbRun, dbGet } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/portal/dashboard", req.url));
  }

  // Try session from cookie first
  let userId: string | null = null;
  const session = await getSession();
  if (session) {
    userId = session.userId;
  }

  // If no session cookie (cross-site redirect stripped it), find the most recent user
  if (!userId) {
    const recentUser = await dbGet<{ id: string }>(
      "SELECT id FROM users ORDER BY rowid DESC LIMIT 1"
    );
    if (!recentUser) {
      console.error("DocuSign callback: no session and no users found");
      return NextResponse.redirect(new URL("/portal", req.url));
    }
    userId = recentUser.id;
  }

  try {
    console.log("DocuSign callback: exchanging code for tokens...");
    const tokens = await exchangeCode(code);
    console.log("DocuSign callback: got tokens OK");

    const accessExpires = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Try to get user info (email, accountId) — but don't fail if it doesn't work
    let email = "";
    let accountId = "";
    let baseUri = "https://demo.docusign.net";
    try {
      const userInfo = await getUserInfo(tokens.access_token);
      email = userInfo.email;
      accountId = userInfo.accountId;
      baseUri = userInfo.baseUri;
      console.log("DocuSign callback: user info:", email, "accountId:", accountId);
    } catch (infoErr) {
      console.warn("DocuSign callback: getUserInfo failed (will use env vars):", infoErr);
      accountId = process.env.DOCUSIGN_ACCOUNT_ID || "";
      baseUri = process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net";
    }

    // Delete existing connection for THIS user only (each user has their own)
    await dbRun("DELETE FROM docusign_connections WHERE user_id = ?", [userId]);

    const id = uuid();
    await dbRun(
      `INSERT INTO docusign_connections (id, user_id, access_token, refresh_token, access_token_expires_at, email, account_id, base_uri)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, tokens.access_token, tokens.refresh_token, accessExpires, email, accountId, baseUri]
    );

    console.log("DocuSign connected successfully for user:", userId);
    return NextResponse.redirect(new URL("/portal/dashboard?ds_connected=1", req.url));
  } catch (err) {
    console.error("DocuSign callback error:", err);
    // Show the error directly so user can report it
    const message = err instanceof Error ? err.message : String(err);
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
        <h2>DocuSign Connection Error</h2>
        <p style="color:#666">${message}</p>
        <br/><a href="/portal/dashboard">Back to Dashboard</a>
      </body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }
}
