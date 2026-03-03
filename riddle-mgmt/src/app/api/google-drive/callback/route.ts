import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exchangeCode, getUserEmail } from "@/lib/google-drive";
import { dbRun } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/portal/dashboard?gdrive_error=missing_code", request.url));
  }

  try {
    const tokens = await exchangeCode(code);
    const email = await getUserEmail(tokens.access_token);

    // Remove existing connection for this user
    await dbRun("DELETE FROM google_drive_connections WHERE user_id = ?", [session.userId]);

    const accessExpires = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await dbRun(
      "INSERT INTO google_drive_connections (id, user_id, access_token, refresh_token, access_token_expires_at, email) VALUES (?, ?, ?, ?, ?, ?)",
      [uuid(), session.userId, tokens.access_token, tokens.refresh_token || "", accessExpires, email]
    );

    return NextResponse.redirect(new URL("/portal/dashboard", request.url));
  } catch {
    return NextResponse.redirect(new URL("/portal/dashboard?gdrive_error=auth_failed", request.url));
  }
}
