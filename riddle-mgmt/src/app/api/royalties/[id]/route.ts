import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet, dbRun } from "@/lib/db";
import { getDownloadUrl } from "@/lib/s3";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const doc = await dbGet<{ file_path: string; original_name: string; user_id: string }>(
    "SELECT file_path, original_name, user_id FROM royalty_statements WHERE id = ?",
    [id]
  );

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "admin" && doc.user_id !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const url = await getDownloadUrl(doc.file_path);
  return NextResponse.redirect(url);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { id } = await params;
  await dbRun("DELETE FROM royalty_statements WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}
