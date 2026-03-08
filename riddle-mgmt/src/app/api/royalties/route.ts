import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbAll, dbRun } from "@/lib/db";
import { uploadToS3, downloadFromS3 } from "@/lib/s3";
import { getConnection, refreshTokenIfNeeded, uploadFileToDrive, getOrCreateFolder } from "@/lib/google-drive";
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

  const contentType = req.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      return await handlePresignedUpload(req, session);
    }
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
  const { docId, s3Key, storedName, originalName, fileSize, mimeType, title, category, period, amount, userId: requestedUserId } = body;

  if (!docId || !s3Key || !title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const userId = session.role === "admin" && requestedUserId
    ? requestedUserId
    : session.userId;

  const finalCategory = category || "recording";
  const finalMimeType = mimeType || "application/octet-stream";

  await dbRun(`
    INSERT INTO royalty_statements (id, user_id, title, category, period, amount, file_name, original_name, file_path, file_size, mime_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [docId, userId, title, finalCategory, period || null, amount ? parseFloat(amount) : null, storedName, originalName || title, s3Key, fileSize || 0, finalMimeType]);

  // Drive sync (best-effort)
  try {
    const driveConn = await getConnection(userId);
    if (driveConn) {
      const freshConn = await refreshTokenIfNeeded(driveConn);
      const driveFolderName = finalCategory === "publishing" ? "Publishing" : "Distribution";
      const folderId = await getOrCreateFolder(freshConn.access_token, driveFolderName);
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
  const category = (formData.get("category") as string) || "recording";
  const period = (formData.get("period") as string) || null;
  const amount = formData.get("amount") ? parseFloat(formData.get("amount") as string) : null;

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

  // Drive sync
  try {
    const driveConn = await getConnection(userId);
    if (driveConn) {
      const freshConn = await refreshTokenIfNeeded(driveConn);
      const driveFolderName = category === "publishing" ? "Publishing" : "Distribution";
      const folderId = await getOrCreateFolder(freshConn.access_token, driveFolderName);
      await uploadFileToDrive(freshConn.access_token, file.name, file.type || "application/octet-stream", buffer, folderId);
    }
  } catch {
    // Drive upload is best-effort
  }

  return NextResponse.json({ id: docId });
}
