import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { verifyGoogleIdToken } from "@/lib/google-identity";
import { getConnection, refreshTokenIfNeeded, uploadFileToDrive, getOrCreateFolder } from "@/lib/google-drive";
import { v4 as uuid } from "uuid";
import path from "path";

// Public endpoint — requires Google Sign-In + username to submit a commission
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const username = (formData.get("username") as string)?.toLowerCase().trim();
  const googleIdToken = formData.get("googleIdToken") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const amountStr = formData.get("amount") as string;
  const amount = amountStr ? parseFloat(amountStr) : null;
  const file = formData.get("file") as File | null;

  if (!username || !googleIdToken || !title) {
    return NextResponse.json(
      { error: "Username, Google sign-in, and title are required" },
      { status: 400 }
    );
  }

  // Verify Google identity
  let identity;
  try {
    identity = await verifyGoogleIdToken(googleIdToken);
  } catch {
    return NextResponse.json({ error: "Invalid Google sign-in" }, { status: 401 });
  }

  // Look up client by username
  const user = await dbGet<{ id: string }>(
    "SELECT id FROM users WHERE username = ? AND role != 'admin'",
    [username]
  );
  if (!user) {
    return NextResponse.json({ error: "Invalid client" }, { status: 404 });
  }

  const clientId = user.id;
  const commissionId = uuid();

  let fileName = null;
  let originalName = null;
  let filePath = null;
  let fileSize = null;
  let mimeType = null;
  let fileBuffer: Buffer | null = null;

  if (file && file.size > 0) {
    const ext = path.extname(file.name);
    fileName = `commission-${commissionId}${ext}`;
    originalName = file.name;
    mimeType = file.type;
    fileSize = file.size;
    const s3Key = `${clientId}/commissions/${fileName}`;
    const bytes = await file.arrayBuffer();
    fileBuffer = Buffer.from(bytes);
    await uploadToS3(s3Key, fileBuffer, file.type || "application/octet-stream");
    filePath = s3Key;

    // Sync to Google Drive "Commissions" folder (best-effort)
    try {
      const driveConn = await getConnection(clientId);
      if (driveConn) {
        const freshConn = await refreshTokenIfNeeded(driveConn);
        const folderId = await getOrCreateFolder(freshConn.access_token, "Commissions");
        await uploadFileToDrive(freshConn.access_token, originalName, mimeType || "application/octet-stream", fileBuffer, folderId);
      }
    } catch {
      // Drive upload is best-effort
    }
  }

  await dbRun(`
    INSERT INTO commissions (id, client_id, title, description, amount, file_name, original_name, file_path, file_size, mime_type, submitter_name, submitter_email, submitter_google_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [commissionId, clientId, title, description, amount, fileName, originalName, filePath, fileSize, mimeType, identity.name, identity.email, identity.googleId]);

  return NextResponse.json({ id: commissionId });
}
