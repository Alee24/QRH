import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute } from '../db/index.js';
import { OrderService } from '../modules/orders/orderService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { emitAssistanceRequested } from '../socket/index.js';
import { generateOrderReceiptPdf } from '../utils/receiptPdf.js';

export const orderRouter = Router();

// Download Printable PDF Receipt for Order
orderRouter.get('/:id/receipt-pdf', async (req, res) => {
  try {
    const order = OrderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const pdfBuf = await generateOrderReceiptPdf(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Sironi-Table-${order.table_number}-Receipt-${order.order_number}.pdf"`);
    res.send(pdfBuf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Order (Customer QR, Delivery or POS)
orderRouter.post('/', (req, res) => {
  try {
    const { tableId, items, customerName, customerPhone, specialInstructions, idempotencyKey, source, delivery } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please select at least one item to place an order.' });
    }

    // Resolve tableId: for delivery orders, use first table as master anchor if not specified
    let targetTableId = tableId;
    if (!targetTableId) {
      const defaultTable = queryOne("SELECT id FROM restaurant_tables ORDER BY created_at ASC LIMIT 1");
      targetTableId = defaultTable?.id || 'tbl-01';
    }

    const order = OrderService.createOrder({
      tableId: targetTableId,
      items,
      customerName: customerName || delivery?.recipient_name,
      customerPhone: customerPhone || delivery?.recipient_phone,
      specialInstructions: specialInstructions || delivery?.delivery_notes,
      idempotencyKey,
      source: source || (delivery ? 'delivery' : 'qr_code'),
    });

    // If this is a delivery order, record into delivery_orders tracking table
    if (source === 'delivery' || delivery) {
      try {
        const del = delivery || {};
        const fullAddress = [
          del.house_number ? `House/Apt: ${del.house_number}` : '',
          del.building_name ? `Building: ${del.building_name}` : '',
          del.street ? `Street: ${del.street}` : '',
          del.estate ? `Estate: ${del.estate}` : '',
          del.delivery_address || ''
        ].filter(Boolean).join(', ') || 'Nairobi Address';

        const gpsNote = (del.latitude && del.longitude)
          ? `GPS: (${del.latitude}, ${del.longitude})`
          : '';

        const combinedNotes = [del.delivery_notes, gpsNote, specialInstructions].filter(Boolean).join(' • ');

        const deliveryId = uuidv4();
        execute(`
          INSERT INTO delivery_orders (
            id, tenant_id, order_id, recipient_name, recipient_phone,
            delivery_address, delivery_notes, delivery_fee, status,
            estimated_delivery_time, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_dispatch', datetime('now', '+45 minutes'), CURRENT_TIMESTAMP)
        `, [
          deliveryId,
          order.tenant_id || 'tenant-grand-heritage',
          order.id,
          del.recipient_name || customerName || 'Valued Guest',
          del.recipient_phone || customerPhone || '',
          fullAddress,
          combinedNotes,
          del.delivery_fee || 250.0
        ]);
      } catch (delErr) {
        console.error('Error recording delivery_orders entry:', delErr);
      }
    }

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
    tenant_id: table.tenant_id,
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

