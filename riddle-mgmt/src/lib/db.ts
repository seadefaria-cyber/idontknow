import { type Client, type InValue, type Row } from "@libsql/client";
import { createClient as createHttpClient } from "@libsql/client/http";
import { createClient as createLocalClient } from "@libsql/client";
import bcrypt from "bcryptjs";

let _client: Client | null = null;
let _initPromise: Promise<void> | null = null;

function getClient(): Client {
  if (!_client) {
    const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
    if (tursoUrl) {
      // Production: use HTTP client for Vercel serverless
      const httpUrl = tursoUrl.replace("libsql://", "https://");
      _client = createHttpClient({
        url: httpUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    } else {
      // Local dev: use local SQLite file
      _client = createLocalClient({
        url: "file:./data/portal.db",
      });
    }
  }
  return _client;
}

async function ensureInit() {
  if (!_initPromise) {
    _initPromise = initSchema();
  }
  await _initPromise;
}

export async function dbGet<T = Row>(sql: string, args: InValue[] = []): Promise<T | undefined> {
  await ensureInit();
  const result = await getClient().execute({ sql, args });
  return result.rows[0] as T | undefined;
}

export async function dbRun(sql: string, args: InValue[] = []): Promise<void> {
  await ensureInit();
  await getClient().execute({ sql, args });
}

export async function dbAll<T = Row>(sql: string, args: InValue[] = []): Promise<T[]> {
  await ensureInit();
  const result = await getClient().execute({ sql, args });
  return result.rows as T[];
}

export async function dbExec(sql: string): Promise<void> {
  await ensureInit();
  await getClient().executeMultiple(sql);
}

async function tryExec(sql: string) {
  try { await getClient().execute(sql); } catch { /* column already exists */ }
}

async function initSchema() {
  const client = getClient();

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'client',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      password_hash TEXT NOT NULL,
      folder TEXT DEFAULT 'documents',
      description TEXT,
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS note_threads (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (thread_id) REFERENCES note_threads(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS legal_documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'contract',
      status TEXT DEFAULT 'draft',
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      uploaded_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schedule_events (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      event_type TEXT DEFAULT 'meeting',
      event_date TEXT NOT NULL,
      event_time TEXT,
      location TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reimbursements (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      category TEXT DEFAULT 'other',
      status TEXT DEFAULT 'submitted',
      admin_notes TEXT,
      receipt_file_name TEXT,
      receipt_original_name TEXT,
      receipt_file_path TEXT,
      receipt_mime_type TEXT,
      submitted_at TEXT DEFAULT (datetime('now')),
      reviewed_at TEXT,
      FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS google_drive_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      access_token_expires_at TEXT NOT NULL,
      email TEXT,
      connected_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quickbooks_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      realm_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      access_token_expires_at TEXT NOT NULL,
      refresh_token_expires_at TEXT NOT NULL,
      company_name TEXT,
      connected_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS qb_expenses (
      id TEXT PRIMARY KEY,
      qb_id TEXT NOT NULL,
      realm_id TEXT NOT NULL,
      txn_date TEXT,
      total_amount REAL,
      payment_type TEXT,
      vendor_name TEXT,
      account_name TEXT,
      memo TEXT,
      synced_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS qb_invoices (
      id TEXT PRIMARY KEY,
      qb_id TEXT NOT NULL,
      realm_id TEXT NOT NULL,
      txn_date TEXT,
      due_date TEXT,
      total_amount REAL,
      balance REAL,
      customer_name TEXT,
      doc_number TEXT,
      memo TEXT,
      status TEXT,
      synced_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS qb_payments (
      id TEXT PRIMARY KEY,
      qb_id TEXT NOT NULL,
      realm_id TEXT NOT NULL,
      txn_date TEXT,
      total_amount REAL,
      customer_name TEXT,
      payment_method TEXT,
      memo TEXT,
      status TEXT DEFAULT 'completed',
      synced_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS qb_customers (
      id TEXT PRIMARY KEY,
      qb_id TEXT NOT NULL,
      realm_id TEXT NOT NULL,
      display_name TEXT,
      company_name TEXT,
      email TEXT,
      phone TEXT,
      balance REAL,
      active INTEGER DEFAULT 1,
      synced_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS qb_bills (
      id TEXT PRIMARY KEY,
      qb_id TEXT NOT NULL,
      realm_id TEXT NOT NULL,
      txn_date TEXT,
      due_date TEXT,
      total_amount REAL,
      balance REAL,
      vendor_name TEXT,
      memo TEXT,
      synced_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      category TEXT DEFAULT 'other',
      status TEXT DEFAULT 'new',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS docusign_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      access_token_expires_at TEXT NOT NULL,
      email TEXT,
      connected_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      admin_response TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS royalty_statements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'recording',
      period TEXT,
      amount REAL,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migrations
  await tryExec("ALTER TABLE files ADD COLUMN folder TEXT DEFAULT 'documents'");
  await tryExec("ALTER TABLE files ADD COLUMN ai_classified INTEGER DEFAULT 0");
  await tryExec("ALTER TABLE note_threads ADD COLUMN tags TEXT");
  await tryExec("ALTER TABLE note_threads ADD COLUMN priority TEXT");
  await tryExec("ALTER TABLE legal_documents ADD COLUMN ai_summary TEXT");
  await tryExec("ALTER TABLE schedule_events ADD COLUMN ai_suggested INTEGER DEFAULT 0");
  await tryExec("ALTER TABLE users ADD COLUMN google_email TEXT");
  await tryExec("ALTER TABLE reimbursements ADD COLUMN vendor TEXT");
  await tryExec("ALTER TABLE reimbursements ADD COLUMN created_by TEXT");
  await tryExec("ALTER TABLE reimbursements ADD COLUMN project TEXT");
  await tryExec("ALTER TABLE qb_payments ADD COLUMN status TEXT DEFAULT 'completed'");
  await tryExec("ALTER TABLE legal_documents ADD COLUMN envelope_id TEXT");
  await tryExec("ALTER TABLE users ADD COLUMN email TEXT");
  await tryExec("ALTER TABLE qb_invoices ADD COLUMN invoice_link TEXT");
  await tryExec("ALTER TABLE docusign_connections ADD COLUMN account_id TEXT");
  await tryExec("ALTER TABLE docusign_connections ADD COLUMN base_uri TEXT");

  // Create initial admin from env vars if no users exist
  const { v4: uuid } = require("uuid");
  const userCount = (await client.execute("SELECT COUNT(*) as count FROM users")).rows[0];
  if (userCount && Number(userCount.count) === 0) {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminUsername && adminPassword) {
      const hash = bcrypt.hashSync(adminPassword, 12);
      await client.execute({
        sql: "INSERT INTO users (id, username, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)",
        args: [uuid(), adminUsername.toLowerCase().trim(), hash, adminUsername, "admin"]
      });
      console.log(`[FIRST BOOT] Admin account created: ${adminUsername}`);
    } else {
      console.warn("[FIRST BOOT] No users exist and ADMIN_USERNAME/ADMIN_PASSWORD env vars are not set. Set them to create the initial admin account.");
    }
  }
}

// Keep default export for backward compat during migration — but it's now a no-op marker
export default function getDb() {
  throw new Error("getDb() is removed. Use dbGet/dbRun/dbAll/dbExec instead.");
}
