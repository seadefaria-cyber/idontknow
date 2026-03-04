import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbRun } from "@/lib/db";
import { classifyFile } from "@/lib/ai";
import { getConnection, refreshTokenIfNeeded, uploadFileToDrive, getOrCreateFolder } from "@/lib/google-drive";
import { uploadToS3 } from "@/lib/s3";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
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

    // Two-way sync: upload to client's Google Drive "Creative" folder if connected
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
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
