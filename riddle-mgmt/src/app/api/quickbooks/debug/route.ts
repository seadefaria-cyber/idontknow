import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getConnection, refreshTokenIfNeeded } from "@/lib/quickbooks";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conn = await getConnection(session.userId);
  if (!conn) {
    return NextResponse.json({ error: "No QB connection found", userId: session.userId });
  }

  // Try to refresh the token
  let freshConn;
  try {
    freshConn = await refreshTokenIfNeeded(conn);
  } catch (err) {
    return NextResponse.json({
      error: "Token refresh failed",
      details: String(err),
      realm_id: conn.realm_id,
      token_expires: conn.access_token_expires_at,
      now: new Date().toISOString(),
    });
  }

  // Try a simple query
  const QB_BASE_URL = process.env.QB_ENVIRONMENT === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";

  const results: Record<string, unknown> = {
    realm_id: freshConn.realm_id,
    company_name: freshConn.company_name,
    qb_environment: process.env.QB_ENVIRONMENT || "NOT SET",
    base_url: QB_BASE_URL,
    token_expires: freshConn.access_token_expires_at,
    token_first_chars: freshConn.access_token.substring(0, 10) + "...",
  };

  // Test each entity type
  for (const entity of ["CompanyInfo", "Customer", "Invoice", "Purchase", "Payment", "Bill"]) {
    try {
      const query = entity === "CompanyInfo"
        ? `${QB_BASE_URL}/v3/company/${freshConn.realm_id}/companyinfo/${freshConn.realm_id}`
        : `${QB_BASE_URL}/v3/company/${freshConn.realm_id}/query?query=${encodeURIComponent(`SELECT * FROM ${entity} MAXRESULTS 3`)}`;

      const res = await fetch(query, {
        headers: {
          "Authorization": `Bearer ${freshConn.access_token}`,
          "Accept": "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        results[entity] = { status: res.status, error: text.substring(0, 500) };
      } else {
        const data = await res.json();
        if (entity === "CompanyInfo") {
          results[entity] = { status: 200, name: data.CompanyInfo?.CompanyName };
        } else {
          const qr = data.QueryResponse || {};
          const items = qr[entity] || [];
          results[entity] = { status: 200, count: items.length, totalCount: qr.totalCount, items };
        }
      }
    } catch (err) {
      results[entity] = { error: String(err) };
    }
  }

  return NextResponse.json(results);
}
