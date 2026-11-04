import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.API_URL || 'http://localhost:8966';

test('MASTER SYSTEM AUDIT: ROLES, QR ORDERING & CROSS-DEPARTMENT ROUTING', async (t) => {
  const allRolesToTest = [
    // Level 1: SaaS Platform Core
    { email: 'superadmin@plateiq.cloud', role: 'saas_super_admin' },
    { email: 'support@plateiq.cloud', role: 'saas_support_admin' },
    { email: 'finance@plateiq.cloud', role: 'saas_finance_admin' },
    { email: 'tech@plateiq.cloud', role: 'saas_tech_admin' },

    // Level 2: Hotel Leadership
    { email: 'admin@hotel.com', role: 'super_admin' },
    { email: 'gm@serenasafari.com', role: 'hotel_owner' },
    { email: 'manager@hotel.com', role: 'restaurant_manager' },
    { email: 'admin-ops@hotel.com', role: 'hotel_admin' },

    // Level 3: Kitchen & Beverage Operations
    { email: 'chef@hotel.com', role: 'kitchen_manager' },
    { email: 'grill@hotel.com', role: 'kitchen_staff' },
    { email: 'bar@hotel.com', role: 'kitchen_staff' },
    { email: 'pastry@hotel.com', role: 'kitchen_staff' },

    // Level 3: Front of House & Finance
    { email: 'cashier@hotel.com', role: 'cashier' },
    { email: 'runner@hotel.com', role: 'service_staff' },
    { email: 'reception@hotel.com', role: 'receptionist' },
    { email: 'inventory@hotel.com', role: 'inventory_manager' },
    { email: 'accountant@hotel.com', role: 'accountant' },
    { email: 'audit@hotel.com', role: 'auditor' },
  ];

  await t.test('1. Verify all 18 system roles authenticate successfully', async () => {
    for (const r of allRolesToTest) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: r.email, password: 'Admin@2026!' }),
      });
      assert.equal(res.status, 200, `Role ${r.role} (${r.email}) must be authenticatable`);
      const data = await res.json();
      assert.ok(data.token, `Token must be returned for ${r.email}`);
      assert.equal(data.user.email, r.email);
    }
  });

  let table01 = null;
  let qrToken = '';
  let customerOrder = null;
  let sessionCode = '';

  await t.test('2. Customer scans QR code for Table 01 and loads digital menu', async () => {
    // 1. Get Table 01
    const tablesRes = await fetch(`${BASE_URL}/api/tables?tenant_id=tenant-grand-heritage`);
    assert.equal(tablesRes.status, 200);
    const tables = await tablesRes.json();
    table01 = tables.find((t) => t.table_number === '01');
    assert.ok(table01, 'Table 01 must exist');
    qrToken = table01.qr_token;

    // 2. Scan QR
    const scanRes = await fetch(`${BASE_URL}/api/tables/scan/${qrToken}`);
    assert.equal(scanRes.status, 200);
    const scanData = await scanRes.json();
    assert.equal(scanData.table.table_number, '01');
    assert.ok(scanData.table.hotel_name);

    // 3. Load digital menu
    const menuRes = await fetch(`${BASE_URL}/api/menu`);
    assert.equal(menuRes.status, 200);
    const menuData = await menuRes.json();
    assert.ok(menuData.categories.length > 0, 'Menu must contain categories');
  });

  await t.test('3. Customer places multi-station order (Grill, Main Kitchen, Bar, Pastry)', async () => {
    // Fetch menu items to get IDs
    const menuRes = await fetch(`${BASE_URL}/api/menu`);
    const menu = await menuRes.json();

    let ribeyeId = '';
    let tagliatelleId = '';
    let negroniId = '';
    let fondantId = '';

    for (const c of menu.categories) {
      for (const item of c.items) {
        if (item.name.includes('Ribeye')) ribeyeId = item.id;
        if (item.name.includes('Tagliatelle')) tagliatelleId = item.id;
        if (item.name.includes('Negroni') || item.name.includes('Savannah Sunset')) negroniId = item.id;
        if (item.name.includes('Fondant')) fondantId = item.id;
      }
    }

    assert.ok(ribeyeId, 'Ribeye Steak item must exist');
    assert.ok(tagliatelleId, 'Truffle Tagliatelle item must exist');
    assert.ok(negroniId, 'Savannah Sunset item must exist');
    assert.ok(fondantId, 'Chocolate Fondant item must exist');

    const orderPayload = {
      tableId: table01.id,
      source: 'qr_code',
      customerName: 'Ambassador Al-Mansoor',
      customerPhone: '+254700888999',
      items: [
        {
          menuItemId: ribeyeId,
          portionName: '350g Regular Cut',
          quantity: 1,
          modifiers: [{ name: 'Medium Rare', price: 0 }, { name: 'Truffle Parmesan Fries', price: 0 }],
          notes: 'No salt on fries please',
        },
        {
          menuItemId: tagliatelleId,
          quantity: 1,
          modifiers: [{ name: 'Grilled Herb Chicken Strips', price: 450 }],
          notes: 'Extra parmesan on side',
        },
        {
          menuItemId: negroniId,
          quantity: 2,
        },
        {
          menuItemId: fondantId,
          quantity: 1,
          notes: 'Serve with warm vanilla bean gelato',
        },
      ],
      specialInstructions: 'VIP Anniversary Table. Please time dessert after mains.',
      idempotencyKey: `idemp-audit-${Date.now()}`,
    };

    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    assert.equal(orderRes.status, 201, 'Order must be created successfully');
    customerOrder = await orderRes.json();
    assert.ok(customerOrder.id);
    assert.ok(customerOrder.order_number.startsWith('ORD-'));
    assert.equal(customerOrder.status, 'received');
    assert.equal(customerOrder.payment_status, 'unpaid');
    sessionCode = customerOrder.session_code;
    assert.ok(sessionCode);
  });

  let stationTickets = [];

  await t.test('4. Verify order routed to respective Kitchen Stations (KDS Multi-Station Split)', async () => {
    // Fetch all active tickets for this tenant
    const ticketsRes = await fetch(`${BASE_URL}/api/kds/tickets?tenant_id=tenant-grand-heritage`);
    assert.equal(ticketsRes.status, 200);
    const allTickets = await ticketsRes.json();

    stationTickets = allTickets.filter((t) => t.order_id === customerOrder.id);
    assert.ok(stationTickets.length >= 3, 'Order must split into multiple kitchen station tickets');

    // Verify station ticket distribution
    const stationCodes = stationTickets.map((t) => t.station_code);
    assert.ok(stationCodes.includes('GRILL') || stationCodes.includes('MAIN'), 'Must have hot kitchen tickets');
    assert.ok(stationCodes.includes('BAR'), 'Must have bar ticket');

    // Test station-specific filtering
    const barTicketsRes = await fetch(`${BASE_URL}/api/kds/tickets?stationId=station-bar&tenant_id=tenant-grand-heritage`);
    const barTickets = await barTicketsRes.json();
    assert.ok(barTickets.some((t) => t.order_id === customerOrder.id), 'Bar KDS must see its specific ticket');
  });

  await t.test('5. Kitchen acknowledges and completes tickets (Pending -> Preparing -> Ready)', async () => {
    for (const t of stationTickets) {
      // 1. Start Preparing
      const prepRes = await fetch(`${BASE_URL}/api/kds/tickets/${t.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'preparing' }),
      });
      assert.equal(prepRes.status, 200);
      const prepData = await prepRes.json();
      assert.equal(prepData.status, 'preparing');
      assert.ok(prepData.started_at, 'Prep timestamp must be recorded');

      // 2. Mark Ready for Service Runner
      const readyRes = await fetch(`${BASE_URL}/api/kds/tickets/${t.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready' }),
      });
      assert.equal(readyRes.status, 200);
      const readyData = await readyRes.json();
      assert.equal(readyData.status, 'ready');
      assert.ok(readyData.ready_at, 'Ready timestamp must be recorded');
    }
  });

  await t.test('6. Food Runner / Service Department receives ready tickets and delivers to Table', async () => {
    // 1. Food Runner views delivery queue
    const queueRes = await fetch(`${BASE_URL}/api/service/ready-tickets`);
    assert.equal(queueRes.status, 200);
    const readyQueue = await queueRes.json();
    assert.ok(readyQueue.length > 0, 'Ready tickets must appear in service queue');

    // 2. Runner confirms table delivery for each ticket
    for (const t of stationTickets) {
      const deliverRes = await fetch(`${BASE_URL}/api/service/tickets/${t.id}/deliver`, {
        method: 'POST',
      });
      assert.equal(deliverRes.status, 200);
    }

    // 3. Verify order status transitioned to 'served'
    const updatedOrderRes = await fetch(`${BASE_URL}/api/orders/${customerOrder.id}`);
    const updatedOrder = await updatedOrderRes.json();
    assert.equal(updatedOrder.status, 'served', 'Parent order must be marked served once all tickets are delivered');
  });

  await t.test('7. Cashier POS reviews consolidated table session bill and settles payment', async () => {
    // 1. Cashier gets consolidated table session
    const cashierRes = await fetch(`${BASE_URL}/api/cashier/session/${customerOrder.table_session_id}`);
    assert.equal(cashierRes.status, 200);
    const bill = await cashierRes.json();

    assert.ok(bill.session, 'Session must exist');
    assert.ok(bill.session.balance_amount > 0, 'Bill balance must be positive');
    assert.ok(bill.orders.length >= 1, 'Consolidated bill must contain the order(s)');

    // 2. Cashier processes payment (M-Pesa tender)
    const payRes = await fetch(`${BASE_URL}/api/cashier/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: customerOrder.table_session_id,
        amount: bill.session.balance_amount,
        paymentMethod: 'mpesa',
        mpesaPhone: '0712345678',
        referenceNumber: `MPESA-AUDIT-${Date.now()}`,
      }),
    });

    assert.equal(payRes.status, 200);
    const payResult = await payRes.json();
    assert.equal(payResult.pricing.balance, 0, 'Balance must be 0 after full settlement');
    assert.ok(payResult.pricing.totalPaid >= payResult.pricing.totalAmount, 'Total paid must cover bill');
  });

  await t.test('8. Table release cycle: Settle -> Cleaning -> Available', async () => {
    // 1. Mark table for cleaning via Cashier pipeline
    const cleanRes = await fetch(`${BASE_URL}/api/cashier/table/${table01.id}/mark-cleaning`, {
      method: 'POST',
    });
    assert.equal(cleanRes.status, 200);
    const cleanData = await cleanRes.json();
    assert.equal(cleanData.table.status, 'cleaning');

    // 2. Mark table available for next guest via confirm-cleaning
    const availRes = await fetch(`${BASE_URL}/api/cashier/table/${table01.id}/confirm-cleaning`, {
      method: 'POST',
    });
    assert.equal(availRes.status, 200);
    const availData = await availRes.json();
    assert.equal(availData.table.status, 'available');
  });
});
