import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet } from "@/lib/db";
import { getDownloadUrl } from "@/lib/s3";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const item = await dbGet<{
    client_id: string;
    receipt_file_path: string | null;
    receipt_original_name: string | null;
    receipt_mime_type: string | null;
  }>("SELECT * FROM reimbursements WHERE id = ?", [id]);

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "admin" && item.client_id !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (!item.receipt_file_path) return NextResponse.json({ error: "No receipt attached" }, { status: 404 });

  try {
    const url = await getDownloadUrl(item.receipt_file_path, item.receipt_original_name || "receipt");
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "Receipt file not found" }, { status: 404 });
  }
}
