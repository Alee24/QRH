import { v4 as uuidv4 } from 'uuid';
import { db, runInTransaction, queryOne, queryAll, execute } from '../../db/index.js';
import { emitOrderCreated, emitOrderStatusUpdated, emitTableStatusUpdated } from '../../socket/index.js';

export interface OrderItemInput {
  menuItemId: string;
  portionName?: string;
  portionPrice?: number;
  quantity: number;
  modifiers?: { name: string; price: number }[];
  notes?: string;
}

export interface CreateOrderParams {
  tableId: string;
  sessionCode?: string;
  source?: 'qr_code' | 'pos' | 'waiter' | 'room_service';
  customerName?: string;
  customerPhone?: string;
  items: OrderItemInput[];
  specialInstructions?: string;
  idempotencyKey?: string;
}

export class OrderService {
  /**
   * Generates sequential human-readable order number
   */
  static generateOrderNumber(): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countRow = queryOne(`SELECT COUNT(*) as cnt FROM orders WHERE created_at >= date('now')`);
    const nextSeq = (countRow ? Number(countRow.cnt) : 0) + 1;
    return `ORD-${today}-${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Generates KOT (Kitchen Order Ticket) number matching professional KDS format
   */
  static generateKotNumber(stationCode: string): string {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `KOT-${rand}-${stationCode}`;
  }

  /**
   * Transactional creation of order, item snapshots, kitchen tickets, and stock deduction
   */
  static createOrder(params: CreateOrderParams) {
    if (!params.items || params.items.length === 0) {
      throw new Error('Order must contain at least one item.');
    }

    // Check idempotency
    if (params.idempotencyKey) {
      const existing = queryOne('SELECT * FROM orders WHERE idempotency_key = ?', [params.idempotencyKey]);
      if (existing) {
        return this.getOrderById(existing.id);
      }
    }

    return runInTransaction(() => {
      // 1. Verify Table (or resolve master hotel dining table)
      let table = queryOne('SELECT * FROM restaurant_tables WHERE id = ? OR qr_token = ? OR table_number = ?', [params.tableId, params.tableId, params.tableId]);
      if (!table) {
        // Fallback to first available restaurant table
        table = queryOne('SELECT * FROM restaurant_tables ORDER BY created_at ASC LIMIT 1');
      }
      if (!table) {
        throw new Error('No dining tables configured in the restaurant.');
      }

      // 2. Resolve or Create Active Table Session
      let session = queryOne(`
        SELECT * FROM table_sessions 
        WHERE table_id = ? AND status IN ('active', 'bill_requested')
        ORDER BY opened_at DESC LIMIT 1
      `, [table.id]);

      if (!session) {
        const sessionId = uuidv4();
        const sessionCode = `SES-${Math.floor(100000 + Math.random() * 900000)}`;
        execute(`
          INSERT INTO table_sessions (id, tenant_id, table_id, outlet_id, session_code, guest_count, customer_name, customer_phone, status)
          VALUES (?, ?, ?, ?, ?, 1, ?, ?, 'active')
        `, [sessionId, table.tenant_id || 'tenant-grand-heritage', table.id, table.outlet_id, sessionCode, params.customerName || 'Guest', params.customerPhone || null]);

        session = queryOne('SELECT * FROM table_sessions WHERE id = ?', [sessionId]);
      } else if (params.customerName || params.customerPhone) {
        execute(`
          UPDATE table_sessions 
          SET customer_name = COALESCE(?, customer_name), customer_phone = COALESCE(?, customer_phone)
          WHERE id = ?
        `, [params.customerName, params.customerPhone, session.id]);
      }

      // 3. Process each item with immutable price snapshots
      let subtotal = 0;
      const processedItems: any[] = [];
      const stationMap = new Map<string, any[]>();

      for (const itemInput of params.items) {
        const menuItem = queryOne(`
          SELECT m.*, c.name as category_name 
          FROM menu_items m
          JOIN menu_categories c ON m.category_id = c.id
          WHERE m.id = ?
        `, [itemInput.menuItemId]);

        if (!menuItem) {
          throw new Error(`Menu item not found: ${itemInput.menuItemId}`);
        }
        if (!menuItem.is_available || menuItem.is_sold_out) {
          throw new Error(`Item "${menuItem.name}" is currently unavailable or sold out.`);
        }

        // Determine base price: portion or standard item price
        let unitPrice = menuItem.price;
        let portionName = itemInput.portionName || null;
        if (itemInput.portionName && itemInput.portionPrice !== undefined) {
          unitPrice = itemInput.portionPrice;
        }

        // Calculate modifiers
        let modifiersCost = 0;
        const modifiersSummary = itemInput.modifiers && itemInput.modifiers.length > 0 
          ? JSON.stringify(itemInput.modifiers) 
          : null;

        if (itemInput.modifiers) {
          for (const mod of itemInput.modifiers) {
            modifiersCost += mod.price;
          }
        }

        const itemTotal = (unitPrice + modifiersCost) * itemInput.quantity;
        subtotal += itemTotal;

        const orderItemId = uuidv4();
        const stationId = menuItem.station_id || 'station-main';

        processedItems.push({
          id: orderItemId,
          menuItemId: menuItem.id,
          stationId,
          name: menuItem.name,
          portionName,
          unitPrice,
          quantity: itemInput.quantity,
          modifiersSummary,
          modifiersCost,
          totalPrice: itemTotal,
          notes: itemInput.notes || null,
        });

        // Group by kitchen station
        if (!stationMap.has(stationId)) {
          stationMap.set(stationId, []);
        }
        stationMap.get(stationId)!.push({
          orderItemId,
          quantity: itemInput.quantity,
          name: menuItem.name,
          portionName,
          modifiersSummary,
          notes: itemInput.notes,
        });

        // 4. Recipe Bill of Materials (BOM) - Deduct Stock
        const recipes = queryAll('SELECT * FROM recipes WHERE menu_item_id = ?', [menuItem.id]);
        for (const recipe of recipes) {
          const deductionQty = recipe.quantity_required * itemInput.quantity;
          // Deduct from inventory
          execute(`
            UPDATE inventory_items 
            SET current_stock = MAX(0, current_stock - ?), updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [deductionQty, recipe.ingredient_id]);

          // Log movement
          execute(`
            INSERT INTO stock_movements (id, ingredient_id, movement_type, quantity, unit, reference_id, notes)
            VALUES (?, ?, 'order_deduction', ?, ?, ?, ?)
          `, [
            uuidv4(), recipe.ingredient_id, deductionQty, recipe.unit,
            orderItemId, `Auto-deducted for ${itemInput.quantity}x ${menuItem.name}`
          ]);
        }
      }

      // 5. Taxes & Totals (Kenya defaults: VAT 16%, Catering Levy 2%)
      // In dining, menu prices are typically VAT inclusive or computed. We compute breakdown:
      const hotel = queryOne('SELECT * FROM hotels LIMIT 1');
      const vatRate = hotel ? hotel.vat_rate / 100 : 0.16;
      const levyRate = hotel ? hotel.catering_levy_rate / 100 : 0.02;

      const taxAmount = Math.round(subtotal * (vatRate + levyRate) * 100) / 100;
      const totalAmount = subtotal; // Inclusive pricing or standard billing

      // 6. Insert Order
      const orderId = uuidv4();
      const orderNumber = this.generateOrderNumber();

      execute(`
        INSERT INTO orders (id, tenant_id, order_number, table_session_id, table_id, outlet_id, source, status, payment_status, subtotal, tax_amount, discount_amount, total_amount, special_instructions, idempotency_key, customer_name, customer_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'received', 'unpaid', ?, ?, 0.0, ?, ?, ?, ?, ?)
      `, [
        orderId, table.tenant_id || 'tenant-grand-heritage', orderNumber, session.id, table.id, table.outlet_id,
        params.source || 'qr_code', subtotal, taxAmount, totalAmount,
        params.specialInstructions || null, params.idempotencyKey || null,
        params.customerName || session.customer_name || 'Guest',
        params.customerPhone || session.customer_phone || null
      ]);

      // 7. Insert Order Items
      for (const p of processedItems) {
        execute(`
          INSERT INTO order_items (id, order_id, menu_item_id, station_id, item_name, portion_name, unit_price, quantity, modifiers_summary, modifiers_cost, total_price, notes, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received')
        `, [
          p.id, orderId, p.menuItemId, p.stationId, p.name, p.portionName,
          p.unitPrice, p.quantity, p.modifiersSummary, p.modifiersCost,
          p.totalPrice, p.notes
        ]);
      }

      // 8. Generate Kitchen Tickets (KOT) split by station
      const generatedTickets: any[] = [];
      for (const [stationId, stationItems] of stationMap.entries()) {
        const station = queryOne('SELECT * FROM kitchen_stations WHERE id = ?', [stationId]);
        const stationCode = station ? station.code : 'GEN';
        const ticketId = uuidv4();
        const kotNumber = this.generateKotNumber(stationCode);

        execute(`
          INSERT INTO kitchen_tickets (id, tenant_id, kot_number, order_id, station_id, table_number, status, priority)
          VALUES (?, ?, ?, ?, ?, ?, 'pending', 'normal')
        `, [ticketId, table.tenant_id || 'tenant-grand-heritage', kotNumber, orderId, stationId, table.table_number]);

        for (const sit of stationItems) {
          execute(`
            INSERT INTO kitchen_ticket_items (id, ticket_id, order_item_id, status, quantity, item_name, portion_name, modifiers_summary, notes)
            VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)
          `, [
            uuidv4(), ticketId, sit.orderItemId, sit.quantity,
            sit.name, sit.portionName, sit.modifiersSummary, sit.notes
          ]);
        }

        generatedTickets.push({
          id: ticketId,
          kot_number: kotNumber,
          station_id: stationId,
          station_name: station ? station.name : 'Kitchen',
          status: 'pending',
          table_number: table.table_number,
          items: stationItems,
        });
      }

      // 9. Update Table & Session status
      execute(`
        UPDATE restaurant_tables 
        SET status = 'ordering', updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'available'
      `, [table.id]);

      execute(`
        UPDATE table_sessions 
        SET total_amount = total_amount + ?, balance_amount = balance_amount + ?
        WHERE id = ?
      `, [totalAmount, totalAmount, session.id]);

      const fullOrder = this.getOrderById(orderId);
      fullOrder.session_code = session.session_code;

      // Broadcast events
      emitOrderCreated(fullOrder, generatedTickets);
      emitTableStatusUpdated(table.id, 'ordering', table);

      return fullOrder;
    });
  }

  /**
   * Retrieves an order with all items, tickets, and session context
   */
  static getOrderById(orderId: string) {
    const order = queryOne(`
      SELECT o.*, t.table_number, t.name as table_name, s.session_code
      FROM orders o
      JOIN restaurant_tables t ON o.table_id = t.id
      JOIN table_sessions s ON o.table_session_id = s.id
      WHERE o.id = ?
    `, [orderId]);

    if (!order) return null;

    order.items = queryAll(`
      SELECT oi.*, ks.name as station_name
      FROM order_items oi
      LEFT JOIN kitchen_stations ks ON oi.station_id = ks.id
      WHERE oi.order_id = ?
    `, [orderId]);

    order.tickets = queryAll(`
      SELECT kt.*, ks.name as station_name, ks.color_code as station_color
      FROM kitchen_tickets kt
      JOIN kitchen_stations ks ON kt.station_id = ks.id
      WHERE kt.order_id = ?
    `, [orderId]);

    return order;
  }

  /**
   * Updates preparation or fulfillment status of an order
   */
  static updateOrderStatus(orderId: string, status: string) {
    return runInTransaction(() => {
      const order = queryOne('SELECT o.*, s.session_code FROM orders o JOIN table_sessions s ON o.table_session_id = s.id WHERE o.id = ?', [orderId]);
      if (!order) throw new Error('Order not found');

      execute(`
        UPDATE orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [status, orderId]);

      // If status is preparing, table status becomes preparing
      if (status === 'preparing') {
        execute(`UPDATE restaurant_tables SET status = 'preparing' WHERE id = ?`, [order.table_id]);
      } else if (status === 'ready') {
        execute(`UPDATE restaurant_tables SET status = 'ready' WHERE id = ?`, [order.table_id]);
      }

      const updated = this.getOrderById(orderId);
      emitOrderStatusUpdated(orderId, order.session_code, status, updated);
      return updated;
    });
  }
}

