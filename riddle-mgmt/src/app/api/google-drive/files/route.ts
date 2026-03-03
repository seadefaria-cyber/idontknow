import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getConnection, refreshTokenIfNeeded, listFilesWithFolders } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conn = await getConnection(session.userId);

  if (!conn) {
    return NextResponse.json({ connected: false, email: null, files: [] });
  }

  try {
    const freshConn = await refreshTokenIfNeeded(conn);
    const files = await listFilesWithFolders(freshConn.access_token);
    return NextResponse.json({ connected: true, email: conn.email, files });
  } catch {
    return NextResponse.json({ connected: true, email: conn.email, files: [], error: "Failed to fetch files" });
  }
}
