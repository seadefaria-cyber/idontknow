import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPresignedUploadUrl } from "@/lib/s3";
import { v4 as uuid } from "uuid";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { fileName, contentType, userId: requestedUserId } = body;
  if (!fileName) return NextResponse.json({ error: "fileName required" }, { status: 400 });

  const userId = session.role === "admin" && requestedUserId
    ? requestedUserId
    : session.userId;

  const docId = uuid();
  const ext = path.extname(fileName);
  const storedName = `legal-${docId}${ext}`;
  const s3Key = `${userId}/legal/${storedName}`;
  const mime = contentType || "application/octet-stream";

  const presignedUrl = await getPresignedUploadUrl(s3Key, mime);

  return NextResponse.json({ presignedUrl, s3Key, docId, storedName });
}
