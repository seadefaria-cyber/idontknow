import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbAll, dbRun, dbGet } from "@/lib/db";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await dbAll(
    "SELECT id, username, display_name, role, email, created_at FROM users ORDER BY created_at DESC"
  );

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username, password, displayName, role, email } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  if (username.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const validRoles = ["admin", "client"];
  const userRole = validRoles.includes(role) ? role : "client";

  const existing = await dbGet<{ id: string }>(
    "SELECT id FROM users WHERE username = ?",
    [username.toLowerCase().trim()]
  );
  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const id = uuid();
  const passwordHash = bcrypt.hashSync(password, 12);

  await dbRun(
    "INSERT INTO users (id, username, password_hash, display_name, role, email) VALUES (?, ?, ?, ?, ?, ?)",
    [id, username.toLowerCase().trim(), passwordHash, displayName || username, userRole, email || null]
  );

  return NextResponse.json({ success: true, id });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, password } = await req.json();
  if (!userId || !password) {
    return NextResponse.json({ error: "userId and password required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const passwordHash = bcrypt.hashSync(password, 12);
  await dbRun("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Prevent admins from deleting themselves
  if (userId === session.userId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await dbRun("DELETE FROM users WHERE id = ?", [userId]);

  return NextResponse.json({ success: true });
}
