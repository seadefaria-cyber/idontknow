import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getConnection, refreshTokenIfNeeded, listEnvelopes, getUserInfo } from "@/lib/docusign";
import { dbRun } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conn = await getConnection(session.userId);
  if (!conn) {
    return NextResponse.json({ connected: false, envelopes: [] });
  }

  try {
    const freshConn = await refreshTokenIfNeeded(conn);

    // If account_id is missing (old connection), fetch it from userinfo and store it
    if (!freshConn.account_id) {
      try {
        const info = await getUserInfo(freshConn.access_token);
        if (info.accountId) {
          await dbRun(
            "UPDATE docusign_connections SET account_id = ?, base_uri = ? WHERE id = ?",
            [info.accountId, info.baseUri, freshConn.id]
          );
          freshConn.account_id = info.accountId;
          freshConn.base_uri = info.baseUri;
        }
      } catch {
        // userinfo failed — fall back to env vars
      }
    }

    console.log("DocuSign envelopes: account_id=", freshConn.account_id, "base_uri=", freshConn.base_uri);
    const envelopes = await listEnvelopes(freshConn.access_token, freshConn);
    console.log("DocuSign envelopes: got", envelopes.length, "envelopes");

    // Map to a simpler format for the frontend
    const mapped = envelopes
      .filter((e) => e.status !== "voided" && e.status !== "declined")
      .map((e) => ({
        id: e.envelopeId,
        title: (e.emailSubject || "").replace(/^(Complete with Docusign:\s*|Please sign:\s*)/i, ""),
        status: e.status === "completed" ? "signed" : "pending",
        date: e.completedDateTime || e.sentDateTime || e.createdDateTime || e.statusChangedDateTime || "",
        source: "docusign" as const,
      }));

    return NextResponse.json({ connected: true, envelopes: mapped });
  } catch (err) {
    console.error("DocuSign envelopes error:", err);
    return NextResponse.json({ connected: true, envelopes: [], error: String(err) });
  }
}
