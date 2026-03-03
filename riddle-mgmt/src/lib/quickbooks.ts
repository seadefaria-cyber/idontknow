import { dbGet, dbRun } from "@/lib/db";

const QB_BASE_URL = process.env.QB_ENVIRONMENT === "production"
  ? "https://quickbooks.api.intuit.com"
  : "https://sandbox-quickbooks.api.intuit.com";

const QB_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

interface QBConnection {
  id: string;
  user_id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  company_name: string | null;
  connected_at: string;
}

interface QBTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  token_type: string;
}

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.QB_CLIENT_ID || "",
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    redirect_uri: process.env.QB_REDIRECT_URI || "",
    state,
  });
  return `${QB_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<QBTokenResponse> {
  const auth = Buffer.from(`${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.QB_REDIRECT_URI || "",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QB token exchange failed: ${text}`);
  }
  return res.json();
}

export async function getConnection(userId?: string): Promise<QBConnection | undefined> {
  if (userId) {
    return await dbGet<QBConnection>("SELECT * FROM quickbooks_connections WHERE user_id = ? ORDER BY connected_at DESC LIMIT 1", [userId]);
  }
  return await dbGet<QBConnection>("SELECT * FROM quickbooks_connections ORDER BY connected_at DESC LIMIT 1", []);
}

export async function refreshTokenIfNeeded(conn: QBConnection): Promise<QBConnection> {
  const expiresAt = new Date(conn.access_token_expires_at + "Z").getTime();
  const now = Date.now();

  // Refresh if token expires within 5 minutes
  if (expiresAt - now > 5 * 60 * 1000) {
    return conn;
  }

  const auth = Buffer.from(`${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: conn.refresh_token,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh QB token");
  }

  const tokens: QBTokenResponse = await res.json();
  const accessExpires = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  const refreshExpires = new Date(Date.now() + tokens.x_refresh_token_expires_in * 1000).toISOString();

  await dbRun(
    "UPDATE quickbooks_connections SET access_token = ?, refresh_token = ?, access_token_expires_at = ?, refresh_token_expires_at = ? WHERE id = ?",
    [tokens.access_token, tokens.refresh_token, accessExpires, refreshExpires, conn.id]
  );

  return { ...conn, access_token: tokens.access_token, refresh_token: tokens.refresh_token, access_token_expires_at: accessExpires, refresh_token_expires_at: refreshExpires };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function qbQuery(conn: QBConnection, queryStr: string): Promise<any> {
  const encoded = encodeURIComponent(queryStr);
  const res = await fetch(
    `${QB_BASE_URL}/v3/company/${conn.realm_id}/query?query=${encoded}`,
    {
      headers: {
        "Authorization": `Bearer ${conn.access_token}`,
        "Accept": "application/json",
      },
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QB API error: ${text}`);
  }
  const data = await res.json();
  return data.QueryResponse || {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function qbReadInvoice(conn: QBConnection, invoiceId: string): Promise<any> {
  const res = await fetch(
    `${QB_BASE_URL}/v3/company/${conn.realm_id}/invoice/${invoiceId}?include=invoiceLink`,
    {
      headers: {
        "Authorization": `Bearer ${conn.access_token}`,
        "Accept": "application/json",
      },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.Invoice || null;
}

async function upsertRow(table: string, qbId: string, realmId: string, sql: string, args: (string | number | null)[]) {
  const { v4: uuid } = require("uuid");
  const existing = await dbGet<{ id: string }>(`SELECT id FROM ${table} WHERE qb_id = ? AND realm_id = ?`, [qbId, realmId]);
  const id = existing?.id || uuid();
  await dbRun(sql, [id, ...args]);
}

export interface SyncResult {
  total: number;
  errors: string[];
  counts: { purchases: number; invoices: number; payments: number; customers: number; bills: number };
}

export async function syncExpenses(conn: QBConnection): Promise<SyncResult> {
  const freshConn = await refreshTokenIfNeeded(conn);
  return syncAllData(freshConn);
}

export async function syncAllData(conn: QBConnection): Promise<SyncResult> {
  const errors: string[] = [];
  const counts = { purchases: 0, invoices: 0, payments: 0, customers: 0, bills: 0 };
  let total = 0;

  // Helper: after upserting all records, delete any local rows whose qb_id is no longer in QB
  async function purgeDeleted(table: string, realmId: string, liveQbIds: string[]) {
    if (liveQbIds.length === 0) {
      // QB returned nothing — delete all local records for this realm
      await dbRun(`DELETE FROM ${table} WHERE realm_id = ?`, [realmId]);
      return;
    }
    const placeholders = liveQbIds.map(() => "?").join(",");
    await dbRun(
      `DELETE FROM ${table} WHERE realm_id = ? AND qb_id NOT IN (${placeholders})`,
      [realmId, ...liveQbIds]
    );
  }

  // --- Expenses (Purchase) ---
  try {
    const qr = await qbQuery(conn, "SELECT * FROM Purchase MAXRESULTS 500");
    const purchases = qr.Purchase || [];
    const liveIds: string[] = [];
    for (const p of purchases) {
      liveIds.push(p.Id);
      await upsertRow("qb_expenses", p.Id, conn.realm_id,
        `INSERT INTO qb_expenses (id, qb_id, realm_id, txn_date, total_amount, payment_type, vendor_name, account_name, memo, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET txn_date=excluded.txn_date, total_amount=excluded.total_amount, payment_type=excluded.payment_type, vendor_name=excluded.vendor_name, account_name=excluded.account_name, memo=excluded.memo, synced_at=datetime('now')`,
        [p.Id, conn.realm_id, p.TxnDate || null, p.TotalAmt || 0, p.PaymentType || null, p.EntityRef?.name || null, p.AccountRef?.name || null, p.PrivateNote || null]
      );
      counts.purchases++;
      total++;
    }
    await purgeDeleted("qb_expenses", conn.realm_id, liveIds);
  } catch (err) { errors.push(`Purchases: ${String(err)}`); }

  // --- Invoices ---
  try {
    const qr = await qbQuery(conn, "SELECT * FROM Invoice MAXRESULTS 500");
    const invoices = qr.Invoice || [];
    const liveIds: string[] = [];
    for (const inv of invoices) {
      liveIds.push(inv.Id);
      const isVoided = (inv.PrivateNote || "").toLowerCase().includes("voided");
      const status = isVoided ? "voided" : inv.Balance === 0 ? "paid" : (inv.DueDate && new Date(inv.DueDate) < new Date() ? "overdue" : "open");
      // Fetch shareable invoice link via individual read with include=invoiceLink
      let invoiceLink: string | null = null;
      try {
        const detail = await qbReadInvoice(conn, inv.Id);
        if (detail?.InvoiceLink) invoiceLink = detail.InvoiceLink;
      } catch { /* link fetch failed — non-critical */ }
      await upsertRow("qb_invoices", inv.Id, conn.realm_id,
        `INSERT INTO qb_invoices (id, qb_id, realm_id, txn_date, due_date, total_amount, balance, customer_name, doc_number, memo, status, invoice_link, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET txn_date=excluded.txn_date, due_date=excluded.due_date, total_amount=excluded.total_amount, balance=excluded.balance, customer_name=excluded.customer_name, doc_number=excluded.doc_number, memo=excluded.memo, status=excluded.status, invoice_link=COALESCE(excluded.invoice_link, qb_invoices.invoice_link), synced_at=datetime('now')`,
        [inv.Id, conn.realm_id, inv.TxnDate || null, inv.DueDate || null, inv.TotalAmt || 0, inv.Balance || 0, inv.CustomerRef?.name || null, inv.DocNumber || null, inv.PrivateNote || null, status, invoiceLink]
      );
      counts.invoices++;
      total++;
    }
    await purgeDeleted("qb_invoices", conn.realm_id, liveIds);
  } catch (err) { errors.push(`Invoices: ${String(err)}`); }

  // --- Payments ---
  try {
    const qr = await qbQuery(conn, "SELECT * FROM Payment MAXRESULTS 500");
    const payments = qr.Payment || [];
    const liveIds: string[] = [];
    for (const pay of payments) {
      liveIds.push(pay.Id);
      const isVoided = (pay.PrivateNote || "").toLowerCase().includes("voided");
      const hasEmptyLines = !pay.Line || pay.Line.length === 0;
      const payStatus = isVoided ? "voided" : hasEmptyLines && pay.UnappliedAmt === pay.TotalAmt ? "unapplied" : "completed";
      await upsertRow("qb_payments", pay.Id, conn.realm_id,
        `INSERT INTO qb_payments (id, qb_id, realm_id, txn_date, total_amount, customer_name, payment_method, memo, status, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET txn_date=excluded.txn_date, total_amount=excluded.total_amount, customer_name=excluded.customer_name, payment_method=excluded.payment_method, memo=excluded.memo, status=excluded.status, synced_at=datetime('now')`,
        [pay.Id, conn.realm_id, pay.TxnDate || null, pay.TotalAmt || 0, pay.CustomerRef?.name || null, pay.PaymentMethodRef?.name || null, pay.PrivateNote || null, payStatus]
      );
      counts.payments++;
      total++;
    }
    await purgeDeleted("qb_payments", conn.realm_id, liveIds);
  } catch (err) { errors.push(`Payments: ${String(err)}`); }

  // --- Customers ---
  try {
    const qr = await qbQuery(conn, "SELECT * FROM Customer MAXRESULTS 500");
    const customers = qr.Customer || [];
    const liveIds: string[] = [];
    for (const cust of customers) {
      liveIds.push(cust.Id);
      await upsertRow("qb_customers", cust.Id, conn.realm_id,
        `INSERT INTO qb_customers (id, qb_id, realm_id, display_name, company_name, email, phone, balance, active, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name, company_name=excluded.company_name, email=excluded.email, phone=excluded.phone, balance=excluded.balance, active=excluded.active, synced_at=datetime('now')`,
        [cust.Id, conn.realm_id, cust.DisplayName || null, cust.CompanyName || null, cust.PrimaryEmailAddr?.Address || null, cust.PrimaryPhone?.FreeFormNumber || null, cust.Balance || 0, cust.Active ? 1 : 0]
      );
      counts.customers++;
      total++;
    }
    await purgeDeleted("qb_customers", conn.realm_id, liveIds);
  } catch (err) { errors.push(`Customers: ${String(err)}`); }

  // --- Bills ---
  try {
    const qr = await qbQuery(conn, "SELECT * FROM Bill MAXRESULTS 500");
    const bills = qr.Bill || [];
    const liveIds: string[] = [];
    for (const bill of bills) {
      liveIds.push(bill.Id);
      await upsertRow("qb_bills", bill.Id, conn.realm_id,
        `INSERT INTO qb_bills (id, qb_id, realm_id, txn_date, due_date, total_amount, balance, vendor_name, memo, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET txn_date=excluded.txn_date, due_date=excluded.due_date, total_amount=excluded.total_amount, balance=excluded.balance, vendor_name=excluded.vendor_name, memo=excluded.memo, synced_at=datetime('now')`,
        [bill.Id, conn.realm_id, bill.TxnDate || null, bill.DueDate || null, bill.TotalAmt || 0, bill.Balance || 0, bill.VendorRef?.name || null, bill.PrivateNote || null]
      );
      counts.bills++;
      total++;
    }
    await purgeDeleted("qb_bills", conn.realm_id, liveIds);
  } catch (err) { errors.push(`Bills: ${String(err)}`); }

  return { total, errors, counts };
}
