import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet } from "@/lib/db";
import { getDownloadUrl } from "@/lib/s3";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const doc = await dbGet<{
    user_id: string;
    file_path: string;
    original_name: string;
    mime_type: string;
  }>("SELECT * FROM legal_documents WHERE id = ?", [id]);

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "admin" && doc.user_id !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    const url = await getDownloadUrl(doc.file_path, doc.original_name);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
