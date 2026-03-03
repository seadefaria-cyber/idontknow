import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet, dbRun } from "@/lib/db";
import { classifyFile } from "@/lib/ai";
import { getConnection, refreshTokenIfNeeded, uploadFileToDrive } from "@/lib/google-drive";
import { uploadToS3 } from "@/lib/s3";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Only admin can upload files
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const filePassword = formData.get("filePassword") as string | null;
    const targetUserId = formData.get("userId") as string | null;
    const description = formData.get("description") as string | null;
    const folder = (formData.get("folder") as string | null) || "documents";

    if (!file || !filePassword || !targetUserId) {
      return NextResponse.json({ error: "File, file password, and target user are required" }, { status: 400 });
    }

    if (filePassword.length < 4) {
      return NextResponse.json({ error: "File password must be at least 4 characters" }, { status: 400 });
    }

    // Verify target user exists
    const targetUser = await dbGet<{ id: string }>("SELECT id FROM users WHERE id = ?", [targetUserId]);
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const fileId = uuid();
    const ext = path.extname(file.name);
    const storedName = `${fileId}${ext}`;
    const s3Key = `${targetUserId}/${folder}/${storedName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    await uploadToS3(s3Key, buffer, file.type || "application/octet-stream");

    const passwordHash = bcrypt.hashSync(filePassword, 12);

    // AI auto-classify if description or folder left blank
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
      fileId,
      targetUserId,
      storedName,
      file.name,
      s3Key,
      buffer.length,
      file.type || "application/octet-stream",
      passwordHash,
      finalFolder,
      finalDescription,
      aiClassified
    ]);

    // Two-way sync: upload to client's Google Drive if connected
    try {
      const driveConn = await getConnection(targetUserId);
      if (driveConn) {
        const freshConn = await refreshTokenIfNeeded(driveConn);
        await uploadFileToDrive(freshConn.access_token, file.name, file.type || "application/octet-stream", buffer);
      }
    } catch {
      // Drive upload is best-effort
    }

    return NextResponse.json({ success: true, fileId });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
