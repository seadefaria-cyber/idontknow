import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getConnection } from "@/lib/quickbooks";
import { dbAll } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try user's own connection first, then fall back to any company connection
  const conn = await getConnection(session.userId) || await getConnection();

  if (!conn) {
    return NextResponse.json({ connected: false, expenses: [], invoices: [], payments: [], customers: [], bills: [] });
  }

  const [expenses, invoices, payments, customers, bills] = await Promise.all([
    dbAll("SELECT * FROM qb_expenses WHERE realm_id = ? ORDER BY txn_date DESC", [conn.realm_id]),
    dbAll("SELECT * FROM qb_invoices WHERE realm_id = ? ORDER BY txn_date DESC", [conn.realm_id]),
    dbAll("SELECT * FROM qb_payments WHERE realm_id = ? ORDER BY txn_date DESC", [conn.realm_id]),
    dbAll("SELECT * FROM qb_customers WHERE realm_id = ? ORDER BY display_name ASC", [conn.realm_id]),
    dbAll("SELECT * FROM qb_bills WHERE realm_id = ? ORDER BY txn_date DESC", [conn.realm_id]),
  ]);

  return NextResponse.json({
    connected: true,
    company_name: conn.company_name,
    realm_id: conn.realm_id,
    expenses,
    invoices,
    payments,
    customers,
    bills,
  });
}
