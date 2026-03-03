import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbRun } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete only this user's DocuSign connection
  await dbRun("DELETE FROM docusign_connections WHERE user_id = ?", [session.userId]);
  return NextResponse.json({ success: true });
}
