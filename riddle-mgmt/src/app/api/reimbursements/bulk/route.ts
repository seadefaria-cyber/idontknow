import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbRun } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { ids, status, adminNotes } = await req.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  const validStatuses = ["submitted", "approved", "paid", "rejected"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  for (const id of ids) {
    await dbRun(
      "UPDATE reimbursements SET status = ?, admin_notes = ?, reviewed_at = datetime('now') WHERE id = ?",
      [status, adminNotes || null, id]
    );
  }

  return NextResponse.json({ success: true, updated: ids.length });
}
