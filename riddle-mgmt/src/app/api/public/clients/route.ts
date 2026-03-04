import { NextResponse } from "next/server";
import { dbAll } from "@/lib/db";

// Public endpoint — returns only non-admin client names for expense submission
export async function GET() {
  const clients = await dbAll<{ id: string; display_name: string | null; username: string }>(
    "SELECT id, display_name, username FROM users WHERE role != 'admin' ORDER BY display_name ASC"
  );

  return NextResponse.json({
    clients: clients.map((c) => ({
      id: c.id,
      name: c.display_name || c.username,
    })),
  });
}
