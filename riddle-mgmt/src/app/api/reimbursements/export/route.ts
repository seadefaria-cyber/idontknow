import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbAll } from "@/lib/db";

interface ExpenseRow {
  submitted_at: string;
  client_name: string;
  vendor: string | null;
  description: string;
  category: string;
  amount: number;
  status: string;
  project: string | null;
  admin_notes: string | null;
}

function escapeCSV(val: string | null | undefined): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const rows = await dbAll<ExpenseRow>(`
    SELECT r.submitted_at, u.display_name as client_name, r.vendor, r.description, r.category, r.amount, r.status, r.project, r.admin_notes
    FROM reimbursements r
    JOIN users u ON r.client_id = u.id
    ORDER BY r.submitted_at DESC
  `);

  const header = "Date,Client,Vendor,Description,Category,Amount,Status,Project,Admin Notes";
  const lines = rows.map((r) =>
    [
      escapeCSV(r.submitted_at),
      escapeCSV(r.client_name),
      escapeCSV(r.vendor),
      escapeCSV(r.description),
      escapeCSV(r.category),
      r.amount.toFixed(2),
      escapeCSV(r.status),
      escapeCSV(r.project),
      escapeCSV(r.admin_notes),
    ].join(",")
  );

  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="expenses-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
