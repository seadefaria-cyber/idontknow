import { NextRequest, NextResponse } from "next/server";
import { dbRun } from "@/lib/db";

export async function GET(req: NextRequest) {
  const event = req.nextUrl.searchParams.get("event");
  const envelopeId = req.nextUrl.searchParams.get("envelopeId");

  if (envelopeId && event === "signing_complete") {
    await dbRun(
      "UPDATE legal_documents SET status = 'signed', updated_at = datetime('now') WHERE envelope_id = ?",
      [envelopeId]
    );
  }

  return NextResponse.redirect(new URL("/portal/dashboard", req.url));
}
