import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute, runInTransaction } from '../db/index.js';
import { authenticate, authorize, logAudit } from '../middleware/auth.js';
import { generateQrDataUrl, generateTableTentPdf } from '../utils/qr.js';
import { generateOrderReceiptPdf } from '../utils/receiptPdf.js';
import { emitTableStatusUpdated } from '../socket/index.js';

export const tableRouter = Router();

// Public: Resolve Table from QR Code Token
tableRouter.get('/scan/:token', (req, res) => {
  const { token } = req.params;
  const table = queryOne(`
    SELECT t.*, o.name as outlet_name, h.name as hotel_name, h.currency, h.logo_url,
           tb.brand_name, tb.logo_url as custom_logo_url, tb.primary_color, tb.secondary_color, tb.accent_color,
           tb.receipt_header, tb.receipt_footer
    FROM restaurant_tables t
    JOIN outlets o ON t.outlet_id = o.id
    JOIN hotels h ON o.hotel_id = h.id
    LEFT JOIN tenant_branding tb ON t.tenant_id = tb.tenant_id
    WHERE (t.qr_token = ? OR LOWER(t.table_number) = LOWER(?) OR t.id = ?) AND t.is_active = 1
  `, [token, token, token]);

  if (!table) {
    return res.status(404).json({
      error: 'Invalid or deactivated QR code. Please ask the waiter for assistance.'
    });
  }

  // Get or create active session
  let session = queryOne(`
    SELECT * FROM table_sessions 
    WHERE table_id = ? AND status IN ('active', 'bill_requested')
    ORDER BY opened_at DESC LIMIT 1
  `, [table.id]);

  let orders: any[] = [];
  if (session) {
    orders = queryAll(`
      SELECT o.*, 
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      WHERE o.table_session_id = ? AND o.status != 'cancelled'
      ORDER BY o.created_at ASC
    `, [session.id]);

    for (const ord of orders) {
      ord.items = queryAll('SELECT * FROM order_items WHERE order_id = ?', [ord.id]);
    }
  }

  res.json({
    table: {
      id: table.id,
      tenant_id: table.tenant_id,
      table_number: table.table_number,
      name: table.name,
      capacity: table.capacity,
      status: table.status,
      outlet_id: table.outlet_id,
      outlet_name: table.outlet_name,
      hotel_name: table.brand_name || table.hotel_name,
      currency: table.currency,
      logo_url: table.custom_logo_url || table.logo_url,
      primary_color: table.primary_color,
      accent_color: table.accent_color,
    },
    session: session || null,
    orders,
  });
});

// Public / Guest: Create Table Reservation with Deductible Booking Fee
tableRouter.post('/reservations', async (req, res) => {
  try {
    const {
      customer_name, customer_phone, customer_email,
      guest_count, reservation_date, reservation_time,
      dining_location, special_requests, booking_fee
    } = req.body;

    if (!customer_name || !customer_phone || !reservation_date || !reservation_time) {
      return res.status(400).json({ error: 'Name, phone number, reservation date, and time are required.' });
    }

    const tenantId = 'tenant-grand-heritage';
    const outletId = 'outlet-royal-orchid';
    const resId = `res-${Date.now()}`;
    const bookingCode = `SIRONI-RES-${Math.floor(1000 + Math.random() * 9000)}`;
    const guests = parseInt(guest_count, 10) || 2;
    const fee = parseFloat(booking_fee) || 500.0;
    const mpesaReceipt = `MP${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;

    execute(`
      INSERT INTO table_reservations (
        id, tenant_id, outlet_id, booking_code, customer_name, customer_phone,
        customer_email, guest_count, reservation_date, reservation_time,
        dining_location, special_requests, booking_fee, deductible_amount,
        payment_status, mpesa_receipt, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, 'confirmed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      resId, tenantId, outletId, bookingCode, customer_name, customer_phone,
      customer_email || null, guests, reservation_date, reservation_time,
      dining_location || 'Sironi Rooftop & Sky Lounge (Westlands)',
      special_requests || null, fee, fee, mpesaReceipt
    ]);

    const reservation = queryOne('SELECT * FROM table_reservations WHERE id = ?', [resId]);

    res.status(201).json({
      success: true,
      booking: reservation,
      voucher: {
        booking_code: bookingCode,
        customer_name,
        deposit_paid: fee,
        deductible_amount: fee,
        mpesa_receipt: mpesaReceipt,
        message: `Advance table commitment deposit of KES ${fee.toLocaleString()} received. This amount will be 100% credited towards your dining bill when you arrive.`
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to process table reservation.' });
  }
});

// List Table Reservations
tableRouter.get('/reservations', (req, res) => {
  const reservations = queryAll(`
    SELECT * FROM table_reservations 
    ORDER BY reservation_date ASC, reservation_time ASC
    LIMIT 50
  `);
  res.json(reservations);
});

// List all tables (Floor Plan & Cashier view - scoped to tenant if provided)
tableRouter.get('/', (req, res) => {
  const tenantId = (req.query.tenant_id as string) || (req.headers['x-tenant-id'] as string);

  let sql = `
    SELECT 
      t.*,
      f.name as floor_name,
      s.name as section_name,
      o.name as outlet_name,
      ts.id as active_session_id,
      ts.session_code,
      ts.guest_count,
      ts.total_amount as session_total,
      ts.paid_amount as session_paid,
      ts.balance_amount as session_balance,
      ts.opened_at as session_opened_at,
      (SELECT COUNT(*) FROM orders WHERE table_session_id = ts.id AND status != 'cancelled') as active_order_count
    FROM restaurant_tables t
    LEFT JOIN floors f ON t.floor_id = f.id
    LEFT JOIN sections s ON t.section_id = s.id
    LEFT JOIN outlets o ON t.outlet_id = o.id
    LEFT JOIN table_sessions ts ON t.id = ts.table_id AND ts.status IN ('active', 'bill_requested')
    WHERE t.is_active = 1
  `;
  const params: any[] = [];

  if (tenantId) {
    sql += ` AND t.tenant_id = ? `;
    params.push(tenantId);
  }

  sql += ` ORDER BY t.table_number ASC `;

  const tables = queryAll(sql, params);
  res.json(tables);
});

// Get Table QR image data URL
tableRouter.get('/:id/qr-image', async (req, res) => {
  const table = queryOne('SELECT * FROM restaurant_tables WHERE id = ?', [req.params.id]);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const host = req.get('host') || 'localhost:5173';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;
  const targetUrl = `${baseUrl}/order/${table.qr_token}`;

  try {
    const dataUrl = await generateQrDataUrl(targetUrl);
    res.json({
      table_number: table.table_number,
      token: table.qr_token,
      url: targetUrl,
      dataUrl,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Download Printable PDF tent card
tableRouter.get('/:id/qr-pdf', async (req, res) => {
  const table = queryOne(`
    SELECT t.*, h.name as hotel_name
    FROM restaurant_tables t
    JOIN outlets o ON t.outlet_id = o.id
    JOIN hotels h ON o.hotel_id = h.id
    WHERE t.id = ?
  `, [req.params.id]);

  if (!table) return res.status(404).json({ error: 'Table not found' });

  const host = req.get('host') || 'localhost:5173';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;

  try {
    const pdfBuf = await generateTableTentPdf({
      table_number: table.table_number,
      name: table.name,
      hotel_name: table.hotel_name,
      qr_token: table.qr_token,
      baseUrl,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Sironi-Table-${table.table_number}-QR-Tent-Card.pdf"`);
    res.send(pdfBuf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Download Printable PDF Receipt for Table's active session
tableRouter.get('/:id/receipt-pdf', async (req, res) => {
  const table = queryOne(`
    SELECT t.*, h.name as hotel_name
    FROM restaurant_tables t
    JOIN outlets o ON t.outlet_id = o.id
    JOIN hotels h ON o.hotel_id = h.id
    WHERE t.id = ?
  `, [req.params.id]);

  if (!table) return res.status(404).json({ error: 'Table not found' });

  // Find latest or active session for table
  const session = queryOne(`
    SELECT * FROM table_sessions 
    WHERE table_id = ? 
    ORDER BY opened_at DESC LIMIT 1
  `, [table.id]);

  if (!session) {
    return res.status(404).json({ error: 'No active dining session found for this table.' });
  }

  const orders = queryAll(`
    SELECT * FROM orders 
    WHERE table_session_id = ? AND status != 'cancelled'
    ORDER BY created_at ASC
  `, [session.id]);

  const allItems: any[] = [];
  let subtotal = 0;
  let taxAmount = 0;
  let totalAmount = 0;

  for (const ord of orders) {
    subtotal += ord.subtotal || 0;
    taxAmount += ord.tax_amount || 0;
    totalAmount += ord.total_amount || 0;

    const items = queryAll('SELECT * FROM order_items WHERE order_id = ?', [ord.id]);
    allItems.push(...items);
  }

  try {
    const pdfBuf = await generateOrderReceiptPdf({
      order_number: session.session_code || `SESSION-${table.table_number}`,
      table_number: table.table_number,
      table_name: table.name,
      customer_name: session.guest_name || 'Sironi Guest',
      customer_phone: session.guest_phone || 'M-Pesa Guest',
      created_at: session.opened_at || new Date().toISOString(),
      subtotal: subtotal || totalAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: session.status || 'settled',
      items: allItems,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Sironi-Table-${table.table_number}-Dining-Receipt.pdf"`);
    res.send(pdfBuf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Table
tableRouter.post('/', authenticate, authorize(['super_admin', 'hotel_admin', 'restaurant_manager']), (req, res) => {
  const { table_number, name, capacity, floor_id, section_id, outlet_id, pos_x, pos_y } = req.body;
  if (!table_number || !name) {
    return res.status(400).json({ error: 'Table number and name are required.' });
  }

  const id = `tbl-${table_number.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`;
  const qr_token = `qr_${table_number.toLowerCase()}_${uuidv4().substring(0, 8)}`;

  execute(`
    INSERT INTO restaurant_tables (id, outlet_id, floor_id, section_id, table_number, name, capacity, status, qr_token, pos_x, pos_y, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, 1)
  `, [
    id, outlet_id || 'outlet-royal-orchid', floor_id || null, section_id || null,
    table_number, name, capacity || 4, qr_token, pos_x || 0, pos_y || 0
  ]);

  const created = queryOne('SELECT * FROM restaurant_tables WHERE id = ?', [id]);
  logAudit(req.user!.id, 'CREATE_TABLE', 'TABLE', id, { table_number, name });

  res.status(201).json(created);
});

// Regenerate QR Code (Security feature)
tableRouter.post('/:id/regenerate-qr', authenticate, authorize(['super_admin', 'hotel_admin', 'restaurant_manager']), (req, res) => {
  const table = queryOne('SELECT * FROM restaurant_tables WHERE id = ?', [req.params.id]);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const newToken = `qr_${table.table_number.toLowerCase()}_${uuidv4().substring(0, 8)}`;
  execute(`UPDATE restaurant_tables SET qr_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [newToken, table.id]);

  logAudit(req.user!.id, 'REGENERATE_QR', 'TABLE', table.id, { oldToken: table.qr_token, newToken });
  res.json({ success: true, table_id: table.id, qr_token: newToken });
});

// Update Table position on floor plan
tableRouter.patch('/:id/position', authenticate, (req, res) => {
  const { pos_x, pos_y } = req.body;
  execute(`UPDATE restaurant_tables SET pos_x = ?, pos_y = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [pos_x, pos_y, req.params.id]);
  res.json({ success: true });
});

// Update Table status manually (e.g. mark maintenance or release)
tableRouter.patch('/:id/status', authenticate, (req, res) => {
  const { status } = req.body;
  execute(`UPDATE restaurant_tables SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, req.params.id]);
  const table = queryOne('SELECT * FROM restaurant_tables WHERE id = ?', [req.params.id]);
  emitTableStatusUpdated(req.params.id, status, table);
  res.json(table);
});

