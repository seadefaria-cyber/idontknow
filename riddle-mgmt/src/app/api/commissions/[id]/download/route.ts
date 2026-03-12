import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet } from "@/lib/db";
import { getDownloadUrl } from "@/lib/s3";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const item = await dbGet<{ client_id: string; file_path: string | null; original_name: string | null }>(
    "SELECT client_id, file_path, original_name FROM commissions WHERE id = ?",
    [id]
  );

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "admin" && item.client_id !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (!item.file_path) {
    return NextResponse.json({ error: "No file attached" }, { status: 404 });
  }

  const url = await getDownloadUrl(item.file_path, item.original_name || undefined);
  return NextResponse.redirect(url);
}
