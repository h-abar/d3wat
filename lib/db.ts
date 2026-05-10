import initSqlJs from "sql.js";
import type { Database } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "da3awat.db");

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS guests (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        category TEXT,
        type TEXT NOT NULL,
        parent_name TEXT,
        qr_code TEXT UNIQUE NOT NULL,
        attended INTEGER DEFAULT 0,
        attended_at TEXT,
        source_file TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    saveDb();
  }

  return db;
}

export function saveDb() {
  if (!db) return;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export interface Guest {
  id: string;
  name: string;
  phone: string | null;
  category: string | null;
  type: string;
  parent_name: string | null;
  qr_code: string;
  attended: number;
  attended_at: string | null;
  source_file: string | null;
  created_at: string;
}

export async function addGuest(guest: Omit<Guest, "attended" | "attended_at" | "created_at">) {
  const database = await getDb();
  database.run(
    `INSERT INTO guests (id, name, phone, category, type, parent_name, qr_code, source_file)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [guest.id, guest.name, guest.phone, guest.category, guest.type, guest.parent_name, guest.qr_code, guest.source_file]
  );
  saveDb();
}

export async function getAllGuests(): Promise<Guest[]> {
  const database = await getDb();
  const results = database.exec("SELECT * FROM guests ORDER BY created_at ASC");
  if (results.length === 0) return [];

  const columns = results[0].columns;
  return results[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as Guest;
  });
}

export async function getGuestByQrCode(qrCode: string): Promise<Guest | null> {
  const database = await getDb();
  const results = database.exec("SELECT * FROM guests WHERE qr_code = ?", [qrCode]);
  if (results.length === 0 || results[0].values.length === 0) return null;

  const columns = results[0].columns;
  const row = results[0].values[0];
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  return obj as unknown as Guest;
}

export async function markAttended(qrCode: string): Promise<Guest | null> {
  const database = await getDb();
  const now = new Date().toISOString();
  database.run(
    "UPDATE guests SET attended = 1, attended_at = ? WHERE qr_code = ?",
    [now, qrCode]
  );
  saveDb();
  return getGuestByQrCode(qrCode);
}

export async function getStats() {
  const database = await getDb();
  const total = database.exec("SELECT COUNT(*) as count FROM guests");
  const attended = database.exec("SELECT COUNT(*) as count FROM guests WHERE attended = 1");
  const byType = database.exec(
    "SELECT type, COUNT(*) as count FROM guests GROUP BY type"
  );
  const byCategory = database.exec(
    "SELECT category, COUNT(*) as count FROM guests GROUP BY category ORDER BY count DESC"
  );

  return {
    total: total[0]?.values[0]?.[0] || 0,
    attended: attended[0]?.values[0]?.[0] || 0,
    byType: byType[0]?.values.map((row) => ({ type: row[0], count: row[1] })) || [],
    byCategory: byCategory[0]?.values.map((row) => ({ category: row[0], count: row[1] })) || [],
  };
}
