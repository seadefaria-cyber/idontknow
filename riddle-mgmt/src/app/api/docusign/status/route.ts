import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getConnection } from "@/lib/docusign";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conn = await getConnection(session.userId);
  return NextResponse.json({
    connected: !!conn,
    email: conn?.email || null,
  });
}
