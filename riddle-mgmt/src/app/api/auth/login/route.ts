import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbGet } from "@/lib/db";
import { createMfaPendingToken, mfaPendingCookieOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const user = await dbGet<{
      id: string;
      username: string;
      password_hash: string;
      display_name: string;
      role: string;
      mfa_setup_complete: number | null;
    }>("SELECT * FROM users WHERE username = ?", [username.toLowerCase().trim()]);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Issue a short-lived MFA pending token (never a full session)
    const pendingToken = createMfaPendingToken(user.id, user.username, user.role);
    const mfaSetupDone = user.mfa_setup_complete === 1;

    const response = NextResponse.json({
      success: true,
      mfaRequired: mfaSetupDone,
      mfaSetupRequired: !mfaSetupDone,
    });

    response.cookies.set(mfaPendingCookieOptions(pendingToken));

    return response;
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
