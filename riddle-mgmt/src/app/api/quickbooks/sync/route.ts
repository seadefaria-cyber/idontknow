import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getConnection, syncExpenses } from "@/lib/quickbooks";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conn = await getConnection(session.userId) || await getConnection();
  if (!conn) {
    return NextResponse.json({ error: "QuickBooks not connected" }, { status: 400 });
  }

  try {
    const result = await syncExpenses(conn);
    return NextResponse.json({
      success: true,
      synced: result.total,
      counts: result.counts,
      errors: result.errors,
      realm_id: conn.realm_id,
    });
  } catch (err) {
    return NextResponse.json({ error: "Sync failed", details: String(err) }, { status: 500 });
  }
}
