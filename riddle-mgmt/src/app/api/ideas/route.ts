import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbAll, dbRun } from "@/lib/db";
import { v4 as uuid } from "uuid";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let ideas;
  if (session.role === "admin") {
    ideas = await dbAll(
      `SELECT i.*, u.display_name as client_name FROM ideas i LEFT JOIN users u ON i.user_id = u.id ORDER BY i.created_at DESC`
    );
  } else {
    ideas = await dbAll(
      `SELECT * FROM ideas WHERE user_id = ? ORDER BY created_at DESC`,
      [session.userId]
    );
  }

  return NextResponse.json({ ideas });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, category, clientId } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const userId = session.role === "admin" && clientId ? clientId : session.userId;

  await dbRun(
    `INSERT INTO ideas (id, user_id, title, body, category) VALUES (?, ?, ?, ?, ?)`,
    [uuid(), userId, title, body || null, category || "other"]
  );

  return NextResponse.json({ ok: true });
}
