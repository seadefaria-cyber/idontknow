import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet } from "@/lib/db";
import { getDownloadUrl } from "@/lib/s3";
import jwt from "jsonwebtoken";

const FILE_ACCESS_SECRET = process.env.FILE_SECRET || "riddle-file-access-secret";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Download token required" }, { status: 400 });
  }

  try {
    // Verify the download token
    const payload = jwt.verify(token, FILE_ACCESS_SECRET) as { fileId: string; userId: string };

    if (payload.fileId !== id || payload.userId !== session.userId) {
      return NextResponse.json({ error: "Invalid download token" }, { status: 403 });
    }

    const file = await dbGet<{
      id: string;
      user_id: string;
      file_path: string;
      original_name: string;
      mime_type: string;
    }>("SELECT * FROM files WHERE id = ?", [id]);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (session.role !== "admin" && file.user_id !== session.userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Redirect to S3 signed URL for download
    const url = await getDownloadUrl(file.file_path, file.original_name);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "Download failed or token expired" }, { status: 403 });
  }
}
