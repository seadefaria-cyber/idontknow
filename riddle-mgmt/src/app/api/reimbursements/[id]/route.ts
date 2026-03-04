import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet, dbRun } from "@/lib/db";

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

  // Client can only approve/reject their own submitted expenses
  const item = await dbGet<{ client_id: string; status: string }>(
    "SELECT client_id, status FROM reimbursements WHERE id = ?",
    [id]
  );
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.client_id !== session.userId) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  if (item.status !== "submitted") return NextResponse.json({ error: "Can only review submitted expenses" }, { status: 400 });
  if (status !== "approved" && status !== "rejected") return NextResponse.json({ error: "Clients can only approve or reject" }, { status: 400 });

  await dbRun("UPDATE reimbursements SET status = ?, admin_notes = ?, reviewed_at = datetime('now') WHERE id = ?", [status, adminNotes || null, id]);
  return NextResponse.json({ success: true });
}
