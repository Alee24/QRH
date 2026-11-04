import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute, runInTransaction } from '../db/index.js';
import { authenticate, authorize, logAudit } from '../middleware/auth.js';
import { generateQrDataUrl, generateTableTentPdf } from '../utils/qr.js';
import { emitTableStatusUpdated } from '../socket/index.js';

export const tableRouter = Router();

// Public: Resolve Table from QR Code Token
tableRouter.get('/scan/:token', (req, res) => {
  const { token } = req.params;
  const table = queryOne(`
    SELECT t.*, o.name as outlet_name, h.name as hotel_name, h.currency, h.logo_url
    FROM restaurant_tables t
    JOIN outlets o ON t.outlet_id = o.id
    JOIN hotels h ON o.hotel_id = h.id
    WHERE t.qr_token = ? AND t.is_active = 1
  `, [token]);

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
      table_number: table.table_number,
      name: table.name,
      capacity: table.capacity,
      status: table.status,
      outlet_id: table.outlet_id,
      outlet_name: table.outlet_name,
      hotel_name: table.hotel_name,
      currency: table.currency,
      logo_url: table.logo_url,
    },
    session: session || null,
    orders,
  });
});

// List all tables (Floor Plan & Cashier view)
tableRouter.get('/', (req, res) => {
  const tables = queryAll(`
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
    ORDER BY t.table_number ASC
  `);

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
    res.setHeader('Content-Disposition', `inline; filename="Table-${table.table_number}-QR-Tent-Card.pdf"`);
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

