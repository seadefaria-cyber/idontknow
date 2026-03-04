import { NextRequest, NextResponse } from "next/server";
import { dbGet } from "@/lib/db";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.toLowerCase().trim();
  if (!username) {
    return NextResponse.json({ valid: false });
  }

  const user = await dbGet<{ display_name: string | null; username: string }>(
    "SELECT display_name, username FROM users WHERE username = ? AND role != 'admin'",
    [username]
  );

  if (!user) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    clientName: user.display_name || user.username,
  });
}
