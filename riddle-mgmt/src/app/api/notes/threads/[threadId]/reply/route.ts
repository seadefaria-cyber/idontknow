import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet, dbRun } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { threadId } = await params;
  const { content } = await req.json();
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  // Verify access
  const thread = await dbGet<{ client_id: string }>("SELECT * FROM note_threads WHERE id = ?", [threadId]);
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  if (session.role !== "admin" && thread.client_id !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const noteId = uuid();
  await dbRun(`INSERT INTO notes (id, thread_id, author_id, content) VALUES (?, ?, ?, ?)`, [noteId, threadId, session.userId, content]);
  await dbRun(`UPDATE note_threads SET updated_at = datetime('now') WHERE id = ?`, [threadId]);

  return NextResponse.json({ noteId });
}
