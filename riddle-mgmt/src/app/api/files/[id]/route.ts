import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet, dbRun } from "@/lib/db";
import { deleteFromS3 } from "@/lib/s3";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const file = await dbGet<{ id: string; user_id: string; file_path: string }>(
    "SELECT id, user_id, file_path FROM files WHERE id = ?", [id]
  );

  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  // Admin can delete any file; clients can only delete their own
  if (session.role !== "admin" && file.user_id !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Delete from S3
  try {
    await deleteFromS3(file.file_path);
  } catch {
    // Continue even if S3 delete fails
  }

  // Delete from DB
  await dbRun("DELETE FROM files WHERE id = ?", [id]);

  return NextResponse.json({ success: true });
}
