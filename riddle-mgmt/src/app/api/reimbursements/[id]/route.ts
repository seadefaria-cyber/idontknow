import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet, dbRun } from "@/lib/db";
import { deleteFromS3 } from "@/lib/s3";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const item = await dbGet<{ client_id: string }>("SELECT * FROM reimbursements WHERE id = ?", [id]);

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "admin" && item.client_id !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  return NextResponse.json({ reimbursement: item });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const { status, adminNotes } = await req.json();

  const validStatuses = ["submitted", "approved", "paid", "rejected"];
  if (!validStatuses.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  // Admin can set any status
  if (session.role === "admin") {
    await dbRun("UPDATE reimbursements SET status = ?, admin_notes = ?, reviewed_at = datetime('now') WHERE id = ?", [status, adminNotes || null, id]);
    return NextResponse.json({ success: true });
  }

  // Client can approve/reject submitted expenses, or revert approved back to submitted
  const item = await dbGet<{ client_id: string; status: string }>(
    "SELECT client_id, status FROM reimbursements WHERE id = ?",
    [id]
  );
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.client_id !== session.userId) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  // Allow: submitted → approved/rejected, approved → submitted (undo)
  const allowed =
    (item.status === "submitted" && (status === "approved" || status === "rejected")) ||
    (item.status === "approved" && status === "submitted");
  if (!allowed) return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });

  await dbRun("UPDATE reimbursements SET status = ?, admin_notes = ?, reviewed_at = datetime('now') WHERE id = ?", [status, adminNotes || null, id]);
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const item = await dbGet<{ client_id: string; receipt_path: string | null }>(
    "SELECT client_id, receipt_path FROM reimbursements WHERE id = ?", [id]
  );

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "admin" && item.client_id !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Delete receipt from S3 if exists
  if (item.receipt_path) {
    try { await deleteFromS3(item.receipt_path); } catch { /* file may already be gone */ }
  }

  await dbRun("DELETE FROM reimbursements WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}
