import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await dbGet<{
    id: string;
    username: string;
    display_name: string;
    role: string;
    created_at: string;
  }>("SELECT id, username, display_name, role, created_at FROM users WHERE id = ?", [session.userId]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Block access if MFA not verified
  if (!session.mfaVerified) {
    return NextResponse.json({ error: "MFA verification required" }, { status: 403 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      createdAt: user.created_at,
    },
  });
}
