import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbAll, dbRun } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const links = await dbAll(
    `SELECT * FROM links WHERE client_id = ? ORDER BY sort_order ASC, created_at DESC`,
    [session.userId]
  );

  return NextResponse.json({ links });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { title, url, category, icon, clientId } = await req.json();
  if (!title || !url || !clientId) {
    return NextResponse.json({ error: "title, url, and clientId required" }, { status: 400 });
  }

  const id = uuid();
  await dbRun(
    `INSERT INTO links (id, client_id, title, url, category, icon) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, clientId, title, url, category || "other", icon || null]
  );

  return NextResponse.json({ id });
}
