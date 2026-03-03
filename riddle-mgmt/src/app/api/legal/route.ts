import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbAll, dbRun } from "@/lib/db";
import { analyzeLegalDocument } from "@/lib/ai";
import { uploadToS3 } from "@/lib/s3";
import { v4 as uuid } from "uuid";
import path from "path";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let documents;
  if (session.role === "admin") {
    documents = await dbAll(`
      SELECT ld.*, u.display_name as client_name
      FROM legal_documents ld
      JOIN users u ON ld.user_id = u.id
      ORDER BY ld.uploaded_at DESC
    `);
  } else {
    documents = await dbAll(`
      SELECT * FROM legal_documents WHERE user_id = ? ORDER BY uploaded_at DESC
    `, [session.userId]);
  }

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;
  const category = formData.get("category") as string || "contract";
  const userId = formData.get("userId") as string;
  const status = formData.get("status") as string || "draft";

  if (!file || !title || !userId) return NextResponse.json({ error: "File, title, and client required" }, { status: 400 });

  const docId = uuid();
  const ext = path.extname(file.name);
  const storedName = `legal-${docId}${ext}`;
  const s3Key = `${userId}/legal/${storedName}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload to S3
  await uploadToS3(s3Key, buffer, file.type || "application/octet-stream");

  // AI analysis
  let finalTitle = title;
  let finalCategory = category;
  let aiSummary: string | null = null;

  const ai = await analyzeLegalDocument(file.name, file.type || "application/octet-stream");
  if (ai) {
    if (title.length <= 10) finalTitle = ai.suggestedTitle;
    finalCategory = ai.category;
    aiSummary = ai.summary;
  }

  await dbRun(`
    INSERT INTO legal_documents (id, user_id, title, category, status, file_name, original_name, file_path, file_size, mime_type, ai_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [docId, userId, finalTitle, finalCategory, status, storedName, file.name, s3Key, buffer.length, file.type || "application/octet-stream", aiSummary]);

  return NextResponse.json({ id: docId });
}
