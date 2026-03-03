import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbAll, dbRun } from "@/lib/db";
import { tagNoteThread } from "@/lib/ai";
import { v4 as uuid } from "uuid";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let threads;
  if (session.role === "admin") {
    threads = await dbAll(`
      SELECT t.id, t.subject, t.client_id, t.created_by, t.updated_at, t.tags, t.priority,
        uc.display_name as client_name,
        ucr.display_name as creator_name,
        (SELECT content FROM notes WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM notes WHERE thread_id = t.id AND is_read = 0 AND author_id != ?) as unread_count
      FROM note_threads t
      JOIN users uc ON t.client_id = uc.id
      JOIN users ucr ON t.created_by = ucr.id
      ORDER BY t.updated_at DESC
    `, [session.userId]);
  } else {
    threads = await dbAll(`
      SELECT t.id, t.subject, t.client_id, t.created_by, t.updated_at, t.tags, t.priority,
        uc.display_name as client_name,
        ucr.display_name as creator_name,
        (SELECT content FROM notes WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM notes WHERE thread_id = t.id AND is_read = 0 AND author_id != ?) as unread_count
      FROM note_threads t
      JOIN users uc ON t.client_id = uc.id
      JOIN users ucr ON t.created_by = ucr.id
      WHERE t.client_id = ?
      ORDER BY t.updated_at DESC
    `, [session.userId, session.userId]);
  }

  return NextResponse.json({ threads });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { subject, content, clientId } = await req.json();
  if (!subject || !content) return NextResponse.json({ error: "Subject and content required" }, { status: 400 });

  const threadId = uuid();
  const noteId = uuid();

  // Admin must specify clientId, client uses their own id
  const targetClientId = session.role === "admin" ? clientId : session.userId;
  if (!targetClientId) return NextResponse.json({ error: "Client ID required" }, { status: 400 });

  await dbRun(`INSERT INTO note_threads (id, client_id, subject, created_by) VALUES (?, ?, ?, ?)`, [threadId, targetClientId, subject, session.userId]);
  await dbRun(`INSERT INTO notes (id, thread_id, author_id, content, is_read) VALUES (?, ?, ?, ?, 1)`, [noteId, threadId, session.userId, content]);

  // AI auto-tag (non-blocking — if it fails, thread still exists)
  const ai = await tagNoteThread(subject, content);
  if (ai) {
    await dbRun(`UPDATE note_threads SET tags = ?, priority = ? WHERE id = ?`, [
      JSON.stringify(ai.tags),
      ai.priority,
      threadId
    ]);
  }

  return NextResponse.json({ threadId });
}
