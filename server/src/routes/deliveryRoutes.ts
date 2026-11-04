import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute, runInTransaction } from '../db/index.js';
import { authenticate, authorize, logAudit } from '../middleware/auth.js';

export const deliveryRouter = Router();

deliveryRouter.use(authenticate);

// 1. GET /api/delivery/dashboard: Live Dispatch Metrics
deliveryRouter.get('/dashboard', (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';

  const metrics = queryOne(`
    SELECT
      COUNT(*) as total_deliveries,
      SUM(CASE WHEN status = 'pending_dispatch' THEN 1 ELSE 0 END) as pending_dispatch,
      SUM(CASE WHEN driver_id IS NULL AND status != 'delivered' AND status != 'failed' THEN 1 ELSE 0 END) as unassigned,
      SUM(CASE WHEN status IN ('assigned', 'accepted') THEN 1 ELSE 0 END) as assigned,
      SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_today,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_deliveries,
      COALESCE(SUM(delivery_fee), 0) as total_delivery_revenue
    FROM delivery_orders
    WHERE (tenant_id = ? OR tenant_id IS NULL)
  `, [tenantId]);

  const activeDrivers = queryOne(`
    SELECT 
      COUNT(*) as total_drivers,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_drivers,
      SUM(CASE WHEN status = 'busy' THEN 1 ELSE 0 END) as busy_drivers
    FROM drivers
    WHERE (tenant_id = ? OR tenant_id IS NULL) AND is_active = 1
  `, [tenantId]);

  res.json({
    metrics,
    drivers: activeDrivers,
  });
});

// 2. GET /api/delivery/orders: Delivery Dispatch Queue & Orders Feed
deliveryRouter.get('/orders', (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';
  const { status, driver_id } = req.query;

  let sql = `
    SELECT 
      d.*,
      o.order_number,
      o.total_amount,
      o.payment_status,
      drv.name as driver_name,
      drv.phone as driver_phone,
      drv.vehicle_type,
      drv.vehicle_plate,
      z.name as zone_name
    FROM delivery_orders d
    JOIN orders o ON d.order_id = o.id
    LEFT JOIN drivers drv ON d.driver_id = drv.id
    LEFT JOIN delivery_zones z ON d.zone_id = z.id
    WHERE (d.tenant_id = ? OR d.tenant_id IS NULL)
  `;
  const params: any[] = [tenantId];

  if (status && status !== 'all') {
    sql += ' AND d.status = ?';
    params.push(status);
  }

  if (driver_id && driver_id !== 'all') {
    sql += ' AND d.driver_id = ?';
    params.push(driver_id);
  }

  sql += ' ORDER BY d.created_at DESC LIMIT 100';

  const orders = queryAll(sql, params);
  res.json(orders);
});

// 3. GET /api/delivery/drivers: Driver Roster & Real-Time Availability
deliveryRouter.get('/drivers', (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';
  const drivers = queryAll(`
    SELECT d.*, u.email as user_email
    FROM drivers d
    LEFT JOIN users u ON d.user_id = u.id
    WHERE (d.tenant_id = ? OR d.tenant_id IS NULL) AND d.is_active = 1
    ORDER BY d.status ASC, d.name ASC
  `, [tenantId]);
  res.json(drivers);
});

// 4. GET & POST /api/delivery/zones: Delivery Geofence Zones & Pricing
deliveryRouter.get('/zones', (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';
  const zones = queryAll(`
    SELECT * FROM delivery_zones 
    WHERE (tenant_id = ? OR tenant_id IS NULL) AND is_active = 1
    ORDER BY base_fee ASC
  `, [tenantId]);
  res.json(zones);
});

deliveryRouter.post('/zones', authorize(['super_admin', 'hotel_admin', 'restaurant_manager', 'dispatch_manager']), (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';
  const { name, code, min_order_amount, base_fee, per_km_fee, estimated_minutes } = req.body;

  if (!name || !code) {
    return res.status(400).json({ error: 'Zone name and code are required.' });
  }

  const zoneId = `zone-${uuidv4().substring(0, 8)}`;
  execute(`
    INSERT INTO delivery_zones (id, tenant_id, name, code, min_order_amount, base_fee, per_km_fee, estimated_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [zoneId, tenantId, name, code, min_order_amount || 0, base_fee || 150, per_km_fee || 30, estimated_minutes || 35]);

  res.status(201).json(queryOne('SELECT * FROM delivery_zones WHERE id = ?', [zoneId]));
});

// 5. POST /api/delivery/assign: Assign Order to Driver
deliveryRouter.post('/assign', authorize(['super_admin', 'hotel_admin', 'restaurant_manager', 'dispatch_manager', 'order_manager']), (req, res) => {
  const { delivery_id, order_id, driver_id, distance_km, delivery_fee, estimated_delivery_minutes } = req.body;
  const targetId = delivery_id || order_id;
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';

  if (!targetId || !driver_id) {
    return res.status(400).json({ error: 'delivery_id/order_id and driver_id are required.' });
  }

  const delivery = queryOne('SELECT * FROM delivery_orders WHERE id = ? OR order_id = ?', [targetId, targetId]);
  if (!delivery) return res.status(404).json({ error: 'Delivery order not found.' });

  const driver = queryOne('SELECT * FROM drivers WHERE id = ?', [driver_id]);
  if (!driver) return res.status(404).json({ error: 'Driver not found.' });

  execute(`
    UPDATE delivery_orders
    SET 
      driver_id = ?,
      status = 'assigned',
      assigned_at = CURRENT_TIMESTAMP,
      delivery_fee = COALESCE(?, delivery_fee)
    WHERE id = ?
  `, [driver_id, delivery_fee || null, delivery.id]);

  execute("UPDATE drivers SET status = 'busy' WHERE id = ?", [driver_id]);
  execute("UPDATE orders SET fulfillment_status = 'awaiting_dispatch' WHERE id = ?", [delivery.order_id]);

  logAudit(req.user!.id, 'ASSIGN_DRIVER', 'DELIVERY', delivery.id, { driver_id, driver_name: driver.name });

  const updatedDelivery = queryOne('SELECT * FROM delivery_orders WHERE id = ?', [delivery.id]);

  res.json({
    success: true,
    message: `Delivery successfully assigned to driver '${driver.name}'.`,
    deliveryOrder: {
      ...updatedDelivery,
      delivery_status: updatedDelivery.status,
    },
    delivery: updatedDelivery,
  });
});

// 6. POST /api/delivery/orders/:id/pickup: Driver Confirms Pickup
deliveryRouter.post('/orders/:id/pickup', (req, res) => {
  const { id } = req.params;

  const delivery = queryOne('SELECT * FROM delivery_orders WHERE id = ? OR order_id = ?', [id, id]);
  if (!delivery) return res.status(404).json({ error: 'Delivery order not found.' });

  execute(`
    UPDATE delivery_orders
    SET 
      status = 'in_transit',
      picked_up_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [delivery.id]);

  execute("UPDATE orders SET status = 'out_for_delivery', fulfillment_status = 'out_for_delivery' WHERE id = ?", [delivery.order_id]);

  logAudit(req.user!.id, 'DELIVERY_PICKUP', 'DELIVERY', delivery.id, { order_id: delivery.order_id });

  const updatedDelivery = queryOne('SELECT * FROM delivery_orders WHERE id = ?', [delivery.id]);

  res.json({
    success: true,
    message: 'Pickup confirmed. Delivery is now in transit.',
    deliveryOrder: {
      ...updatedDelivery,
      delivery_status: 'picked_up',
    },
    delivery: updatedDelivery,
  });
});

// 7. POST /api/delivery/orders/:id/complete: Driver Confirms Successful Delivery
deliveryRouter.post('/orders/:id/complete', (req, res) => {
  const { id } = req.params;
  const { proof_of_delivery_note, proof_of_delivery_signature, recipient_name, pod_notes } = req.body;

  const delivery = queryOne('SELECT * FROM delivery_orders WHERE id = ? OR order_id = ?', [id, id]);
  if (!delivery) return res.status(404).json({ error: 'Delivery order not found.' });

  execute(`
    UPDATE delivery_orders
    SET 
      status = 'delivered',
      delivered_at = CURRENT_TIMESTAMP,
      recipient_name = COALESCE(?, recipient_name),
      proof_of_delivery_note = ?,
      proof_of_delivery_signature = ?
    WHERE id = ?
  `, [recipient_name || null, pod_notes || proof_of_delivery_note || 'Delivered to customer at door', proof_of_delivery_signature || null, delivery.id]);

  execute("UPDATE orders SET status = 'completed', fulfillment_status = 'delivered' WHERE id = ?", [delivery.order_id]);

  if (delivery.driver_id) {
    execute("UPDATE drivers SET status = 'available', total_deliveries = total_deliveries + 1 WHERE id = ?", [delivery.driver_id]);
  }

  logAudit(req.user!.id, 'DELIVERY_COMPLETED', 'DELIVERY', delivery.id, { order_id: delivery.order_id });

  const updatedDelivery = queryOne('SELECT * FROM delivery_orders WHERE id = ?', [delivery.id]);

  res.json({
    success: true,
    message: 'Delivery marked completed successfully.',
    deliveryOrder: {
      ...updatedDelivery,
      delivery_status: 'delivered',
      recipient_name: updatedDelivery.recipient_name,
    },
    delivery: updatedDelivery,
  });
});

// 8. POST /api/delivery/orders/:id/fail: Driver or Dispatcher Logs Delivery Failure
deliveryRouter.post('/orders/:id/fail', (req, res) => {
  const { id } = req.params;
  const { failure_reason, failure_notes } = req.body;

  const delivery = queryOne('SELECT * FROM delivery_orders WHERE id = ?', [id]);
  if (!delivery) return res.status(404).json({ error: 'Delivery order not found.' });

  execute(`
    UPDATE delivery_orders
    SET 
      status = 'failed',
      failure_reason = ?,
      failure_notes = ?
    WHERE id = ?
  `, [failure_reason || 'Customer unreachable', failure_notes || '', id]);

  execute("UPDATE orders SET status = 'failed', fulfillment_status = 'failed' WHERE id = ?", [delivery.order_id]);

  if (delivery.driver_id) {
    execute("UPDATE drivers SET status = 'available' WHERE id = ?", [delivery.driver_id]);
  }

  logAudit(req.user!.id, 'DELIVERY_FAILED', 'DELIVERY', id, { reason: failure_reason });

  res.json({
    message: 'Delivery marked as failed.',
    delivery: queryOne('SELECT * FROM delivery_orders WHERE id = ?', [id]),
  });
});

// 9. GET /api/delivery/driver/me: Dedicated Driver Portal Data
deliveryRouter.get('/driver/me', (req, res) => {
  const userId = req.user!.id;
  const driver = queryOne('SELECT * FROM drivers WHERE user_id = ? OR phone = ? LIMIT 1', [userId, req.user!.email]);

  if (!driver) {
    // Return sample driver if testing
    const fallback = queryOne('SELECT * FROM drivers LIMIT 1');
    return res.json({
      driver: fallback,
      assigned_orders: fallback ? queryAll(`
        SELECT d.*, o.order_number, o.total_amount, o.special_instructions
        FROM delivery_orders d
        JOIN orders o ON d.order_id = o.id
        WHERE d.driver_id = ? AND d.status IN ('assigned', 'accepted', 'in_transit')
      `, [fallback.id]) : [],
    });
  }

  const assignedOrders = queryAll(`
    SELECT d.*, o.order_number, o.total_amount, o.special_instructions
    FROM delivery_orders d
    JOIN orders o ON d.order_id = o.id
    WHERE d.driver_id = ? AND d.status IN ('assigned', 'accepted', 'in_transit')
    ORDER BY d.created_at ASC
  `, [driver.id]);

  const history = queryAll(`
    SELECT d.*, o.order_number, o.total_amount
    FROM delivery_orders d
    JOIN orders o ON d.order_id = o.id
    WHERE d.driver_id = ? AND d.status IN ('delivered', 'failed')
    ORDER BY d.delivered_at DESC LIMIT 20
  `, [driver.id]);

  res.json({
    driver,
    assigned_orders: assignedOrders,
    history,
  });
});
