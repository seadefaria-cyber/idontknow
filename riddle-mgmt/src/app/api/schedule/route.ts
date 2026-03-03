import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet, dbAll, dbRun } from "@/lib/db";
import { suggestEventDetails } from "@/lib/ai";
import { getCalendarToken, createCalendarEvent } from "@/lib/google-calendar";
import { v4 as uuid } from "uuid";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let events;
  if (session.role === "admin") {
    events = await dbAll(`
      SELECT se.*, u.display_name as client_name
      FROM schedule_events se
      JOIN users u ON se.client_id = u.id
      ORDER BY se.event_date ASC, se.event_time ASC
    `);
  } else {
    events = await dbAll(`
      SELECT id, client_id, title, description, event_type, event_date, event_time, location, ai_suggested, created_at
      FROM schedule_events WHERE client_id = ? ORDER BY event_date ASC, event_time ASC
    `, [session.userId]);
  }

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { title, description, eventType, eventDate, eventTime, location, clientId } = await req.json();
  if (!title || !eventDate || !clientId) return NextResponse.json({ error: "Title, date, and client required" }, { status: 400 });

  const eventId = uuid();

  // AI auto-suggest if description/location left blank
  let finalDescription = description || null;
  let finalLocation = location || null;
  let aiSuggested = 0;

  if (!description || !location) {
    const client = await dbGet<{ display_name: string }>("SELECT display_name FROM users WHERE id = ?", [clientId]);
    const ai = await suggestEventDetails(title, eventType || "meeting", client?.display_name || "Client");
    if (ai) {
      if (!description && ai.description) finalDescription = ai.description;
      if (!location && ai.location) finalLocation = ai.location;
      aiSuggested = 1;
    }
  }

  await dbRun(`
    INSERT INTO schedule_events (id, client_id, title, description, event_type, event_date, event_time, location, ai_suggested)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [eventId, clientId, title, finalDescription, eventType || "meeting", eventDate, eventTime || null, finalLocation, aiSuggested]);

  // Sync to client's Google Calendar if connected
  try {
    const token = await getCalendarToken(clientId);
    if (token) {
      await createCalendarEvent(token, {
        summary: title,
        description: finalDescription || undefined,
        location: finalLocation || undefined,
        date: eventDate,
        time: eventTime || undefined,
      });
    }
  } catch {
    // Calendar sync is best-effort
  }

  return NextResponse.json({ id: eventId });
}
