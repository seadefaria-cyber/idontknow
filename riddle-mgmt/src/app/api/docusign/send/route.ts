import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet, dbRun } from "@/lib/db";
import { downloadFromS3 } from "@/lib/s3";
import { getConnection, refreshTokenIfNeeded, createEnvelope } from "@/lib/docusign";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { legalDocId } = await req.json();
  if (!legalDocId) {
    return NextResponse.json({ error: "legalDocId required" }, { status: 400 });
  }

  // Get legal doc
  const doc = await dbGet<{
    id: string; user_id: string; title: string; original_name: string;
    file_path: string; mime_type: string; envelope_id: string | null;
  }>("SELECT * FROM legal_documents WHERE id = ?", [legalDocId]);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.envelope_id) {
    return NextResponse.json({ error: "Already sent for signature" }, { status: 400 });
  }

  // Get signer info (the client)
  const signer = await dbGet<{
    id: string; display_name: string; email: string | null; google_email: string | null; username: string;
  }>("SELECT * FROM users WHERE id = ?", [doc.user_id]);

  if (!signer) {
    return NextResponse.json({ error: "Signer not found" }, { status: 404 });
  }

  const signerEmail = signer.email || signer.google_email || `${signer.username}@portal.riddlellc.biz`;
  const signerName = signer.display_name || signer.username;

  // Get DocuSign connection (admin's)
  const conn = await getConnection(session.userId);
  if (!conn) {
    return NextResponse.json({ error: "DocuSign not connected" }, { status: 400 });
  }

  try {
    const freshConn = await refreshTokenIfNeeded(conn);

    // Download file from S3 and base64 encode
    const fileBuffer = await downloadFromS3(doc.file_path);
    const documentBase64 = fileBuffer.toString("base64");

    // Create DocuSign envelope
    const { envelopeId } = await createEnvelope(
      freshConn.access_token,
      documentBase64,
      doc.original_name || doc.title,
      signerEmail,
      signerName,
      signer.id // clientUserId for embedded signing
    );

    // Update legal doc with envelope ID and status
    await dbRun(
      "UPDATE legal_documents SET envelope_id = ?, status = 'sent', updated_at = datetime('now') WHERE id = ?",
      [envelopeId, legalDocId]
    );

    return NextResponse.json({ envelopeId });
  } catch (err) {
    console.error("DocuSign send error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
