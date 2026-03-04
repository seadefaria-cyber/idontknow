import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { classifyExpense } from "@/lib/ai";
import { uploadToS3 } from "@/lib/s3";
import { verifyGoogleIdToken } from "@/lib/google-identity";
import { v4 as uuid } from "uuid";
import path from "path";

// Public endpoint — requires Google Sign-In + username to submit an expense
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const username = (formData.get("username") as string)?.toLowerCase().trim();
  const googleIdToken = formData.get("googleIdToken") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  let category = (formData.get("category") as string) || "other";
  const vendor = (formData.get("vendor") as string) || null;
  const receipt = formData.get("receipt") as File | null;

  if (!username || !googleIdToken || !amount || !description) {
    return NextResponse.json(
      { error: "Username, Google sign-in, amount, and description are required" },
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
    INSERT INTO reimbursements (id, client_id, amount, description, category, vendor, submitter_name, submitter_email, submitter_google_id, receipt_file_name, receipt_original_name, receipt_file_path, receipt_mime_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [reimbId, clientId, amount, description, category, vendor, identity.name, identity.email, identity.googleId, receiptFileName, receiptOriginalName, receiptFilePath, receiptMimeType]);

  return NextResponse.json({ id: reimbId });
}
