import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.API_URL || 'http://localhost:8966';

test('SAAS MARKETING & SUBSCRIBER HOTEL SHOWCASE SUITE', async (t) => {
  await t.test('1. GET /api/showcase/hotels returns active subscriber hotels directory with subdomains', async () => {
    const res = await fetch(`${BASE_URL}/api/showcase/hotels`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data), 'Expected array of subscriber hotels');
    assert.ok(data.length >= 2, 'Expected at least 2 active hotels');

    const grandHeritage = data.find((h) => h.slug === 'grand-heritage');
    assert.ok(grandHeritage, 'Grand Heritage subscriber must exist');
    assert.equal(grandHeritage.subdomain, 'grand-heritage.plateiq.cloud');
    assert.ok(grandHeritage.hero_image, 'Hero image should be configured');

    const serenaSafari = data.find((h) => h.slug === 'serena-safari');
    assert.ok(serenaSafari, 'Serena Safari subscriber must exist');
    assert.equal(serenaSafari.subdomain, 'serena-safari.plateiq.cloud');
  });

  await t.test('2. GET /api/showcase/hotel/grand-heritage returns luxury ambiance and Day\'s Scheduled Menu', async () => {
    const res = await fetch(`${BASE_URL}/api/showcase/hotel/grand-heritage`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.hotel, 'Hotel details must be returned');
    assert.equal(data.hotel.slug, 'grand-heritage');
    assert.ok(data.hotel.current_meal_schedule, 'Current meal schedule must be calculated');
    assert.ok(data.hotel.sample_table, 'Sample table with qr_token must be returned for quick ordering');
    assert.ok(data.hotel.sample_table.qr_token, 'QR token must be non-empty');

    // Menu verification
    assert.ok(Array.isArray(data.categories), 'Categories array expected');
    assert.ok(data.categories.length > 0, 'Categories should have items');
    assert.ok(Array.isArray(data.today_specials), 'Today specials array expected');
    assert.ok(Array.isArray(data.outlets), 'Outlets array expected');
    assert.ok(data.outlets.length > 0, 'Outlets should be present');
  });

  await t.test('3. GET /api/showcase/hotel/serena-safari returns bush luxury ambiance and Savanna menu', async () => {
    const res = await fetch(`${BASE_URL}/api/showcase/hotel/serena-safari`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.hotel.slug, 'serena-safari');
    assert.ok(data.hotel.tagline.includes('Savanna') || data.hotel.tagline.includes('Luxury'));
    assert.ok(data.hotel.amenities.length > 0, 'Savanna amenities should be populated');
  });

  await t.test('4. GET /api/showcase/hotel/invalid-slug returns 404 with informative message', async () => {
    const res = await fetch(`${BASE_URL}/api/showcase/hotel/non-existent-hotel-xyz`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.ok(data.error, 'Error message should be returned');
  });
});
