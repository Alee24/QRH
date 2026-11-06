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
  // Safe Multi-Tenant Schema Migrations: ensure tenant_id column exists on all operational tables
  // prior to running schema statements that may create indexes on tenant_id
  const tablesToMigrate = [
    'hotels', 'outlets', 'floors', 'sections', 'restaurant_tables',
    'table_sessions', 'kitchen_stations', 'menu_categories', 'menu_items',
    'menu_schedules', 'orders', 'kitchen_tickets', 'invoices', 'payments',
    'mpesa_transactions', 'hotel_rooms', 'room_charges', 'inventory_items',
    'stock_movements', 'stock_wastage', 'users', 'audit_logs', 'assistance_requests'
  ];

  for (const tbl of tablesToMigrate) {
    try {
      const colInfo = queryAll(`PRAGMA table_info(${tbl});`);
      if (colInfo && colInfo.length > 0) {
        const hasTenantCol = colInfo.some((c) => c.name === 'tenant_id');
        if (!hasTenantCol) {
          db.exec(`ALTER TABLE ${tbl} ADD COLUMN tenant_id TEXT;`);
          db.exec(`UPDATE ${tbl} SET tenant_id = 'tenant-grand-heritage' WHERE tenant_id IS NULL;`);
        }
      }
    } catch (e) {
      // Table might not exist yet
    }
  }

  // Safe migration for order fulfillment fields
  try {
    const orderCols = queryAll(`PRAGMA table_info(orders);`);
    if (orderCols && orderCols.length > 0) {
      const existingColNames = orderCols.map((c: any) => c.name);
      if (!existingColNames.includes('fulfillment_type')) {
        db.exec("ALTER TABLE orders ADD COLUMN fulfillment_type TEXT DEFAULT 'dine_in';");
      }
      if (!existingColNames.includes('fulfillment_status')) {
        db.exec("ALTER TABLE orders ADD COLUMN fulfillment_status TEXT DEFAULT 'pending';");
      }
      if (!existingColNames.includes('customer_name')) {
        db.exec("ALTER TABLE orders ADD COLUMN customer_name TEXT;");
      }
      if (!existingColNames.includes('customer_phone')) {
        db.exec("ALTER TABLE orders ADD COLUMN customer_phone TEXT;");
      }
      if (!existingColNames.includes('delivery_address')) {
        db.exec("ALTER TABLE orders ADD COLUMN delivery_address TEXT;");
      }
      if (!existingColNames.includes('packaging_fee')) {
        db.exec("ALTER TABLE orders ADD COLUMN packaging_fee REAL DEFAULT 0.0;");
      }
      if (!existingColNames.includes('delivery_fee')) {
        db.exec("ALTER TABLE orders ADD COLUMN delivery_fee REAL DEFAULT 0.0;");
      }
      if (!existingColNames.includes('rejection_reason')) {
        db.exec("ALTER TABLE orders ADD COLUMN rejection_reason TEXT;");
      }
    }
  } catch (e) {}

  // Safe migration for hotels table (credentials, taxes, system mode)
  try {
    const hotelCols = queryAll(`PRAGMA table_info(hotels);`);
    if (hotelCols && hotelCols.length > 0) {
      const existingColNames = hotelCols.map((c: any) => c.name);
      if (!existingColNames.includes('system_mode')) {
        db.exec("ALTER TABLE hotels ADD COLUMN system_mode TEXT DEFAULT 'live';");
      }
      if (!existingColNames.includes('mpesa_consumer_key')) {
        db.exec("ALTER TABLE hotels ADD COLUMN mpesa_consumer_key TEXT;");
      }
      if (!existingColNames.includes('mpesa_consumer_secret')) {
        db.exec("ALTER TABLE hotels ADD COLUMN mpesa_consumer_secret TEXT;");
      }
      if (!existingColNames.includes('mpesa_shortcode')) {
        db.exec("ALTER TABLE hotels ADD COLUMN mpesa_shortcode TEXT;");
      }
      if (!existingColNames.includes('mpesa_passkey')) {
        db.exec("ALTER TABLE hotels ADD COLUMN mpesa_passkey TEXT;");
      }
      if (!existingColNames.includes('mpesa_callback_url')) {
        db.exec("ALTER TABLE hotels ADD COLUMN mpesa_callback_url TEXT;");
      }
      if (!existingColNames.includes('mpesa_environment')) {
        db.exec("ALTER TABLE hotels ADD COLUMN mpesa_environment TEXT DEFAULT 'sandbox';");
      }
      if (!existingColNames.includes('mpesa_enabled')) {
        db.exec("ALTER TABLE hotels ADD COLUMN mpesa_enabled INTEGER DEFAULT 1;");
      }
      if (!existingColNames.includes('smtp_host')) {
        db.exec("ALTER TABLE hotels ADD COLUMN smtp_host TEXT;");
      }
      if (!existingColNames.includes('smtp_port')) {
        db.exec("ALTER TABLE hotels ADD COLUMN smtp_port INTEGER DEFAULT 587;");
      }
      if (!existingColNames.includes('smtp_username')) {
        db.exec("ALTER TABLE hotels ADD COLUMN smtp_username TEXT;");
      }
      if (!existingColNames.includes('smtp_password')) {
        db.exec("ALTER TABLE hotels ADD COLUMN smtp_password TEXT;");
      }
      if (!existingColNames.includes('smtp_from_address')) {
        db.exec("ALTER TABLE hotels ADD COLUMN smtp_from_address TEXT;");
      }
      if (!existingColNames.includes('smtp_enabled')) {
        db.exec("ALTER TABLE hotels ADD COLUMN smtp_enabled INTEGER DEFAULT 0;");
      }
      if (!existingColNames.includes('payment_methods_json')) {
        db.exec("ALTER TABLE hotels ADD COLUMN payment_methods_json TEXT DEFAULT '[\"mpesa\",\"cash\",\"card\",\"bank_transfer\",\"room_charge\"]';");
      }
      if (!existingColNames.includes('master_qr_token')) {
        db.exec("ALTER TABLE hotels ADD COLUMN master_qr_token TEXT;");
        db.exec("UPDATE hotels SET master_qr_token = 'hotel_master_' || LOWER(REPLACE(id, '-', '_')) WHERE master_qr_token IS NULL;");
      }
      if (!existingColNames.includes('theme_preset')) {
        db.exec("ALTER TABLE hotels ADD COLUMN theme_preset TEXT DEFAULT 'heritage_gold';");
      }
    }
  } catch (e) {}

  // Safe migration for menu_items table (spices, is_demo)
  try {
    const itemCols = queryAll(`PRAGMA table_info(menu_items);`);
    if (itemCols && itemCols.length > 0) {
      const existingItemColNames = itemCols.map((c: any) => c.name);
      if (!existingItemColNames.includes('spices_json')) {
        db.exec("ALTER TABLE menu_items ADD COLUMN spices_json TEXT DEFAULT '[]';");
      }
      if (!existingItemColNames.includes('is_demo')) {
        db.exec("ALTER TABLE menu_items ADD COLUMN is_demo INTEGER DEFAULT 0;");
      }
    }
  } catch (e) {}

  let schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(__dirname, '../../src/db/schema.sql');
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Safe migration to update legacy branding records to Sironi Restaurants
  try {
    db.exec(`
      UPDATE hotels 
      SET name = 'Sironi Restaurants', 
          legal_name = 'Sironi Restaurants Ltd' 
      WHERE name LIKE '%Grand Heritage%' OR id = 'hotel-grand-heritage';
    `);
    db.exec(`
      UPDATE tenant_branding 
      SET brand_name = 'Sironi Restaurants', 
          receipt_header = 'Sironi Restaurants\nWestlands & Kilimani, Nairobi\nContemporary Charcoal Dining & Craft Bar',
          receipt_footer = 'Thank you for dining at Sironi Restaurants'
      WHERE brand_name LIKE '%Grand Heritage%' OR tenant_id = 'tenant-grand-heritage';
    `);
    db.exec(`
      UPDATE tenants 
      SET name = 'Sironi Restaurants' 
      WHERE name LIKE '%Grand Heritage%' OR id = 'tenant-grand-heritage';
    `);
  } catch (e) {}
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
