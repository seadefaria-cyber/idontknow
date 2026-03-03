import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet, dbRun, dbAll } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { threadId } = await params;

  // Verify access
  const thread = await dbGet<{ client_id: string }>("SELECT * FROM note_threads WHERE id = ?", [threadId]);
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  if (session.role !== "admin" && thread.client_id !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Mark messages from others as read
  await dbRun(`UPDATE notes SET is_read = 1 WHERE thread_id = ? AND author_id != ? AND is_read = 0`, [threadId, session.userId]);

  const notes = await dbAll(`
    SELECT n.id, n.author_id, n.content, n.is_read, n.created_at,
      u.display_name as author_name
    FROM notes n
    JOIN users u ON n.author_id = u.id
    WHERE n.thread_id = ?
    ORDER BY n.created_at ASC
  `, [threadId]);

  return NextResponse.json({ notes });
}
