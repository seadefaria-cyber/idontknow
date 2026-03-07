import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPresignedUploadUrl } from "@/lib/s3";
import { v4 as uuid } from "uuid";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { fileName, contentType, userId: requestedUserId, folder } = body;
  if (!fileName) return NextResponse.json({ error: "fileName required" }, { status: 400 });

  // Admin can target a specific user; clients upload to their own account
  const userId = session.role === "admin" && requestedUserId
    ? requestedUserId
    : session.userId;

  const finalFolder = folder || "creative";
  const fileId = uuid();
  const ext = path.extname(fileName);
  const storedName = `${fileId}${ext}`;
  const s3Key = `${userId}/${finalFolder}/${storedName}`;
  const mime = contentType || "application/octet-stream";

  const presignedUrl = await getPresignedUploadUrl(s3Key, mime);

  return NextResponse.json({ presignedUrl, s3Key, fileId, storedName });
}
