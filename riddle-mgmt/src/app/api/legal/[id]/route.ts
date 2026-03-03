import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet, dbRun } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const doc = await dbGet<{ user_id: string }>("SELECT * FROM legal_documents WHERE id = ?", [id]);

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "admin" && (doc as { user_id: string }).user_id !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  return NextResponse.json({ document: doc });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json();

  const validStatuses = ["draft", "pending", "sent", "signed", "expired"];
  if (!validStatuses.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  await dbRun("UPDATE legal_documents SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, id]);

  return NextResponse.json({ success: true });
}
