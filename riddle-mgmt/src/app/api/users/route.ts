import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import getDb from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const db = getDb();
  const users = db.prepare("SELECT id, username, display_name, role, created_at FROM users ORDER BY created_at DESC").all();

  return NextResponse.json({ users });
}
