import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getConnection } from "@/lib/quickbooks";
import { dbRun } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conn = await getConnection(session.userId);

  if (conn) {
    // Only delete this user's QB expenses and connection
    await dbRun("DELETE FROM qb_expenses WHERE realm_id = ?", [conn.realm_id]);
    await dbRun("DELETE FROM quickbooks_connections WHERE user_id = ?", [session.userId]);
  }

  return NextResponse.json({ success: true });
}
