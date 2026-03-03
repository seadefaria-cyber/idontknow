import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbRun } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (body.title !== undefined) { fields.push("title = ?"); values.push(body.title); }
  if (body.description !== undefined) { fields.push("description = ?"); values.push(body.description); }
  if (body.eventType !== undefined) { fields.push("event_type = ?"); values.push(body.eventType); }
  if (body.eventDate !== undefined) { fields.push("event_date = ?"); values.push(body.eventDate); }
  if (body.eventTime !== undefined) { fields.push("event_time = ?"); values.push(body.eventTime); }
  if (body.location !== undefined) { fields.push("location = ?"); values.push(body.location); }

  if (fields.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  values.push(id);
  await dbRun(`UPDATE schedule_events SET ${fields.join(", ")} WHERE id = ?`, values);

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { id } = await params;
  await dbRun("DELETE FROM schedule_events WHERE id = ?", [id]);

  return NextResponse.json({ success: true });
}
