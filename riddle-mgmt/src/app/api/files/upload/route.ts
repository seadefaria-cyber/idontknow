import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import getDb from "@/lib/db";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

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

    const db = getDb();

    // Verify target user exists
    const targetUser = db.prepare("SELECT id FROM users WHERE id = ?").get(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const fileId = uuid();
    const ext = path.extname(file.name);
    const storedName = `${fileId}${ext}`;
    const uploadDir = path.join(process.cwd(), "data", "files");

    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, storedName);
    await writeFile(filePath, buffer);

    const passwordHash = bcrypt.hashSync(filePassword, 12);

    db.prepare(`
      INSERT INTO files (id, user_id, file_name, original_name, file_path, file_size, mime_type, password_hash, folder, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fileId,
      targetUserId,
      storedName,
      file.name,
      filePath,
      buffer.length,
      file.type || "application/octet-stream",
      passwordHash,
      folder,
      description || null
    );

    return NextResponse.json({ success: true, fileId });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
