import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbAll } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Admin sees all files, clients see only their own
  let files;
  if (session.role === "admin") {
    files = await dbAll(`
      SELECT f.id, f.file_name, f.original_name, f.file_size, f.mime_type, f.folder, f.description, f.uploaded_at, f.ai_classified, u.username as owner
      FROM files f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.uploaded_at DESC
    `);
  } else {
    files = await dbAll(`
      SELECT id, file_name, original_name, file_size, mime_type, folder, description, uploaded_at, ai_classified
      FROM files
      WHERE user_id = ?
      ORDER BY uploaded_at DESC
    `, [session.userId]);
  }

  return NextResponse.json({ files });
}
