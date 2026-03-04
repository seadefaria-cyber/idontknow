import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbAll, dbRun } from "@/lib/db";
import { analyzeLegalDocument } from "@/lib/ai";
import { uploadToS3 } from "@/lib/s3";
import { getConnection, refreshTokenIfNeeded, uploadFileToDrive, getOrCreateFolder } from "@/lib/google-drive";
import { v4 as uuid } from "uuid";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

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

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string || "contract";
    const status = formData.get("status") as string || "draft";

    // Admin can specify a client; clients upload to their own account
    const userId = session.role === "admin"
      ? (formData.get("userId") as string) || session.userId
      : session.userId;

    if (!file || !title) return NextResponse.json({ error: "File and title required" }, { status: 400 });

    const docId = uuid();
    const ext = path.extname(file.name);
    const storedName = `legal-${docId}${ext}`;
    const s3Key = `${userId}/legal/${storedName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    await uploadToS3(s3Key, buffer, file.type || "application/octet-stream");

    // Extract PDF text for AI analysis
    let pdfText = "";
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      try {
        const parsed = await pdfParse(buffer);
        pdfText = parsed.text;
      } catch { /* fallback to filename */ }
    }

    // AI analysis (best-effort — works without OpenAI key)
    let finalTitle = title;
    let finalCategory = category;
    let finalStatus = status;
    let aiSummary: string | null = null;

    try {
      const ai = await analyzeLegalDocument(file.name, file.type || "application/octet-stream", pdfText);
      if (ai) {
        if (title.length <= 10) finalTitle = ai.suggestedTitle;
        if (category === "contract" || category === "other") finalCategory = ai.category;
        aiSummary = ai.summary;
        if (ai.signed && finalStatus !== "signed") finalStatus = "signed";
      }
    } catch {
      // AI analysis is optional
    }

    await dbRun(`
      INSERT INTO legal_documents (id, user_id, title, category, status, file_name, original_name, file_path, file_size, mime_type, ai_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [docId, userId, finalTitle, finalCategory, finalStatus, storedName, file.name, s3Key, buffer.length, file.type || "application/octet-stream", aiSummary]);

    // Two-way sync: upload to client's Google Drive "Legal" folder if connected
    try {
      const driveConn = await getConnection(userId);
      if (driveConn) {
        const freshConn = await refreshTokenIfNeeded(driveConn);
        const folderId = await getOrCreateFolder(freshConn.access_token, "Legal");
        await uploadFileToDrive(freshConn.access_token, file.name, file.type || "application/octet-stream", buffer, folderId);
      }
    } catch {
      // Drive upload is best-effort
    }

    return NextResponse.json({ id: docId });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
