import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbGet } from "@/lib/db";
import { createToken, sessionCookieOptions } from "@/lib/auth";

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
    }>("SELECT * FROM users WHERE username = ?", [username.toLowerCase().trim()]);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Issue full session token directly (no MFA)
    const token = createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      mfaVerified: true,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(sessionCookieOptions(token));

    return response;
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
