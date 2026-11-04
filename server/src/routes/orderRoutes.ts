import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute } from '../db/index.js';
import { OrderService } from '../modules/orders/orderService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { emitAssistanceRequested } from '../socket/index.js';

export const orderRouter = Router();

// Submit Order (Customer QR or POS)
orderRouter.post('/', (req, res) => {
  try {
    const { tableId, items, customerName, customerPhone, specialInstructions, idempotencyKey, source } = req.body;

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please select at least one item to place an order.' });
    }

    const order = OrderService.createOrder({
      tableId,
      items,
      customerName,
      customerPhone,
      specialInstructions,
      idempotencyKey,
      source: source || 'qr_code',
    });

    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit order.' });
  }
});

// Get Order Details
orderRouter.get('/:id', (req, res) => {
  const order = OrderService.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json(order);
});

// List Active Orders (Cashier / Manager / Service)
orderRouter.get('/', authenticate, (req, res) => {
  const orders = queryAll(`
    SELECT 
      o.*, 
      t.table_number, 
      t.name as table_name,
      s.session_code,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
    FROM orders o
    JOIN restaurant_tables t ON o.table_id = t.id
    JOIN table_sessions s ON o.table_session_id = s.id
    WHERE o.status != 'cancelled'
    ORDER BY o.created_at DESC
    LIMIT 50
  `);

  for (const ord of orders) {
    ord.items = queryAll('SELECT * FROM order_items WHERE order_id = ?', [ord.id]);
  }

  res.json(orders);
});

// Update Order Status (e.g. Cancel or Force Ready)
orderRouter.patch('/:id/status', authenticate, authorize(['super_admin', 'hotel_admin', 'restaurant_manager', 'kitchen_manager']), (req, res) => {
  const { status } = req.body;
  try {
    const updated = OrderService.updateOrderStatus(req.params.id, status);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Guest Assistance Request (Call Waiter, Request Water, Request Bill)
orderRouter.post('/assistance', (req, res) => {
  const { tableId, sessionCode, requestType } = req.body;
  if (!tableId) return res.status(400).json({ error: 'Table ID is required.' });

  const table = queryOne('SELECT * FROM restaurant_tables WHERE id = ?', [tableId]);
  if (!table) return res.status(404).json({ error: 'Table not found.' });

  const session = queryOne(`SELECT id FROM table_sessions WHERE session_code = ?`, [sessionCode]);

  const reqId = uuidv4();
  execute(`
    INSERT INTO assistance_requests (id, table_id, table_number, table_session_id, request_type, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `, [reqId, table.id, table.table_number, session ? session.id : null, requestType || 'call_waiter']);

  const payload = {
    id: reqId,
    table_id: table.id,
    table_number: table.table_number,
    request_type: requestType || 'call_waiter',
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  emitAssistanceRequested(payload);

  res.json({
    success: true,
    message: `Your request (${requestType || 'waiter call'}) has been dispatched to service staff.`,
    request: payload,
  });
});

