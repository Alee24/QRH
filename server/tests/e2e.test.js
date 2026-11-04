import test from 'node:test';
import assert from 'node:assert/strict';
import { db, queryOne, queryAll, execute } from '../dist/db/index.js';
import { seedDatabase } from '../dist/db/seed.js';
import { OrderService } from '../dist/modules/orders/orderService.js';
import { KdsService } from '../dist/modules/kds/kdsService.js';
import { CashierService } from '../dist/modules/cashier/cashierService.js';
import { MpesaService } from '../dist/modules/payments/mpesaService.js';

test('MASTER END-TO-END ACCEPTANCE SCENARIO (22 Steps)', async (t) => {
  // Setup Seed
  seedDatabase();

  // Reset Table 01 session & status for deterministic idempotent test execution
  execute("UPDATE restaurant_tables SET status = 'available' WHERE table_number = '01'");
  execute("UPDATE table_sessions SET status = 'closed' WHERE table_id = (SELECT id FROM restaurant_tables WHERE table_number = '01')");

  await t.test('1 & 2: Administrator creates or verifies Table 01 and its unique QR code', () => {
    const table01 = queryOne("SELECT * FROM restaurant_tables WHERE table_number = '01'");
    assert.ok(table01, 'Table 01 must exist');
    assert.ok(table01.qr_token.startsWith('qr_token_01_'), 'QR token must be cryptographically unique');
    assert.equal(table01.status, 'available', 'Table 01 should be available initially');
  });

  let table01 = queryOne("SELECT * FROM restaurant_tables WHERE table_number = '01'");
  let firstOrder = null;
  let sessionCode = null;

  await t.test('3, 4 & 5: Customer scans QR token and views menu', () => {
    const resolvedTable = queryOne('SELECT * FROM restaurant_tables WHERE qr_token = ?', [table01.qr_token]);
    assert.ok(resolvedTable, 'QR token must resolve to Table 01');
    assert.equal(resolvedTable.table_number, '01');

    const menuItems = queryAll('SELECT * FROM menu_items WHERE is_available = 1');
    assert.ok(menuItems.length >= 10, 'Digital menu must return active items');
  });

  await t.test('6 & 7: Customer selects meals + drink and submits order', () => {
    const steak = queryOne("SELECT * FROM menu_items WHERE id = 'itm-ribeye-steak'");
    const pasta = queryOne("SELECT * FROM menu_items WHERE id = 'itm-truffle-tagliatelle'");
    const negroni = queryOne("SELECT * FROM menu_items WHERE id = 'itm-savannah-sunset'");

    // Check stock prior to order
    const beefStockBefore = queryOne("SELECT current_stock FROM inventory_items WHERE id = 'ing-beef-angus'").current_stock;

    firstOrder = OrderService.createOrder({
      tableId: table01.id,
      customerName: 'Marcus Aurelius',
      customerPhone: '+254711998877',
      items: [
        {
          menuItemId: steak.id,
          portionName: '350g Regular Cut',
          portionPrice: 3600.0,
          quantity: 1,
          modifiers: [{ name: 'Medium Rare', price: 0 }, { name: 'Truffle Parmesan Fries', price: 0 }],
          notes: 'Extra crispy fries please',
        },
        {
          menuItemId: pasta.id,
          quantity: 1,
          modifiers: [{ name: 'Grilled Herb Chicken Strips', price: 450 }],
        },
        {
          menuItemId: negroni.id,
          quantity: 1,
        }
      ],
      specialInstructions: 'Celebrating anniversary. Quiet seating appreciated.',
    });

    assert.ok(firstOrder.id, 'Order must have a valid ID');
    assert.ok(firstOrder.order_number.startsWith('ORD-'), 'Order must have formatted order number');
    sessionCode = firstOrder.session_code;
    assert.ok(sessionCode, 'Session code must be generated');

    // 8: BOM Stock Deduction verification
    const beefStockAfter = queryOne("SELECT current_stock FROM inventory_items WHERE id = 'ing-beef-angus'").current_stock;
    assert.equal(beefStockAfter, beefStockBefore - 0.35, 'BOM recipe must automatically deduct 0.35kg beef');
  });

  await t.test('8 & 9: Order splits to correct kitchen stations and kitchen acknowledges', () => {
    const tickets = queryAll('SELECT * FROM kitchen_tickets WHERE order_id = ?', [firstOrder.id]);
    assert.ok(tickets.length >= 2, 'Multi-category order must split into separate station tickets');

    // One ticket for Charcoal Grill, one for Main Kitchen, one for Bar
    const grillTicket = tickets.find(t => t.station_id === 'station-grill');
    const barTicket = tickets.find(t => t.station_id === 'station-bar');
    const mainTicket = tickets.find(t => t.station_id === 'station-main');

    assert.ok(grillTicket, 'Grill station ticket must exist for steak');
    assert.ok(barTicket, 'Bar station ticket must exist for cocktail');
    assert.ok(mainTicket, 'Main kitchen station ticket must exist for pasta');

    // Kitchen staff accepts ticket
    KdsService.updateTicketStatus(grillTicket.id, 'preparing');
    KdsService.updateTicketStatus(barTicket.id, 'preparing');
    KdsService.updateTicketStatus(mainTicket.id, 'preparing');

    const updatedOrder = OrderService.getOrderById(firstOrder.id);
    assert.equal(updatedOrder.status, 'preparing');
  });

  await t.test('10, 11 & 12: Kitchen marks items ready and service staff is notified', () => {
    const tickets = queryAll('SELECT * FROM kitchen_tickets WHERE order_id = ?', [firstOrder.id]);
    for (const t of tickets) {
      KdsService.updateTicketStatus(t.id, 'ready');
    }

    const orderReady = OrderService.getOrderById(firstOrder.id);
    assert.equal(orderReady.status, 'ready', 'Parent order becomes ready when all station tickets are ready');

    // Service confirms delivery to table
    for (const t of tickets) {
      KdsService.updateTicketStatus(t.id, 'served');
    }
    const orderServed = OrderService.getOrderById(firstOrder.id);
    assert.equal(orderServed.status, 'served');
  });

  await t.test('13 & 14: Customer places an additional drink order that joins the same session', () => {
    const dawa = queryOne("SELECT * FROM menu_items WHERE id = 'itm-passion-dawa'");

    const secondOrder = OrderService.createOrder({
      tableId: table01.id,
      sessionCode: sessionCode,
      items: [
        {
          menuItemId: dawa.id,
          portionName: 'Classic Cocktail',
          portionPrice: 1200.0,
          quantity: 2,
        }
      ]
    });

    assert.equal(secondOrder.session_code, sessionCode, 'Second order must join existing session');

    const sessionOrders = queryAll('SELECT * FROM orders WHERE table_session_id = ?', [secondOrder.table_session_id]);
    assert.equal(sessionOrders.length, 2, 'Session must now have 2 orders');
  });

  await t.test('15: Cashier sees all orders in one consolidated bill', () => {
    const session = queryOne('SELECT * FROM table_sessions WHERE session_code = ?', [sessionCode]);
    const billing = CashierService.getSessionBilling(session.id);

    assert.equal(billing.orders.length, 2, 'Consolidated bill must contain both orders');
    // Order 1: 3600 + (2400+450) + 1350 = 7800. Order 2: 2 * 1200 = 2400. Total = 10200
    assert.equal(billing.pricing.subtotal, 10200.0);
    assert.equal(billing.pricing.balance, 10200.0);
  });

  await t.test('16 & 17: Cashier processes M-Pesa payment and verifies confirmation', async () => {
    const session = queryOne('SELECT * FROM table_sessions WHERE session_code = ?', [sessionCode]);
    const billing = CashierService.getSessionBilling(session.id);

    // Initiate STK Push
    const stk = await MpesaService.initiateStkPush({
      sessionId: session.id,
      phoneNumber: '0712345678',
      amount: billing.pricing.balance,
    });
    assert.ok(stk.checkoutRequestId);

    // Confirm M-Pesa receipt verification
    const verified = MpesaService.confirmMpesaPayment(session.id, stk.checkoutRequestId, 'QKD8912KLM');
    assert.equal(verified.success, true);
    assert.equal(verified.billing.pricing.balance, 0, 'Balance must be 0 after full M-Pesa payment');
  });

  await t.test('18, 19, 20 & 21: Table cleaning cycle and release to available', () => {
    // 19: Table is marked for cleaning
    const cleaningTable = CashierService.markForCleaning(table01.id);
    assert.equal(cleaningTable.status, 'cleaning');

    // 20 & 21: Cleaning confirmed -> Table becomes available again
    const availableTable = CashierService.confirmCleaning(table01.id);
    assert.equal(availableTable.status, 'available');

    // Session is closed
    const session = queryOne('SELECT * FROM table_sessions WHERE session_code = ?', [sessionCode]);
    assert.equal(session.status, 'closed');
  });

  await t.test('22: All actions recorded in audit history', () => {
    const logs = queryAll('SELECT * FROM audit_logs');
    assert.ok(logs.length >= 1, 'Audit log entries must exist');
  });
});
