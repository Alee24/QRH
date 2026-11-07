import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.API_URL || 'http://localhost:8966';

test('FULL PUBLIC ORDERING, DELIVERY GPS, CATERING & DEDUCTIBLE RESERVATIONS SUITE', async (t) => {
  let serverProcess;

  // 1. Table Reservations with Deductible Booking Fee (KES 500)
  await t.test('1. Guest books a table and pays KES 500 deductible deposit', async () => {
    const resPayload = {
      customer_name: 'Grace Wanjiku',
      customer_phone: '0712345678',
      customer_email: 'grace@example.com',
      guest_count: 2,
      reservation_date: '2026-11-15',
      reservation_time: '19:30',
      dining_location: 'Sironi Rooftop & Sky Lounge (Westlands)',
      special_requests: 'Anniversary celebration. Window skyline seating.',
      booking_fee: 500,
    };

    const res = await fetch(`${BASE_URL}/api/tables/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resPayload),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.voucher.booking_code.startsWith('SIRONI-RES-'));
    assert.equal(data.voucher.deposit_paid, 500);
    assert.equal(data.voucher.deductible_amount, 500);
    console.log(`✓ Table reservation confirmed: ${data.voucher.booking_code} (Deposit: KES ${data.voucher.deposit_paid} credited)`);
  });

  // 2. Public Catering Services Inquiry
  await t.test('2. Public user submits catering inquiry for corporate event', async () => {
    const cateringPayload = {
      customer_name: 'Ambassador David Mwangi',
      organization: 'East African Trade Mission',
      customer_phone: '0722111222',
      customer_email: 'events@eatrade.org',
      event_name: 'Diplomatic Gala & Trade Dinner',
      event_type: 'corporate',
      event_date: '2026-12-05',
      event_time: '18:00',
      venue: 'Sironi Rooftop Executive Suites (Westlands)',
      guest_count: 75,
      budget: 210000,
      package_id: 'Executive Corporate Banquet',
      special_instructions: 'Include on-site carvery chef, sommelier bar, and custom branded menus.',
    };

    const res = await fetch(`${BASE_URL}/api/catering/public/enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cateringPayload),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.enquiry_number.startsWith('SIRONI-CAT-'));
    console.log(`✓ Catering inquiry created: ${data.enquiry_number} for ${cateringPayload.guest_count} guests`);
  });

  // 3. Online Delivery Order with GPS Pinpoint & House Number
  await t.test('3. Guest places online delivery order with GPS coordinates and house number', async () => {
    // Get a menu item ID
    const menuRes = await fetch(`${BASE_URL}/api/menu`);
    const menuData = await menuRes.json();
    const ribeye = menuData.categories.flatMap((c) => c.items).find((i) => i.name.includes('Ribeye'));
    assert.ok(ribeye, 'Ribeye dish must exist');

    const deliveryPayload = {
      source: 'delivery',
      customerName: 'Amina Hassan',
      customerPhone: '254712345678',
      delivery: {
        recipient_name: 'Amina Hassan',
        recipient_phone: '254712345678',
        estate: 'Kilimani',
        street: 'Argwings Kodhek Road',
        building_name: 'Valley Ridge Apartments',
        house_number: 'Apartment 4B, 3rd Floor',
        latitude: '-1.2921',
        longitude: '36.7852',
        delivery_notes: 'Ring gate bell, call upon arrival',
        delivery_fee: 250,
      },
      items: [
        {
          menuItemId: ribeye.id,
          portionName: '350g Regular Cut',
          portionPrice: 3600,
          quantity: 2,
          modifiers: [{ name: 'Medium Rare', price: 0 }],
        },
      ],
      idempotencyKey: `test_del_${Date.now()}`,
    };

    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deliveryPayload),
    });

    assert.equal(orderRes.status, 201);
    const orderData = await orderRes.json();
    assert.ok(orderData.id, 'Delivery order must have order ID');
    assert.equal(orderData.source, 'delivery');
    assert.equal(orderData.total_amount, 7200); // 3600 * 2 = 7200
    console.log(`✓ Delivery order #${orderData.order_number} created with GPS (-1.2921, 36.7852) and House Apt 4B`);
  });
});
