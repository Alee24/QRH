import assert from 'node:assert';
import http from 'node:http';

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
  console.log('🧪 Starting Hotel Settings, Mode Engine, Menu Spices & CSV Import Verification...\n');

  // 1. Authenticate as Hotel Owner / Super Admin
  console.log('1. Authenticating as Arthur Pendelton (Hotel Owner / Super Admin)...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@hotel.com', password: 'Admin@2026!' }
  });
  assert.strictEqual(loginRes.status, 200, 'Login must succeed with 200');
  const token = loginRes.data.token;
  console.log('   ✅ Authenticated successfully. Token obtained.');

  // 2. Fetch Hotel Settings
  console.log('2. Fetching hotel settings & credentials...');
  const settingsRes = await request('/hotel/settings', { token });
  assert.strictEqual(settingsRes.status, 200, 'GET /hotel/settings must return 200');
  const settings = settingsRes.data;
  assert.ok(settings.name, 'Hotel must have a name');
  assert.ok(Array.isArray(settings.payment_methods), 'Payment methods must be an array');
  console.log(`   ✅ Hotel: "${settings.name}", Mode: ${settings.system_mode}, Currency: ${settings.currency}`);

  // 3. Update Hotel Settings (Name, M-Pesa keys, Taxes)
  console.log('3. Updating Hotel Details, M-Pesa Daraja and Tax Rates...');
  const updateRes = await request('/hotel/settings', {
    method: 'PUT',
    token,
    body: {
      name: 'Grand Heritage Luxury Resort & Spa',
      legal_name: 'Grand Heritage Hospitality Group Ltd',
      tax_pin: 'P051239842M',
      vat_rate: 16.0,
      catering_levy_rate: 2.0,
      service_charge_rate: 5.0,
      mpesa_shortcode: '600999',
      mpesa_consumer_key: 'test_daraja_key_live_2026',
      mpesa_consumer_secret: 'test_daraja_secret_live_2026',
      mpesa_passkey: 'test_live_passkey_2026',
      mpesa_environment: 'production',
      mpesa_enabled: true,
      payment_methods: ['mpesa', 'cash', 'card', 'room_charge']
    }
  });
  assert.strictEqual(updateRes.status, 200, 'PUT /hotel/settings must succeed');

  // Verify updated settings
  const verifySettings = await request('/hotel/settings', { token });
  assert.strictEqual(verifySettings.data.name, 'Grand Heritage Luxury Resort & Spa', 'Name must be updated');
  assert.strictEqual(verifySettings.data.mpesa_shortcode, '600999', 'Shortcode must be updated');
  assert.strictEqual(verifySettings.data.mpesa_environment, 'production', 'Environment must be production');
  assert.ok(verifySettings.data.mpesa_consumer_secret.includes('••'), 'Secret must be masked in response');
  console.log('   ✅ Hotel settings and M-Pesa credentials persisted and verified.');

  // 4. Test Live vs Demo Mode Switching
  console.log('4. Testing System Mode Switcher (Mode API)...');
  const modeRes = await request('/hotel/mode', {
    method: 'POST',
    token,
    body: { mode: 'live' }
  });
  assert.strictEqual(modeRes.status, 200, 'POST /hotel/mode must succeed');
  assert.strictEqual(modeRes.data.mode, 'live', 'Mode must be live');
  console.log('   ✅ Switched to Live Production mode.');

  // 5. Clear Demo Menu Items for a Clean Live Slate
  console.log('5. Purging Demo items via /hotel/clear-demo...');
  const clearRes = await request('/hotel/clear-demo', {
    method: 'POST',
    token
  });
  assert.strictEqual(clearRes.status, 200, 'POST /hotel/clear-demo must succeed');
  assert.strictEqual(clearRes.data.system_mode, 'live', 'System mode must be set to live');
  console.log(`   ✅ Demo items purged. Remaining live items count: ${clearRes.data.remaining_items_count}`);

  // 6. Verify GET /menu respects Live Mode
  console.log('6. Verifying GET /menu returns clean live items...');
  const menuLiveRes = await request('/menu?mode=live');
  assert.strictEqual(menuLiveRes.status, 200, 'GET /menu must succeed');
  const liveItemsCount = menuLiveRes.data.categories.reduce((acc, c) => acc + (c.items?.length || 0), 0);
  console.log(`   ✅ Live menu returned cleanly with ${liveItemsCount} active dishes.`);

  // 7. Add Custom Dish with Spices and Image URL
  console.log('7. Creating genuine live dish with custom spices and photo...');
  const categoryId = menuLiveRes.data.categories[0]?.id || 'cat-mains';
  const newDishRes = await request('/menu/items', {
    method: 'POST',
    token,
    body: {
      category_id: categoryId,
      name: 'Swahili Coconut Snapper Fillet',
      description: 'Pan-seared fresh Indian Ocean red snapper with fresh coconut cream velouté and wild lemon.',
      price: 2450.0,
      cost_price: 750.0,
      estimated_prep_time: 18,
      image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
      spices: ['Medium Swahili Coconut', 'Garlic Herb', 'Mild Chili']
    }
  });
  assert.strictEqual(newDishRes.status, 201, 'POST /menu/items must return 201 Created');
  assert.strictEqual(newDishRes.data.name, 'Swahili Coconut Snapper Fillet');
  assert.deepStrictEqual(newDishRes.data.spices, ['Medium Swahili Coconut', 'Garlic Herb', 'Mild Chili']);
  const createdItemId = newDishRes.data.id;
  console.log(`   ✅ Live dish created: ${newDishRes.data.name} (KES ${newDishRes.data.price}) with spices [${newDishRes.data.spices.join(', ')}]`);

  // 8. Bulk CSV Menu Import with Spices
  console.log('8. Uploading bulk menu items via /menu/bulk-csv...');
  const csvPayload = {
    items: [
      {
        name: 'Slow Smoked BBQ Beef Short Ribs',
        category: 'Prime Grill & Steaks',
        price: '3400',
        description: 'Smoked for 12 hours over hickory wood with house glaze.',
        prep_time: '20',
        station: 'Grill',
        is_special: 'true',
        spices: 'Smoked Barbecue, Extra Spicy'
      },
      {
        name: 'Truffle Mushroom Risotto',
        category: 'Artisan Mains & Pasta',
        price: '2100',
        description: 'Carnaroli rice with porcini and white truffle oil.',
        prep_time: '15',
        station: 'Main Kitchen',
        is_special: 'false',
        spices: 'Garlic Herb'
      }
    ]
  };
  const csvRes = await request('/menu/bulk-csv', {
    method: 'POST',
    token,
    body: csvPayload
  });
  assert.strictEqual(csvRes.status, 200, 'POST /menu/bulk-csv must succeed');
  assert.strictEqual(csvRes.data.importedCount, 2, '2 dishes should be imported');
  console.log(`   ✅ CSV Bulk Import succeeded: ${csvRes.data.importedCount} dishes created.`);

  // 9. Load Demo Dishes for Showcase preview
  console.log('9. Testing /hotel/load-demo to restore showcase dishes...');
  const loadDemoRes = await request('/hotel/load-demo', {
    method: 'POST',
    token
  });
  assert.strictEqual(loadDemoRes.status, 200, 'POST /hotel/load-demo must return 200');
  assert.strictEqual(loadDemoRes.data.system_mode, 'demo', 'Mode must switch to demo');
  assert.ok(loadDemoRes.data.seeded_count >= 5, 'Must seed showcase dishes');
  console.log(`   ✅ Loaded ${loadDemoRes.data.seeded_count} demo showcase dishes.`);

  // 10. Clean up test dish
  console.log('10. Cleaning up test items...');
  const delRes = await request(`/menu/items/${createdItemId}`, {
    method: 'DELETE',
    token
  });
  assert.strictEqual(delRes.status, 200, 'DELETE /menu/items/:id must succeed');
  console.log('   ✅ Test dish cleaned up.');

  console.log('\n🎉 ALL 10 HOTEL SETTINGS, LIVE/DEMO MODE & MENU TESTS PASSED PERFECTLY!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
