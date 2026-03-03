import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAuthUrl } from "@/lib/google-drive";
import { dbGet } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await dbGet<{ google_email: string | null }>("SELECT google_email FROM users WHERE id = ?", [session.userId]);
  const loginHint = user?.google_email || undefined;

  const state = uuid();
  const url = getAuthUrl(state, loginHint);
  return NextResponse.redirect(url);
}
