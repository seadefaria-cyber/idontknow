import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "data", "portal.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
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
  `);

  // Add folder column if missing (migration for existing databases)
  try {
    db.exec("ALTER TABLE files ADD COLUMN folder TEXT DEFAULT 'documents'");
  } catch {
    // Column already exists
  }

  // Seed the default user if not exists
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get("seandefaria");
  if (!existing) {
    const { v4: uuid } = require("uuid");
    const hash = bcrypt.hashSync("test1", 12);
    db.prepare("INSERT INTO users (id, username, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)").run(
      uuid(),
      "seandefaria",
      hash,
      "Sean DeFaria",
      "admin"
    );
  }
}

export default getDb;
