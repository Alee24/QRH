import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.API_URL || 'http://localhost:8966';

test('MENU & ORDERING SIMULATION VERIFICATION SUITE', async (t) => {
  await t.test('1. Verify GET /api/menu returns full categorized dishes with portions and modifiers', async () => {
    const res = await fetch(`${BASE_URL}/api/menu`);
    assert.equal(res.status, 200);
    const data = await res.json();

    assert.ok(Array.isArray(data.categories), 'categories must be an array');
    assert.ok(data.categories.length > 0, 'must have categories');

    const totalItems = data.categories.flatMap((c) => c.items || []);
    console.log(`✓ Total menu dishes returned from /api/menu: ${totalItems.length}`);
    assert.ok(totalItems.length >= 20, `Expected at least 20 items, got ${totalItems.length}`);

    // Verify key categories have items
    const breakfast = data.categories.find((c) => c.id === 'cat-breakfast');
    assert.ok(breakfast && breakfast.items.length > 0, 'Gourmet Breakfast must have items');

    const grill = data.categories.find((c) => c.id === 'cat-grill');
    assert.ok(grill && grill.items.length > 0, 'Prime Grill & Steaks must have items');

    const swahili = data.categories.find((c) => c.id === 'cat-swahili');
    assert.ok(swahili && swahili.items.length > 0, 'Swahili Delicacies must have items');

    const cocktails = data.categories.find((c) => c.id === 'cat-cocktails');
    assert.ok(cocktails && cocktails.items.length > 0, 'Cocktails must have items');

    // Verify dish details on ribeye steak
    const ribeye = totalItems.find((i) => i.id === 'itm-ribeye-steak');
    assert.ok(ribeye, 'Ribeye steak must exist');
    assert.equal(ribeye.price, 3600);
    assert.ok(ribeye.portions && ribeye.portions.length > 0, 'Ribeye must have portions');
    assert.ok(ribeye.modifier_groups && ribeye.modifier_groups.length > 0, 'Ribeye must have modifier groups');
  });

  await t.test('2. Simulate Guest Table QR Scan & Order Placement Flow', async () => {
    // 2.1 Get Table 01
    const tablesRes = await fetch(`${BASE_URL}/api/tables?tenant_id=tenant-grand-heritage`);
    assert.equal(tablesRes.status, 200);
    const tables = await tablesRes.json();
    const table01 = tables.find((t) => t.table_number === '01');
    assert.ok(table01, 'Table 01 must exist');

    // 2.2 Scan Table 01 QR
    const scanRes = await fetch(`${BASE_URL}/api/tables/scan/${table01.qr_token}`);
    assert.equal(scanRes.status, 200);
    const scanData = await scanRes.json();
    assert.ok(scanData.table, 'Table scan must return table');

    // 2.3 Place an order for Table 01
    const orderPayload = {
      tableId: table01.id,
      source: 'qr_code',
      customerName: 'Guest Table 01',
      customerPhone: '254712345678',
      items: [
        {
          menuItemId: 'itm-ribeye-steak',
          portionName: '350g Regular Cut',
          portionPrice: 3600,
          quantity: 1,
          modifiers: [{ name: 'Medium Rare', price: 0 }, { name: 'Truffle Parmesan Fries', price: 0 }],
          notes: 'No salt on fries'
        },
        {
          menuItemId: 'itm-passion-dawa',
          portionName: 'Spirited Cane Cocktail',
          portionPrice: 1200,
          quantity: 2,
          modifiers: [],
          notes: ''
        }
      ],
      specialInstructions: 'Celebrating birthday at Table 01',
      idempotencyKey: `test_idemp_${Date.now()}`
    };

    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    assert.equal(orderRes.status, 201);
    const newOrder = await orderRes.json();
    assert.ok(newOrder.id, 'New order must have ID');
    assert.equal(newOrder.total_amount, 6000); // 3600 + (1200 * 2) = 6000

    // 2.4 Simulate M-Pesa STK Push
    const stkRes = await fetch(`${BASE_URL}/api/payments/mpesa/stk-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: newOrder.table_session_id,
        phoneNumber: '254712345678',
        amount: newOrder.total_amount
      })
    });

    assert.equal(stkRes.status, 200);
    const stkData = await stkRes.json();
    assert.ok(stkData.checkoutRequestId, 'STK push must return checkoutRequestId');

    // 2.5 Verify M-Pesa STK settlement
    const verifyRes = await fetch(`${BASE_URL}/api/payments/mpesa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: newOrder.table_session_id,
        checkoutRequestId: stkData.checkoutRequestId
      })
    });

    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.success, true);
    assert.equal(verifyData.status, 'COMPLETED');
    assert.ok(verifyData.receiptNumber, 'Receipt number must be generated');
    console.log(`✓ Order #${newOrder.order_number} simulated and paid via M-Pesa (Receipt: ${verifyData.receiptNumber})`);
  });
});
