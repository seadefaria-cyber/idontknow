import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exchangeCode, getConnection, syncExpenses } from "@/lib/quickbooks";
import { dbRun } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const realmId = searchParams.get("realmId");

  if (!code || !realmId) {
    return NextResponse.redirect(new URL("/portal/dashboard?qb_error=missing_params", request.url));
  }

  try {
    const tokens = await exchangeCode(code);

    // Remove this user's existing connection only
    await dbRun("DELETE FROM quickbooks_connections WHERE user_id = ?", [session.userId]);

    const accessExpires = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const refreshExpires = new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000).toISOString();

    // Get company name
    let companyName = "QuickBooks";
    try {
      const baseUrl = process.env.QB_ENVIRONMENT === "production"
        ? "https://quickbooks.api.intuit.com"
        : "https://sandbox-quickbooks.api.intuit.com";
      const infoRes = await fetch(`${baseUrl}/v3/company/${realmId}/companyinfo/${realmId}`, {
        headers: {
          "Authorization": `Bearer ${tokens.access_token}`,
          "Accept": "application/json",
        },
      });
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        companyName = infoData.CompanyInfo?.CompanyName || "QuickBooks";
      }
    } catch {
      // Use default name
    }

    await dbRun(
      "INSERT INTO quickbooks_connections (id, user_id, realm_id, access_token, refresh_token, access_token_expires_at, refresh_token_expires_at, company_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [uuid(), session.userId, realmId, tokens.access_token, tokens.refresh_token, accessExpires, refreshExpires, companyName]
    );

    // Auto-sync all expenses on first connect
    try {
      const conn = await getConnection(session.userId);
      if (conn) await syncExpenses(conn);
    } catch {
      // Non-blocking — sync will retry via polling
    }

    return NextResponse.redirect(new URL("/portal/dashboard", request.url));
  } catch {
    return NextResponse.redirect(new URL("/portal/dashboard?qb_error=token_exchange_failed", request.url));
  }
}
