import assert from 'node:assert';

const API_BASE = 'http://localhost:8966/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = options.headers || {};
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });

  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, data };
}

async function runTests() {
  console.log('🧪 Starting Hotel Master QR Standee, Customer Name/Phone M-Pesa STK Push & 10 Themes Test Suite...\n');

  // 1. Authenticate as Hotel Admin
  console.log('1. Authenticating as Hotel Administrator...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@hotel.com', password: 'Admin@2026!' },
  });
  assert.strictEqual(loginRes.status, 200, 'Login must succeed with 200');
  const token = loginRes.data.token;
  console.log('   ✅ Authenticated successfully.');

  // 2. Test GET /api/hotel/master-qr
  console.log('2. Testing GET /api/hotel/master-qr...');
  const masterQrRes = await request('/hotel/master-qr', { token });
  assert.strictEqual(masterQrRes.status, 200, 'GET /hotel/master-qr must return 200');
  const qrData = masterQrRes.data;
  assert.ok(qrData.token, 'Must return a master QR token');
  assert.ok(qrData.direct_url, 'Must return a customer direct URL');
  assert.ok(qrData.direct_url.includes('table=') || qrData.direct_url.includes('token='), 'Direct URL must contain table or token parameter');
  assert.ok(qrData.hotel_name, 'Must return hotel name');
  console.log(`   ✅ Master QR Token: "${qrData.token}"`);
  console.log(`   ✅ Direct Ordering URL: "${qrData.direct_url}"`);
  console.log(`   ✅ Wi-Fi SSID: "${qrData.wifi_ssid}"`);

  // 3. Test POST /api/hotel/master-qr/regenerate
  console.log('3. Testing POST /api/hotel/master-qr/regenerate...');
  const regenRes = await request('/hotel/master-qr/regenerate', {
    method: 'POST',
    token,
  });
  assert.strictEqual(regenRes.status, 200, 'Regenerate must return 200');
  assert.ok(regenRes.data.token, 'Must return new token');
  assert.notStrictEqual(regenRes.data.token, qrData.token, 'New token must differ from old token');
  console.log(`   ✅ Successfully regenerated master token: "${regenRes.data.token}"`);

  // 4. Test Theme Preset Switching (POST /api/hotel/theme)
  console.log('4. Testing 10 Theme Engine Switching (POST /api/hotel/theme)...');
  const themeSwitch1 = await request('/hotel/theme', {
    method: 'POST',
    token,
    body: { themePreset: 'emerald_savanna' },
  });
  assert.strictEqual(themeSwitch1.status, 200, 'Switching theme must return 200');
  assert.strictEqual(themeSwitch1.data.theme_preset, 'emerald_savanna');

  // Verify persistence via GET /api/hotel/settings
  const settingsRes = await request('/hotel/settings', { token });
  assert.strictEqual(settingsRes.status, 200);
  assert.strictEqual(settingsRes.data.theme_preset, 'emerald_savanna', 'Persisted theme must be emerald_savanna');
  console.log('   ✅ Successfully updated and persisted theme to "emerald_savanna".');

  // Switch to Sapphire Blue
  const themeSwitch2 = await request('/hotel/theme', {
    method: 'POST',
    token,
    body: { themePreset: 'sapphire_blue' },
  });
  assert.strictEqual(themeSwitch2.status, 200);
  assert.strictEqual(themeSwitch2.data.theme_preset, 'sapphire_blue');
  console.log('   ✅ Successfully updated theme to "sapphire_blue".');

  // 5. Test Customer Ordering with Master QR & Customer Details (Name & Phone Number)
  console.log('5. Testing Master QR Customer Order Submission with Customer Name & Phone Number...');
  // Get active menu items from menu categories
  const menuRes = await request('/menu?mode=demo');
  assert.strictEqual(menuRes.status, 200);
  const categories = menuRes.data.categories || menuRes.data;
  assert.ok(categories.length > 0, 'Menu must have categories');
  let testDish = null;
  for (const cat of categories) {
    if (cat.items && cat.items.length > 0) {
      testDish = cat.items[0];
      break;
    }
  }
  assert.ok(testDish, 'A test dish must be found in menu');

  const orderPayload = {
    tableId: 'hotel_master', // Master standee table identifier
    customerName: 'Amina Wanjiku',
    customerPhone: '0722001122',
    deliveryLocation: 'Terrace Table 4 / Poolside',
    orderType: 'dine_in',
    items: [
      {
        menuItemId: testDish.id,
        quantity: 2,
        notes: 'Extra lime and gentle spices, please',
      },
    ],
  };

  const createOrderRes = await request('/orders', {
    method: 'POST',
    body: orderPayload,
  });
  assert.strictEqual(createOrderRes.status, 201, 'Master QR order creation must return 201');
  const createdOrder = createOrderRes.data;
  assert.ok(createdOrder.id, 'Must return order id');
  assert.strictEqual(createdOrder.customer_name, 'Amina Wanjiku', 'Must record customer name');
  assert.strictEqual(createdOrder.customer_phone, '0722001122', 'Must record customer phone');
  assert.strictEqual(createdOrder.status, 'received', 'Order must start in received state');
  console.log(`   ✅ Order placed: #${createdOrder.order_number} for "${createdOrder.customer_name}" (${createdOrder.customer_phone})`);
  console.log(`   ✅ Total Amount: KES ${createdOrder.total_amount}`);

  // 6. Test Safaricom Daraja M-Pesa STK Push
  console.log('6. Initiating M-Pesa STK Push Prompt for Order...');
  const stkRes = await request('/payments/mpesa/stk-push', {
    method: 'POST',
    body: {
      orderId: createdOrder.id,
      phone: '0722001122',
      amount: createdOrder.total_amount,
    },
  });
  assert.strictEqual(stkRes.status, 200, 'STK Push initiation must return 200');
  assert.strictEqual(stkRes.data.success, true);
  assert.ok(stkRes.data.checkoutRequestId, 'Must return checkoutRequestId');
  assert.ok(stkRes.data.phone.startsWith('254'), 'Phone number must be formatted to Kenyan format 254...');
  console.log(`   ✅ STK Push dispatched to ${stkRes.data.phone}. CheckoutRequestId: ${stkRes.data.checkoutRequestId}`);

  // 7. Test M-Pesa Payment Simulation / Verification (Customer Enters PIN)
  console.log('7. Simulating Customer Enters PIN (Instant Payment Verification)...');
  const verifyRes = await request('/payments/mpesa/verify', {
    method: 'POST',
    body: {
      checkoutRequestId: stkRes.data.checkoutRequestId,
      orderId: createdOrder.id,
    },
  });
  assert.strictEqual(verifyRes.status, 200, 'Verification must return 200');
  assert.strictEqual(verifyRes.data.status, 'COMPLETED');
  assert.ok(verifyRes.data.receiptNumber, 'Must generate M-Pesa receipt number');
  console.log(`   ✅ Payment Confirmed! Receipt: ${verifyRes.data.receiptNumber}, Amount: KES ${verifyRes.data.amount}`);

  // 8. Verify Order Status Updated to Paid and Accessible in Dashboard
  console.log('8. Verifying Order Status updated in Central Order Queue...');
  const orderDetailsRes = await request(`/orders/${createdOrder.id}`, { token });
  assert.strictEqual(orderDetailsRes.status, 200);
  assert.strictEqual(orderDetailsRes.data.payment_status, 'paid', 'Order payment status must now be paid');
  console.log(`   ✅ Verified Order #${orderDetailsRes.data.order_number} payment_status = ${orderDetailsRes.data.payment_status}`);

  console.log('\n=============================================================');
  console.log('🎉 ALL MASTER QR, M-PESA STK & 10 THEME TESTS PASSED CLEANLY!');
  console.log('=============================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
