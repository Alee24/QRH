-- MASTER RELATIONAL DATABASE SCHEMA FOR HOTEL QR-BASED RESTAURANT, KDS & POS
-- Supports SQLite and PostgreSQL syntax compatibility

-- 1. HOTELS & OUTLETS
CREATE TABLE IF NOT EXISTS hotels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    legal_name TEXT,
    tax_pin TEXT,
    currency TEXT NOT NULL DEFAULT 'KES',
    phone TEXT,
    email TEXT,
    address TEXT,
    logo_url TEXT,
    vat_rate REAL NOT NULL DEFAULT 16.0,
    catering_levy_rate REAL NOT NULL DEFAULT 2.0,
    service_charge_rate REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outlets (
    id TEXT PRIMARY KEY,
    hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'restaurant', -- restaurant, bar, cafe, room_service
    is_active INTEGER NOT NULL DEFAULT 1,
    opening_time TEXT DEFAULT '06:30',
    closing_time TEXT DEFAULT '23:30',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS floors (
    id TEXT PRIMARY KEY,
    outlet_id TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    floor_id TEXT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT
);

-- 2. TABLES & QR CODES
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id TEXT PRIMARY KEY,
    outlet_id TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    floor_id TEXT REFERENCES floors(id) ON DELETE SET NULL,
    section_id TEXT REFERENCES sections(id) ON DELETE SET NULL,
    table_number TEXT NOT NULL,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    status TEXT NOT NULL DEFAULT 'available', -- available, occupied, ordering, preparing, ready, awaiting_payment, cleaning, maintenance
    qr_token TEXT NOT NULL UNIQUE,
    pos_x REAL DEFAULT 0,
    pos_y REAL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS table_sessions (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
    outlet_id TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    session_code TEXT NOT NULL UNIQUE,
    guest_count INTEGER NOT NULL DEFAULT 1,
    customer_name TEXT,
    customer_phone TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- active, bill_requested, settled, closed, voided
    opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TEXT,
    total_amount REAL NOT NULL DEFAULT 0.0,
    paid_amount REAL NOT NULL DEFAULT 0.0,
    balance_amount REAL NOT NULL DEFAULT 0.0,
    settled_by TEXT,
    notes TEXT
);

-- 3. KITCHEN STATIONS
CREATE TABLE IF NOT EXISTS kitchen_stations (
    id TEXT PRIMARY KEY,
    outlet_id TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    color_code TEXT DEFAULT '#3b82f6',
    printer_ip TEXT,
    is_active INTEGER NOT NULL DEFAULT 1
);

-- 4. MENU CATEGORIES & ITEMS
CREATE TABLE IF NOT EXISTS menu_categories (
    id TEXT PRIMARY KEY,
    outlet_id TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    meal_type TEXT NOT NULL DEFAULT 'all_day', -- all_day, breakfast, lunch, dinner, drinks, specials
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    outlet_id TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    station_id TEXT REFERENCES kitchen_stations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    cost_price REAL NOT NULL DEFAULT 0.0,
    image_url TEXT,
    estimated_prep_time INTEGER NOT NULL DEFAULT 15,
    is_available INTEGER NOT NULL DEFAULT 1,
    is_sold_out INTEGER NOT NULL DEFAULT 0,
    is_special INTEGER NOT NULL DEFAULT 0,
    special_price REAL,
    dietary_flags TEXT, -- JSON array of tags: ['Halal', 'Vegetarian', 'Gluten-Free', 'Chef Special']
    allergens TEXT,     -- JSON array: ['Dairy', 'Nuts', 'Seafood', 'Gluten']
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_item_portions (
    id TEXT PRIMARY KEY,
    menu_item_id TEXT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. 'Regular', 'Large', 'Platter'
    price REAL NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS modifier_groups (
    id TEXT PRIMARY KEY,
    menu_item_id TEXT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. 'Meat Doneness', 'Choice of Side', 'Extra Toppings'
    min_selection INTEGER NOT NULL DEFAULT 0,
    max_selection INTEGER NOT NULL DEFAULT 1,
    is_required INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS modifier_options (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. 'Medium Rare', 'Truffle Fries', 'Extra Cheese'
    price REAL NOT NULL DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS menu_schedules (
    id TEXT PRIMARY KEY,
    outlet_id TEXT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, happy_hour
    start_time TEXT NOT NULL, -- e.g. '06:30'
    end_time TEXT NOT NULL,   -- e.g. '11:00'
    days_of_week TEXT NOT NULL DEFAULT '["mon","tue","wed","thu","fri","sat","sun"]',
    is_active INTEGER NOT NULL DEFAULT 1
);

-- 5. ORDERS & KITCHEN TICKETS (KOT)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    table_session_id TEXT NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
    table_id TEXT NOT NULL REFERENCES restaurant_tables(id),
    outlet_id TEXT NOT NULL REFERENCES outlets(id),
    source TEXT NOT NULL DEFAULT 'qr_code', -- qr_code, pos, waiter, room_service
    status TEXT NOT NULL DEFAULT 'received', -- received, confirmed, preparing, partially_ready, ready, served, cancelled
    payment_status TEXT NOT NULL DEFAULT 'unpaid', -- unpaid, partially_paid, paid, refunded
    subtotal REAL NOT NULL DEFAULT 0.0,
    tax_amount REAL NOT NULL DEFAULT 0.0,
    discount_amount REAL NOT NULL DEFAULT 0.0,
    service_charge REAL NOT NULL DEFAULT 0.0,
    total_amount REAL NOT NULL DEFAULT 0.0,
    special_instructions TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id TEXT NOT NULL REFERENCES menu_items(id),
    station_id TEXT REFERENCES kitchen_stations(id),
    item_name TEXT NOT NULL,
    portion_name TEXT,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    modifiers_summary TEXT, -- JSON array of selected modifiers with prices
    modifiers_cost REAL NOT NULL DEFAULT 0.0,
    total_price REAL NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'received', -- received, preparing, ready, served, cancelled
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ready_at TEXT,
    served_at TEXT
);

CREATE TABLE IF NOT EXISTS kitchen_tickets (
    id TEXT PRIMARY KEY,
    kot_number TEXT NOT NULL UNIQUE,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    station_id TEXT NOT NULL REFERENCES kitchen_stations(id),
    table_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, preparing, ready, served, cancelled
    priority TEXT NOT NULL DEFAULT 'normal', -- normal, rush, delayed
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TEXT,
    ready_at TEXT,
    served_at TEXT
);

CREATE TABLE IF NOT EXISTS kitchen_ticket_items (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES kitchen_tickets(id) ON DELETE CASCADE,
    order_item_id TEXT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    quantity INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    portion_name TEXT,
    modifiers_summary TEXT,
    notes TEXT
);

-- 6. PAYMENTS & INVOICES
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    table_session_id TEXT NOT NULL REFERENCES table_sessions(id),
    outlet_id TEXT NOT NULL REFERENCES outlets(id),
    subtotal REAL NOT NULL,
    vat_amount REAL NOT NULL,
    catering_levy REAL NOT NULL,
    service_charge REAL NOT NULL,
    discount_amount REAL NOT NULL DEFAULT 0.0,
    total_amount REAL NOT NULL,
    paid_amount REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'unpaid', -- unpaid, partially_paid, paid, voided
    cashier_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settled_at TEXT
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    table_session_id TEXT NOT NULL REFERENCES table_sessions(id),
    amount REAL NOT NULL,
    method TEXT NOT NULL, -- cash, mpesa, card, bank_transfer, room_charge
    status TEXT NOT NULL DEFAULT 'completed', -- pending, completed, failed, refunded
    transaction_ref TEXT,
    notes TEXT,
    cashier_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mpesa_transactions (
    id TEXT PRIMARY KEY,
    payment_id TEXT REFERENCES payments(id) ON DELETE SET NULL,
    merchant_request_id TEXT,
    checkout_request_id TEXT UNIQUE,
    phone_number TEXT NOT NULL,
    amount REAL NOT NULL,
    mpesa_receipt TEXT,
    status TEXT NOT NULL DEFAULT 'initiated', -- initiated, completed, failed, cancelled
    result_code INTEGER,
    result_desc TEXT,
    raw_callback TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. HOTEL PMS INTEGRATION
CREATE TABLE IF NOT EXISTS hotel_rooms (
    id TEXT PRIMARY KEY,
    room_number TEXT NOT NULL UNIQUE,
    floor INTEGER NOT NULL,
    guest_name TEXT,
    guest_phone TEXT,
    is_occupied INTEGER NOT NULL DEFAULT 0,
    check_in_date TEXT,
    check_out_date TEXT,
    billing_authorized INTEGER NOT NULL DEFAULT 1,
    verification_pin TEXT
);

CREATE TABLE IF NOT EXISTS room_charges (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES hotel_rooms(id),
    table_session_id TEXT NOT NULL REFERENCES table_sessions(id),
    amount REAL NOT NULL,
    guest_name TEXT NOT NULL,
    authorized_by TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. INVENTORY & RECIPES (BOM)
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    outlet_id TEXT NOT NULL REFERENCES outlets(id),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, -- meat, poultry, dairy, produce, dry_goods, beverages, alcohol
    unit_of_measure TEXT NOT NULL, -- kg, g, L, ml, pcs, bottles
    current_stock REAL NOT NULL DEFAULT 0.0,
    min_reorder_level REAL NOT NULL DEFAULT 10.0,
    cost_per_unit REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    menu_item_id TEXT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    ingredient_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_required REAL NOT NULL,
    unit TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    ingredient_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- order_deduction, receipt, adjustment, wastage, return
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    reference_id TEXT, -- order_id or purchase_order_id
    notes TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_wastage (
    id TEXT PRIMARY KEY,
    ingredient_id TEXT NOT NULL REFERENCES inventory_items(id),
    quantity REAL NOT NULL,
    reason TEXT NOT NULL, -- expired, spoiled, spilled, damaged
    logged_by TEXT NOT NULL,
    cost_loss REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. USERS, ROLES & AUDIT
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL, -- super_admin, hotel_admin, restaurant_manager, kitchen_manager, kitchen_staff, service_staff, cashier, accountant, inventory_manager, auditor
    outlet_id TEXT REFERENCES outlets(id),
    station_id TEXT REFERENCES kitchen_stations(id),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details TEXT, -- JSON details
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assistance_requests (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL REFERENCES restaurant_tables(id),
    table_number TEXT NOT NULL,
    table_session_id TEXT REFERENCES table_sessions(id),
    request_type TEXT NOT NULL DEFAULT 'call_waiter', -- call_waiter, request_water, request_bill, clean_table
    status TEXT NOT NULL DEFAULT 'pending', -- pending, acknowledged, completed
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT,
    handled_by TEXT REFERENCES users(id)
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tables_qr_token ON restaurant_tables(qr_token);
CREATE INDEX IF NOT EXISTS idx_tables_status ON restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_table_sessions_table ON table_sessions(table_id);
CREATE INDEX IF NOT EXISTS idx_table_sessions_status ON table_sessions(status);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(table_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_order ON kitchen_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_station ON kitchen_tickets(station_id, status);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory_items(current_stock, min_reorder_level);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

