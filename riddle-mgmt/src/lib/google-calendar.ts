import { getConnection, refreshTokenIfNeeded } from "@/lib/google-drive";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status?: string;
  htmlLink?: string;
  colorId?: string;
}

/**
 * Get the calendar's own background/foreground colors.
 * Events without a colorId inherit this color.
 */
export async function getCalendarColor(accessToken: string): Promise<{ bg: string; fg: string } | null> {
  try {
    const res = await fetch(`${CALENDAR_API}/users/me/calendarList/primary`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { bg: data.backgroundColor || null, fg: data.foregroundColor || null };
  } catch {
    return null;
  }
}

/**
 * List upcoming events from user's primary Google Calendar.
 */
export async function listCalendarEvents(
  accessToken: string,
  options?: { timeMin?: string; timeMax?: string; maxResults?: number }
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: options?.timeMin || new Date().toISOString(),
    maxResults: String(options?.maxResults || 100),
    singleEvents: "true",
    orderBy: "startTime",
  });
  if (options?.timeMax) {
    params.set("timeMax", options.timeMax);
  }

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar API error: ${text}`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Create an event on user's primary Google Calendar.
 */
export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    date: string;
    time?: string;
  }
): Promise<CalendarEvent> {
  let start: { dateTime?: string; date?: string; timeZone?: string };
  let end: { dateTime?: string; date?: string; timeZone?: string };

  if (event.time) {
    // Timed event
    const startDateTime = `${event.date}T${event.time}:00`;
    const endDate = new Date(startDateTime);
    endDate.setHours(endDate.getHours() + 1);
    start = { dateTime: startDateTime, timeZone: "America/New_York" };
    end = { dateTime: endDate.toISOString().slice(0, 19), timeZone: "America/New_York" };
  } else {
    // All-day event
    start = { date: event.date };
    const nextDay = new Date(event.date);
    nextDay.setDate(nextDay.getDate() + 1);
    end = { date: nextDay.toISOString().slice(0, 10) };
  }

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location,
      start,
      end,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar create error: ${text}`);
  }

  return res.json();
}

/**
 * Delete a calendar event.
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const res = await fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error("Failed to delete calendar event");
  }
}

/**
 * Get a fresh access token for a user's Google connection.
 */
export async function getCalendarToken(userId: string): Promise<string | null> {
  const conn = await getConnection(userId);
  if (!conn) return null;

  try {
    const fresh = await refreshTokenIfNeeded(conn);
    return fresh.access_token;
  } catch {
    return null;
  }
}
