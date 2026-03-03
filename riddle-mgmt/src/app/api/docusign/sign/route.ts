import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet } from "@/lib/db";
import { getConnection, refreshTokenIfNeeded, getSigningUrl } from "@/lib/docusign";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { legalDocId } = await req.json();
  if (!legalDocId) {
    return NextResponse.json({ error: "legalDocId required" }, { status: 400 });
  }

  // Get legal doc
  const doc = await dbGet<{
    id: string; user_id: string; envelope_id: string | null;
  }>("SELECT * FROM legal_documents WHERE id = ?", [legalDocId]);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Clients can only sign their own docs
  if (session.role !== "admin" && doc.user_id !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (!doc.envelope_id) {
    return NextResponse.json({ error: "No DocuSign envelope for this document" }, { status: 400 });
  }

  // Get signer info
  const signer = await dbGet<{
    id: string; display_name: string; email: string | null; google_email: string | null; username: string;
  }>("SELECT * FROM users WHERE id = ?", [doc.user_id]);

  if (!signer) {
    return NextResponse.json({ error: "Signer not found" }, { status: 404 });
  }

  const signerEmail = signer.email || signer.google_email || `${signer.username}@portal.riddlellc.biz`;
  const signerName = signer.display_name || signer.username;

  // Get DocuSign connection for the doc owner
  const conn = await getConnection(doc.user_id);
  if (!conn) {
    return NextResponse.json({ error: "DocuSign not connected" }, { status: 400 });
  }

  try {
    const freshConn = await refreshTokenIfNeeded(conn);

    const origin = req.nextUrl.origin || "https://riddlellc.biz";
    const returnUrl = `${origin}/api/docusign/signing-complete?envelopeId=${doc.envelope_id}`;

    const signingUrl = await getSigningUrl(
      freshConn.access_token,
      doc.envelope_id,
      signerEmail,
      signerName,
      signer.id,
      returnUrl
    );

    return NextResponse.json({ signingUrl });
  } catch (err) {
    console.error("DocuSign sign error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
