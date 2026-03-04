import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbAll, dbRun } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { v4 as uuid } from "uuid";
import path from "path";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let statements;
  if (session.role === "admin") {
    statements = await dbAll(`
      SELECT rs.*, u.display_name as client_name
      FROM royalty_statements rs
      JOIN users u ON rs.user_id = u.id
      ORDER BY rs.uploaded_at DESC
    `);
  } else {
    statements = await dbAll(`
      SELECT * FROM royalty_statements WHERE user_id = ? ORDER BY uploaded_at DESC
    `, [session.userId]);
  }

  return NextResponse.json({ statements });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;
  const category = (formData.get("category") as string) || "recording";
  const period = (formData.get("period") as string) || null;
  const amount = formData.get("amount") ? parseFloat(formData.get("amount") as string) : null;

  // Admin can specify a client; clients upload to their own account
  const userId = session.role === "admin"
    ? (formData.get("userId") as string) || session.userId
    : session.userId;

  if (!file || !title) {
    return NextResponse.json({ error: "File and title required" }, { status: 400 });
  }

  const docId = uuid();
  const ext = path.extname(file.name);
  const storedName = `royalty-${docId}${ext}`;
  const s3Key = `${userId}/royalties/${storedName}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await uploadToS3(s3Key, buffer, file.type || "application/octet-stream");

  await dbRun(`
    INSERT INTO royalty_statements (id, user_id, title, category, period, amount, file_name, original_name, file_path, file_size, mime_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [docId, userId, title, category, period, amount, storedName, file.name, s3Key, buffer.length, file.type || "application/octet-stream"]);

  return NextResponse.json({ id: docId });
}
