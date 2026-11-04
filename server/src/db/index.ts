import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.DATABASE_URL || path.join(DB_DIR, 'restaurant_pos.sqlite');

export const db = new DatabaseSync(DB_PATH);

// Enable SQLite Foreign Keys and WAL Mode for high concurrency
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');

export function initDatabase() {
  let schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(__dirname, '../../src/db/schema.sql');
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

// Transaction wrapper with nested transaction support
let transactionDepth = 0;

export function runInTransaction<T>(fn: () => T): T {
  if (transactionDepth > 0) {
    // Already in a transaction
    return fn();
  }

  transactionDepth++;
  db.exec('BEGIN TRANSACTION;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  } finally {
    transactionDepth--;
  }
}

// Query helper utilities
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const sanitized = params.map(p => (p === undefined ? null : p));
  const stmt = db.prepare(sql);
  return stmt.all(...sanitized) as T[];
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const sanitized = params.map(p => (p === undefined ? null : p));
  const stmt = db.prepare(sql);
  const rows = stmt.all(...sanitized);
  return (rows[0] as T) || null;
}

export function execute(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number | bigint } {
  const sanitized = params.map(p => (p === undefined ? null : p));
  const stmt = db.prepare(sql);
  const result = stmt.run(...sanitized);
  return {
    changes: Number(result.changes),
    lastInsertRowid: result.lastInsertRowid,
  };
}
