import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute, runInTransaction } from '../db/index.js';
import { authenticate, authorize, logAudit } from '../middleware/auth.js';
import { OrderService } from '../modules/orders/orderService.js';
import { emitOrderStatusUpdated } from '../socket/index.js';

export const centralOrderRouter = Router();

centralOrderRouter.use(authenticate);

// 1. GET /api/central-orders/summary: Real-Time Order Operations Pipeline Overview
centralOrderRouter.get('/summary', (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';

  const stats = queryOne(`
    SELECT
      COUNT(*) as total_orders,
      SUM(CASE WHEN status IN ('received', 'pending') THEN 1 ELSE 0 END) as new_orders,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
      SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing_orders,
      SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready_orders,
      SUM(CASE WHEN status IN ('awaiting_dispatch', 'out_for_delivery') THEN 1 ELSE 0 END) as dispatch_orders,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
      COALESCE(SUM(total_amount), 0) as total_revenue
    FROM orders
    WHERE (tenant_id = ? OR tenant_id IS NULL)
  `, [tenantId]);

  const bySource = queryAll(`
    SELECT source, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
    FROM orders
    WHERE (tenant_id = ? OR tenant_id IS NULL)
    GROUP BY source
  `, [tenantId]);

  res.json({
    metrics: stats,
    by_source: bySource,
  });
});

// 2. GET /api/central-orders: Filterable Central Orders List / Kanban Feed
centralOrderRouter.get('/', (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';
  const { source, status, fulfillment_type, search, limit } = req.query;

  let sql = `
    SELECT 
      o.*,
      t.table_number,
      t.name as table_name,
      out.name as outlet_name,
      d.status as delivery_status,
      d.recipient_name as delivery_recipient,
      d.recipient_phone as delivery_phone,
      drv.name as driver_name,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
      (SELECT GROUP_CONCAT(quantity || 'x ' || item_name, ', ') FROM order_items WHERE order_id = o.id) as items_summary
    FROM orders o
    LEFT JOIN restaurant_tables t ON o.table_id = t.id
    LEFT JOIN outlets out ON o.outlet_id = out.id
    LEFT JOIN delivery_orders d ON d.order_id = o.id
    LEFT JOIN drivers drv ON d.driver_id = drv.id
    WHERE (o.tenant_id = ? OR o.tenant_id IS NULL)
  `;
  const params: any[] = [tenantId];

  if (source && source !== 'all') {
    sql += ' AND o.source = ?';
    params.push(source);
  }

  if (status && status !== 'all') {
    sql += ' AND o.status = ?';
    params.push(status);
  }

  if (fulfillment_type && fulfillment_type !== 'all') {
    sql += ' AND o.fulfillment_type = ?';
    params.push(fulfillment_type);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = `%${search.trim().toLowerCase()}%`;
    sql += ` AND (
      LOWER(o.order_number) LIKE ? OR 
      LOWER(COALESCE(o.customer_name, '')) LIKE ? OR 
      LOWER(COALESCE(t.table_number, '')) LIKE ? OR
      LOWER(COALESCE(d.delivery_address, '')) LIKE ?
    )`;
    params.push(q, q, q, q);
  }

  sql += ' ORDER BY o.created_at DESC';

  const maxRows = parseInt(limit as string, 10) || 100;
  sql += ` LIMIT ${maxRows}`;

  const orders = queryAll(sql, params);
  res.json(orders);
});

// 3. GET /api/central-orders/:id: Full Order Deep Dive with Items, KDS Tickets, Delivery & Audit History
centralOrderRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';

  const order = queryOne(`
    SELECT 
      o.*,
      t.table_number,
      t.name as table_name,
      out.name as outlet_name
    FROM orders o
    LEFT JOIN restaurant_tables t ON o.table_id = t.id
    LEFT JOIN outlets out ON o.outlet_id = out.id
    WHERE o.id = ? AND (o.tenant_id = ? OR o.tenant_id IS NULL)
  `, [id, tenantId]);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const items = queryAll(`
    SELECT oi.*, ks.name as station_name
    FROM order_items oi
    LEFT JOIN kitchen_stations ks ON oi.station_id = ks.id
    WHERE oi.order_id = ?
    ORDER BY oi.created_at ASC
  `, [id]);

  const tickets = queryAll(`
    SELECT kt.*, ks.name as station_name, ks.color_code
    FROM kitchen_tickets kt
    JOIN kitchen_stations ks ON kt.station_id = ks.id
    WHERE kt.order_id = ?
    ORDER BY kt.created_at ASC
  `, [id]);

  const delivery = queryOne(`
    SELECT d.*, drv.name as driver_name, drv.phone as driver_phone, drv.vehicle_type, drv.vehicle_plate
    FROM delivery_orders d
    LEFT JOIN drivers drv ON d.driver_id = drv.id
    WHERE d.order_id = ?
  `, [id]);

  const invoice = queryOne(`
    SELECT * FROM invoices WHERE id = (
      SELECT invoice_id FROM payments WHERE tenant_id = ? LIMIT 1
    ) OR table_session_id = ?
  `, [tenantId, order.table_session_id || '']);

  res.json({
    order,
    items,
    tickets,
    delivery,
    invoice,
  });
});

// 4. POST /api/central-orders/create: Omnichannel Order Creation (Takeaway, Online, Phone, Room Service, Delivery)
centralOrderRouter.post('/create', (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';
  const {
    source, // takeaway, online, phone, room_service, delivery, walk_in_pos
    fulfillment_type,
    tableId,
    customer_name,
    customer_phone,
    delivery_address,
    delivery_notes,
    items,
    special_instructions,
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item.' });
  }

  try {
    let defaultTable = tableId;
    if (!defaultTable && req.body.table_number) {
      const numStr = String(req.body.table_number);
      const paddedNum = numStr.padStart(2, '0');
      const foundTbl = queryOne(
        "SELECT id FROM restaurant_tables WHERE tenant_id = ? AND (table_number = ? OR table_number = ?) LIMIT 1",
        [tenantId, numStr, paddedNum]
      );
      if (foundTbl) defaultTable = foundTbl.id;
    }
    if (!defaultTable) {
      defaultTable = queryOne("SELECT id FROM restaurant_tables WHERE tenant_id = ? AND is_active = 1 LIMIT 1", [tenantId])?.id || 'tbl-01';
    }

    const resolvedItems = items.map((i: any) => {
      let menuItemId = i.menu_item_id || i.id;
      if (!menuItemId && i.menu_item_name) {
        const found = queryOne(
          "SELECT id FROM menu_items WHERE tenant_id = ? AND name LIKE ? LIMIT 1",
          [tenantId, `%${i.menu_item_name}%`]
        );
        if (found) menuItemId = found.id;
      }
      if (!menuItemId) {
        const fallback = queryOne("SELECT id FROM menu_items WHERE tenant_id = ? AND is_available = 1 LIMIT 1", [tenantId]);
        if (fallback) menuItemId = fallback.id;
      }
      return {
        menuItemId,
        quantity: i.quantity || 1,
        portionName: i.portion_name,
        portionPrice: i.unit_price || i.price,
        notes: i.notes || i.special_instructions,
      };
    });

    const order = OrderService.createOrder({
      tableId: defaultTable,
      source: source || 'takeaway',
      customerName: customer_name,
      customerPhone: customer_phone,
      specialInstructions: special_instructions,
      items: resolvedItems,
    });

    // Update fulfillment details on the created order
    execute(`
      UPDATE orders
      SET 
        fulfillment_type = ?,
        fulfillment_status = 'confirmed',
        customer_name = ?,
        customer_phone = ?,
        delivery_address = ?,
        packaging_fee = ?,
        delivery_fee = ?
      WHERE id = ?
    `, [
      fulfillment_type || source || 'takeaway',
      customer_name || 'Direct Customer',
      customer_phone || '',
      delivery_address || '',
      req.body.packaging_fee || 0,
      req.body.delivery_fee || 0,
      order.id
    ]);

    // If fulfillment is delivery, create corresponding delivery order
    if (source === 'delivery' || fulfillment_type === 'delivery') {
      const deliveryId = `del-${Date.now()}`;
      execute(`
        INSERT INTO delivery_orders (
          id, tenant_id, order_id, recipient_name, recipient_phone,
          delivery_address, delivery_notes, delivery_fee, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_dispatch')
      `, [
        deliveryId, tenantId, order.id,
        customer_name || 'Delivery Customer',
        customer_phone || '+254700000000',
        delivery_address || 'Customer Delivery Address',
        delivery_notes || '',
        req.body.delivery_fee || 200.0
      ]);
    }

    logAudit(req.user!.id, 'CREATE_CENTRAL_ORDER', 'ORDER', order.id, { source, customer_name, total: order.total_amount });

    const updatedOrder = queryOne('SELECT * FROM orders WHERE id = ?', [order.id]);
    res.status(201).json({
      success: true,
      order: updatedOrder || order,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Order creation failed: ${err.message}` });
  }
});

// 5. PATCH /api/central-orders/:id/status: State Transition Engine
centralOrderRouter.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, cancellation_reason, rejection_reason } = req.body;
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';

  const validStatuses = [
    'received', 'new', 'pending', 'confirmed', 'preparing', 'partially_ready',
    'ready', 'awaiting_dispatch', 'dispatched', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'rejected'
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status: '${status}'. Must be one of: ${validStatuses.join(', ')}` });
  }

  const order = queryOne('SELECT * FROM orders WHERE id = ? AND (tenant_id = ? OR tenant_id IS NULL)', [id, tenantId]);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  execute(`
    UPDATE orders
    SET status = ?, fulfillment_status = ?, rejection_reason = COALESCE(?, rejection_reason), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [status, status, rejection_reason || cancellation_reason || null, id]);

  // Update associated delivery order status if applicable
  if (['out_for_delivery', 'dispatched', 'delivered'].includes(status)) {
    const deliveryStatus = status === 'delivered' ? 'delivered' : 'in_transit';
    if (status === 'delivered') {
      execute(`
        UPDATE delivery_orders
        SET status = ?, delivered_at = CURRENT_TIMESTAMP
        WHERE order_id = ?
      `, [deliveryStatus, id]);
    } else {
      execute(`
        UPDATE delivery_orders
        SET status = ?
        WHERE order_id = ?
      `, [deliveryStatus, id]);
    }
  }

  // Update kitchen tickets if marked ready or completed
  if (status === 'ready' || status === 'completed') {
    execute("UPDATE kitchen_tickets SET status = 'ready', ready_at = CURRENT_TIMESTAMP WHERE order_id = ?", [id]);
  }

  logAudit(req.user!.id, 'UPDATE_ORDER_STATUS', 'ORDER', id, {
    previous_status: order.status,
    new_status: status,
    reason: cancellation_reason || null,
  });

  emitOrderStatusUpdated(order.id, order.session_code || '', status, order);

  res.json({
    success: true,
    message: `Order #${order.order_number} transitioned to '${status}'.`,
    order: queryOne('SELECT * FROM orders WHERE id = ?', [id]),
  });
});
