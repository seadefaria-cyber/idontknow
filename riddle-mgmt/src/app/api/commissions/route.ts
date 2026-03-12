import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet, dbAll, dbRun } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { getConnection, refreshTokenIfNeeded, uploadFileToDrive, getOrCreateFolder } from "@/lib/google-drive";
import { v4 as uuid } from "uuid";
import path from "path";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");
  const clientIdFilter = url.searchParams.get("clientId");

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (session.role !== "admin") {
    conditions.push("c.client_id = ?");
    params.push(session.userId);
  } else if (clientIdFilter) {
    conditions.push("c.client_id = ?");
    params.push(clientIdFilter);
  }

  if (statusFilter) {
    conditions.push("c.status = ?");
    params.push(statusFilter);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const commissions = await dbAll(`
    SELECT c.*, u.display_name as client_name
    FROM commissions c
    JOIN users u ON c.client_id = u.id
    ${whereClause}
    ORDER BY c.submitted_at DESC
  `, params);

  // Summary stats
  const summaryConditions: string[] = [];
  const summaryParams: (string | number)[] = [];

  if (session.role !== "admin") {
    summaryConditions.push("client_id = ?");
    summaryParams.push(session.userId);
  } else if (clientIdFilter) {
    summaryConditions.push("client_id = ?");
    summaryParams.push(clientIdFilter);
  }

  const summaryWhere = summaryConditions.length > 0 ? `WHERE ${summaryConditions.join(" AND ")}` : "";

  const summary = await dbGet(`
    SELECT
      COUNT(*) as total_count,
      COUNT(CASE WHEN status = 'submitted' THEN 1 END) as pending_count,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
      COALESCE(SUM(CASE WHEN status != 'rejected' THEN amount END), 0) as total_amount,
      COALESCE(SUM(CASE WHEN status = 'submitted' THEN amount END), 0) as pending_amount,
      COALESCE(SUM(CASE WHEN status = 'approved' THEN amount END), 0) as approved_amount
    FROM commissions ${summaryWhere}
  `, summaryParams);

  return NextResponse.json({ commissions, summary });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const formData = await req.formData();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const amountStr = formData.get("amount") as string;
  const amount = amountStr ? parseFloat(amountStr) : null;
  const file = formData.get("file") as File | null;

  const clientId = session.role === "admin"
    ? (formData.get("clientId") as string) || session.userId
    : session.userId;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

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
    INSERT INTO commissions (id, client_id, title, description, amount, file_name, original_name, file_path, file_size, mime_type, submitter_name, submitter_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [commissionId, clientId, title, description, amount, fileName, originalName, filePath, fileSize, mimeType, session.username, null]);

  return NextResponse.json({ id: commissionId });
}
