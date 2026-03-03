import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getConnection, refreshTokenIfNeeded, listDocs } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conn = await getConnection(session.userId);

  if (!conn) {
    return NextResponse.json({ connected: false, docs: [] });
  }

  try {
    const freshConn = await refreshTokenIfNeeded(conn);
    const docs = await listDocs(freshConn.access_token);
    return NextResponse.json({ connected: true, docs });
  } catch {
    return NextResponse.json({ connected: true, docs: [], error: "Failed to fetch docs" });
  }
}
