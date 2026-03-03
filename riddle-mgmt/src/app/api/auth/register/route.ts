import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { dbGet, dbRun } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    if (process.env.ALLOW_REGISTRATION !== "true") {
      return NextResponse.json({ error: "Registration is by invitation only" }, { status: 403 });
    }

    const { username, password, displayName } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await dbGet<{ id: string }>("SELECT id FROM users WHERE username = ?", [username]);
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const passwordHash = bcrypt.hashSync(password, 12);
    const id = uuid();

    await dbRun(
      "INSERT INTO users (id, username, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)",
      [id, username.toLowerCase().trim(), passwordHash, displayName || username, "client"]
    );

    return NextResponse.json({ success: true, message: "Account created" });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
