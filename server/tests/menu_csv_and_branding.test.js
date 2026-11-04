import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.API_URL || 'http://localhost:8966';

test('MENU CSV BULK IMPORT & LOGO FILE UPLOAD SUITE', async (t) => {
  let adminToken = '';

  await t.test('1. Authenticate Hotel Admin', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@hotel.com', password: 'Admin@2026!' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    adminToken = data.token;
    assert.ok(adminToken, 'Admin token must be returned');
  });

  await t.test('2. POST /api/menu/bulk-csv imports dishes and prices from parsed CSV data', async () => {
    const sampleCsvItems = [
      {
        name: 'Kenyan Savanna Pepper Steak',
        category: 'Grills',
        price: 2800,
        description: 'Prime dry aged steak seasoned with crushed peppercorns',
        prep_time: 20,
        station: 'Grill',
        is_special: true,
        dietary_flags: 'Gluten-Free',
      },
      {
        name: 'Nairobi Botanical Berry Gin',
        category: 'Beverages',
        price: 1100,
        description: 'Locally distilled gin with hibiscus and fresh berries',
        prep_time: 5,
        station: 'Bar',
        is_special: false,
        dietary_flags: 'Alcoholic',
      },
    ];

    const res = await fetch(`${BASE_URL}/api/menu/bulk-csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ items: sampleCsvItems }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.importedCount + data.updatedCount >= 2, 'Should report imported or updated items');
  });

  await t.test('3. POST /api/branding/tenant/:tenantId/logo-upload saves base64 file data', async () => {
    const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const res = await fetch(`${BASE_URL}/api/branding/tenant/tenant-grand-heritage/logo-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        logoData: sampleBase64,
        fileName: 'hotel_crest_logo.png',
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.logo_url, sampleBase64);

    // Verify it persists and resolves
    const checkRes = await fetch(`${BASE_URL}/api/branding/tenant/tenant-grand-heritage`);
    assert.equal(checkRes.status, 200);
    const checkData = await checkRes.json();
    assert.equal(checkData.logo_url, sampleBase64);
  });
});
