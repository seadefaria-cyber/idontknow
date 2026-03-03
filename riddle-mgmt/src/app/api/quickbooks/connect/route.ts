import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAuthUrl } from "@/lib/quickbooks";
import { v4 as uuid } from "uuid";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = uuid();
  const url = getAuthUrl(state);
  return NextResponse.redirect(url);
}
