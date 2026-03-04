import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet, dbRun } from "@/lib/db";
import { deleteFromS3 } from "@/lib/s3";

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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const doc = await dbGet<{ user_id: string; file_path: string }>(
    "SELECT user_id, file_path FROM legal_documents WHERE id = ?", [id]
  );

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "admin" && doc.user_id !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Delete file from S3
  try { await deleteFromS3(doc.file_path); } catch { /* file may already be gone */ }

  await dbRun("DELETE FROM legal_documents WHERE id = ?", [id]);

  return NextResponse.json({ success: true });
}
