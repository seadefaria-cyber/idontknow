import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGet } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const FILE_ACCESS_SECRET = process.env.FILE_SECRET || "riddle-file-access-secret";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: "File password is required" }, { status: 400 });
    }

    // Get file and verify ownership (or admin)
    const file = await dbGet<{
      id: string;
      user_id: string;
      password_hash: string;
      original_name: string;
    }>("SELECT * FROM files WHERE id = ?", [id]);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (session.role !== "admin" && file.user_id !== session.userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const valid = bcrypt.compareSync(password, file.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect file password" }, { status: 401 });
    }

    // Generate a short-lived download token (5 minutes)
    const downloadToken = jwt.sign(
      { fileId: file.id, userId: session.userId },
      FILE_ACCESS_SECRET,
      { expiresIn: "5m" }
    );

    return NextResponse.json({ success: true, downloadToken, fileName: file.original_name });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
