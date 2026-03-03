import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCalendarToken, listCalendarEvents, getCalendarColor } from "@/lib/google-calendar";
import { getConnection } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if there's a google connection at all
  const conn = await getConnection(session.userId);
  if (!conn) {
    return NextResponse.json({ connected: false, events: [], debug: "no_connection" });
  }

  const token = await getCalendarToken(session.userId);
  if (!token) {
    return NextResponse.json({ connected: false, events: [], debug: "token_refresh_failed", email: conn.email });
  }

  const { searchParams } = new URL(req.url);
  const timeMin = searchParams.get("timeMin") || undefined;
  const timeMax = searchParams.get("timeMax") || undefined;

  try {
    const [events, calColor] = await Promise.all([
      listCalendarEvents(token, { timeMin, timeMax }),
      getCalendarColor(token),
    ]);
    return NextResponse.json({ connected: true, events, calendarColor: calColor, debug: "ok", count: events.length });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Calendar fetch error:", errMsg);
    return NextResponse.json({ connected: true, events: [], calendarColor: null, error: errMsg, debug: "api_error" });
  }
}
