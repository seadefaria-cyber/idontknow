import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbAll, dbRun } from "@/lib/db";
import { analyzeLegalDocument } from "@/lib/ai";
import { uploadToS3, downloadFromS3 } from "@/lib/s3";
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

  const contentType = req.headers.get("content-type") || "";

  try {
    // Presigned flow: JSON body with s3Key (file already uploaded to S3)
    if (contentType.includes("application/json")) {
      return await handlePresignedUpload(req, session);
    }

    // Legacy flow: FormData with file (for small files < 4.5MB)
    return await handleFormDataUpload(req, session);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handlePresignedUpload(
  req: NextRequest,
  session: { userId: string; role: string }
) {
  const body = await req.json();
  const { docId, s3Key, storedName, title, category, status, originalName, fileSize, mimeType, userId: requestedUserId } = body;

  if (!docId || !s3Key || !title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const userId = session.role === "admin" && requestedUserId
    ? requestedUserId
    : session.userId;

  const finalMimeType = mimeType || "application/octet-stream";
  let finalTitle = title;
  let finalCategory = category || "contract";
  let finalStatus = status || "draft";
  let aiSummary: string | null = null;

  // AI analysis — download from S3 for PDF text extraction
  try {
    let pdfText = "";
    if (finalMimeType === "application/pdf" || (originalName || "").toLowerCase().endsWith(".pdf")) {
      try {
        const buffer = await downloadFromS3(s3Key);
        const parsed = await pdfParse(buffer);
        pdfText = parsed.text;
      } catch { /* skip PDF parse */ }
    }
    const ai = await analyzeLegalDocument(originalName || title, finalMimeType, pdfText);
    if (ai) {
      if (title.length <= 10) finalTitle = ai.suggestedTitle;
      if (finalCategory === "contract" || finalCategory === "other") finalCategory = ai.category;
      aiSummary = ai.summary;
      if (ai.signed && finalStatus !== "signed") finalStatus = "signed";
    }
  } catch {
    // AI analysis is optional
  }

  await dbRun(`
    INSERT INTO legal_documents (id, user_id, title, category, status, file_name, original_name, file_path, file_size, mime_type, ai_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [docId, userId, finalTitle, finalCategory, finalStatus, storedName, originalName || title, s3Key, fileSize || 0, finalMimeType, aiSummary]);

  // Drive sync
  try {
    const driveConn = await getConnection(userId);
    if (driveConn) {
      const freshConn = await refreshTokenIfNeeded(driveConn);
      const folderId = await getOrCreateFolder(freshConn.access_token, "Legal");
      const buffer = await downloadFromS3(s3Key);
      await uploadFileToDrive(freshConn.access_token, originalName || title, finalMimeType, buffer, folderId);
    }
  } catch {
    // Drive upload is best-effort
  }

  return NextResponse.json({ id: docId });
}

async function handleFormDataUpload(
  req: NextRequest,
  session: { userId: string; role: string }
) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;
  const category = formData.get("category") as string || "contract";
  const status = formData.get("status") as string || "draft";

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

  await uploadToS3(s3Key, buffer, file.type || "application/octet-stream");

  let pdfText = "";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    try {
      const parsed = await pdfParse(buffer);
      pdfText = parsed.text;
    } catch { /* fallback to filename */ }
  }

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
}
