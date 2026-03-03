import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbRun, dbGet } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, title, body, category } = await req.json();

  const idea = await dbGet<{ id: string; user_id: string }>("SELECT id, user_id FROM ideas WHERE id = ?", [id]);
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "admin" && idea.user_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (status) await dbRun("UPDATE ideas SET status = ? WHERE id = ?", [status, id]);
  if (title) await dbRun("UPDATE ideas SET title = ? WHERE id = ?", [title, id]);
  if (body !== undefined) await dbRun("UPDATE ideas SET body = ? WHERE id = ?", [body, id]);
  if (category) await dbRun("UPDATE ideas SET category = ? WHERE id = ?", [category, id]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const idea = await dbGet<{ id: string; user_id: string }>("SELECT id, user_id FROM ideas WHERE id = ?", [id]);
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "admin" && idea.user_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbRun("DELETE FROM ideas WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
