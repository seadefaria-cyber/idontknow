import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbRun } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await params;
  await dbRun(`DELETE FROM links WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
}
