import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbRun, dbGet, dbAll } from "@/lib/db";
import { v4 as uuid } from "uuid";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, message } = await req.json();
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Subject and message required" }, { status: 400 });
  }

  const user = await dbGet<{ username: string; display_name: string }>(
    "SELECT username, display_name FROM users WHERE id = ?",
    [session.userId]
  );

  const requestId = uuid();
  await dbRun(
    "INSERT INTO requests (id, user_id, subject, message, status) VALUES (?, ?, ?, ?, ?)",
    [requestId, session.userId, subject.trim(), message.trim(), "open"]
  );

  // Send email notification to team@riddlellc.biz
  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `"Riddle Portal" <${smtpUser}>`,
        to: "team@riddlellc.biz",
        subject: `[Request] ${subject.trim()} — ${user?.display_name || user?.username || "Unknown"}`,
        text: `New request from ${user?.display_name || user?.username}:\n\nSubject: ${subject.trim()}\n\n${message.trim()}\n\n---\nRiddle MGMT Portal`,
      });
    }
  } catch {
    // Email failed silently — request is still saved in DB
  }

  return NextResponse.json({ success: true, requestId });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await dbAll(
    "SELECT r.*, u.display_name as client_name FROM requests r LEFT JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC"
  );

  return NextResponse.json({ requests });
}
