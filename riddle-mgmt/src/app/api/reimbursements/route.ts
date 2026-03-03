import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet, dbAll, dbRun } from "@/lib/db";
import { classifyExpense } from "@/lib/ai";
import { uploadToS3 } from "@/lib/s3";
import { v4 as uuid } from "uuid";
import path from "path";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const url = new URL(req.url);
  const categoryFilter = url.searchParams.get("category");
  const statusFilter = url.searchParams.get("status");
  const clientIdFilter = url.searchParams.get("clientId");

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (session.role !== "admin") {
    conditions.push("r.client_id = ?");
    params.push(session.userId);
  } else if (clientIdFilter) {
    conditions.push("r.client_id = ?");
    params.push(clientIdFilter);
  }

  if (categoryFilter) {
    conditions.push("r.category = ?");
    params.push(categoryFilter);
  }
  if (statusFilter) {
    conditions.push("r.status = ?");
    params.push(statusFilter);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const reimbursements = await dbAll(`
    SELECT r.*, u.display_name as client_name
    FROM reimbursements r
    JOIN users u ON r.client_id = u.id
    ${whereClause}
    ORDER BY r.submitted_at DESC
  `, params);

  // Summary stats (unfiltered for client, or filtered by clientId for admin)
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
      COALESCE(SUM(CASE WHEN status = 'submitted' THEN amount END), 0) as pending_total,
      COALESCE(SUM(CASE WHEN status = 'approved' THEN amount END), 0) as approved_total,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount END), 0) as paid_total,
      COALESCE(SUM(CASE WHEN status = 'rejected' THEN amount END), 0) as rejected_total,
      COALESCE(SUM(amount), 0) as grand_total,
      COUNT(*) as total_count,
      COUNT(CASE WHEN status = 'submitted' THEN 1 END) as pending_count,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
    FROM reimbursements ${summaryWhere}
  `, summaryParams);

  const categoryBreakdown = await dbAll(`
    SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM reimbursements ${summaryWhere}
    GROUP BY category
    ORDER BY total DESC
  `, summaryParams);

  return NextResponse.json({ reimbursements, summary, categoryBreakdown });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const formData = await req.formData();
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  let category = (formData.get("category") as string) || "other";
  const vendor = (formData.get("vendor") as string) || null;
  const project = (formData.get("project") as string) || null;
  const receipt = formData.get("receipt") as File | null;

  // Admin can specify a clientId; clients use their own id
  const clientId = session.role === "admin"
    ? (formData.get("clientId") as string) || session.userId
    : session.userId;

  if (!amount || !description) return NextResponse.json({ error: "Amount and description required" }, { status: 400 });

  // AI auto-classify if category is "other"
  if (category === "other") {
    const ai = await classifyExpense(description, amount);
    if (ai && ai.category !== "other") category = ai.category;
  }

  const reimbId = uuid();

  let receiptFileName = null;
  let receiptOriginalName = null;
  let receiptFilePath = null;
  let receiptMimeType = null;

  if (receipt && receipt.size > 0) {
    const ext = path.extname(receipt.name);
    receiptFileName = `receipt-${reimbId}${ext}`;
    receiptOriginalName = receipt.name;
    receiptMimeType = receipt.type;
    const s3Key = `${clientId}/receipts/${receiptFileName}`;
    const bytes = await receipt.arrayBuffer();
    await uploadToS3(s3Key, Buffer.from(bytes), receipt.type || "application/octet-stream");
    receiptFilePath = s3Key;
  }

  await dbRun(`
    INSERT INTO reimbursements (id, client_id, amount, description, category, vendor, project, created_by, receipt_file_name, receipt_original_name, receipt_file_path, receipt_mime_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [reimbId, clientId, amount, description, category, vendor, project, session.userId, receiptFileName, receiptOriginalName, receiptFilePath, receiptMimeType]);

  return NextResponse.json({ id: reimbId });
}
