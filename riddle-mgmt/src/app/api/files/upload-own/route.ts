import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbRun } from "@/lib/db";
import { classifyFile } from "@/lib/ai";
import { getConnection, refreshTokenIfNeeded, uploadFileToDrive, getOrCreateFolder } from "@/lib/google-drive";
import { uploadToS3, downloadFromS3 } from "@/lib/s3";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

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
  const { fileId, s3Key, storedName, originalName, fileSize, mimeType, description, folder } = body;

  if (!fileId || !s3Key) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const userId = session.userId;
  const finalMimeType = mimeType || "application/octet-stream";
  const passwordHash = bcrypt.hashSync("creative", 12);

  let finalDescription = description || null;
  let finalFolder = folder || "creative";
  let aiClassified = 0;

  if (!description || finalFolder === "documents") {
    const ai = await classifyFile(originalName || "file", finalMimeType, fileSize || 0);
    if (ai) {
      if (!description) finalDescription = ai.description;
      if (finalFolder === "documents") finalFolder = ai.folder;
      aiClassified = 1;
    }
  }

  await dbRun(`
    INSERT INTO files (id, user_id, file_name, original_name, file_path, file_size, mime_type, password_hash, folder, description, ai_classified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    fileId, userId, storedName, originalName || "file", s3Key,
    fileSize || 0, finalMimeType, passwordHash, finalFolder, finalDescription, aiClassified
  ]);

  // Drive sync (best-effort)
  try {
    const driveConn = await getConnection(userId);
    if (driveConn) {
      const freshConn = await refreshTokenIfNeeded(driveConn);
      const folderId = await getOrCreateFolder(freshConn.access_token, "Creative");
      const buffer = await downloadFromS3(s3Key);
      await uploadFileToDrive(freshConn.access_token, originalName || "file", finalMimeType, buffer, folderId);
    }
  } catch {
    // Drive upload is best-effort
  }

  return NextResponse.json({ success: true, fileId });
}

async function handleFormDataUpload(
  req: NextRequest,
  session: { userId: string; role: string }
) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const description = formData.get("description") as string | null;
  const folder = (formData.get("folder") as string | null) || "creative";

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const userId = session.userId;
  const fileId = uuid();
  const ext = path.extname(file.name);
  const storedName = `${fileId}${ext}`;
  const s3Key = `${userId}/${folder}/${storedName}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await uploadToS3(s3Key, buffer, file.type || "application/octet-stream");

  const passwordHash = bcrypt.hashSync("creative", 12);

  let finalDescription = description || null;
  let finalFolder = folder;
  let aiClassified = 0;

  if (!description || folder === "documents") {
    const ai = await classifyFile(file.name, file.type || "application/octet-stream", buffer.length);
    if (ai) {
      if (!description) finalDescription = ai.description;
      if (folder === "documents") finalFolder = ai.folder;
      aiClassified = 1;
    }
  }

  await dbRun(`
    INSERT INTO files (id, user_id, file_name, original_name, file_path, file_size, mime_type, password_hash, folder, description, ai_classified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    fileId, userId, storedName, file.name, s3Key, buffer.length,
    file.type || "application/octet-stream", passwordHash, finalFolder, finalDescription, aiClassified
  ]);

  // Drive sync
  try {
    const driveConn = await getConnection(userId);
    if (driveConn) {
      const freshConn = await refreshTokenIfNeeded(driveConn);
      const folderId = await getOrCreateFolder(freshConn.access_token, "Creative");
      await uploadFileToDrive(freshConn.access_token, file.name, file.type || "application/octet-stream", buffer, folderId);
    }
  } catch {
    // Drive upload is best-effort
  }

  return NextResponse.json({ success: true, fileId });
}
