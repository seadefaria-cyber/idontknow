import { NextRequest, NextResponse } from "next/server";
import { dbRun } from "@/lib/db";
import { classifyExpense } from "@/lib/ai";
import { uploadToS3 } from "@/lib/s3";
import { v4 as uuid } from "uuid";
import path from "path";

// Public endpoint — anyone with the link can submit an expense to a client
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const clientId = formData.get("clientId") as string;
  const submitterName = formData.get("submitterName") as string;
  const submitterEmail = formData.get("submitterEmail") as string;
  let category = (formData.get("category") as string) || "other";
  const vendor = (formData.get("vendor") as string) || null;
  const receipt = formData.get("receipt") as File | null;

  if (!amount || !description || !clientId || !submitterName) {
    return NextResponse.json({ error: "Amount, description, client, and your name are required" }, { status: 400 });
  }

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

  // Store submitter info in the project field as metadata since there's no auth
  const project = submitterEmail
    ? `Submitted by: ${submitterName} (${submitterEmail})`
    : `Submitted by: ${submitterName}`;

  await dbRun(`
    INSERT INTO reimbursements (id, client_id, amount, description, category, vendor, project, created_by, receipt_file_name, receipt_original_name, receipt_file_path, receipt_mime_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [reimbId, clientId, amount, description, category, vendor, project, null, receiptFileName, receiptOriginalName, receiptFilePath, receiptMimeType]);

  return NextResponse.json({ id: reimbId });
}
