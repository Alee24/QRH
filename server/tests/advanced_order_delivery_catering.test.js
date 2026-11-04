import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.API_URL || 'http://localhost:8966';

test('CENTRAL ORDER, DELIVERY MANAGEMENT & CATERING SERVICES SUITE', async (t) => {
  let adminToken = '';
  let orderManagerToken = '';
  let dispatchToken = '';
  let driverToken = '';
  let cateringToken = '';

  let createdTableOrderId = '';
  let createdTakeawayOrderId = '';
  let createdDeliveryOrderId = '';
  let assignedDriverId = '';
  let createdEnquiryId = '';
  let createdQuotationId = '';
  let createdBookingId = '';

  // 1. AUTHENTICATION OF SPECIALIZED ROLES
  await t.test('1. Authenticate All Specialized SaaS Roles', async () => {
    // Hotel Owner / Admin
    const resAdmin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@hotel.com', password: 'Admin@2026!' }),
    });
    assert.equal(resAdmin.status, 200);
    const dataAdmin = await resAdmin.json();
    adminToken = dataAdmin.token;
    assert.ok(adminToken);

    // Order Manager
    const resOM = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ordermanager@hotel.com', password: 'Admin@2026!' }),
    });
    assert.equal(resOM.status, 200);
    const dataOM = await resOM.json();
    orderManagerToken = dataOM.token;
    assert.ok(orderManagerToken);

    // Dispatch Manager
    const resDisp = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dispatch@hotel.com', password: 'Admin@2026!' }),
    });
    assert.equal(resDisp.status, 200);
    const dataDisp = await resDisp.json();
    dispatchToken = dataDisp.token;
    assert.ok(dispatchToken);

    // Delivery Driver
    const resDrv = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@hotel.com', password: 'Admin@2026!' }),
    });
    assert.equal(resDrv.status, 200);
    const dataDrv = await resDrv.json();
    driverToken = dataDrv.token;
    assert.ok(driverToken);

    // Catering Director
    const resCat = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'catering@hotel.com', password: 'Admin@2026!' }),
    });
    assert.equal(resCat.status, 200);
    const dataCat = await resCat.json();
    cateringToken = dataCat.token;
    assert.ok(cateringToken);
  });

  // 2. CENTRAL ORDER MANAGEMENT TESTS
  await t.test('2. Central Order Summary Telemetry', async () => {
    const res = await fetch(`${BASE_URL}/api/central-orders/summary`, {
      headers: { Authorization: `Bearer ${orderManagerToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.metrics, 'Metrics object must be returned');
    assert.ok(typeof data.metrics.total_orders === 'number');
    assert.ok(typeof data.metrics.total_revenue === 'number');
  });

  await t.test('3. Create Table QR Order via Central Orders API', async () => {
    const res = await fetch(`${BASE_URL}/api/central-orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        source: 'table_qr',
        fulfillment_type: 'dine_in',
        table_number: 4,
        customer_name: 'David Kariuki',
        customer_phone: '+254711223344',
        special_instructions: 'Less salt on the beef',
        items: [
          {
            menu_item_name: 'Grilled Herb T-Bone Steak',
            quantity: 2,
            unit_price: 2600,
            station: 'Grill',
          },
        ],
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.order.id);
    createdTableOrderId = data.order.id;
    assert.equal(data.order.source, 'table_qr');
    assert.equal(data.order.fulfillment_type, 'dine_in');
  });

  await t.test('4. Create Takeaway Order with Packaging Fee and Customer Name', async () => {
    const res = await fetch(`${BASE_URL}/api/central-orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orderManagerToken}`,
      },
      body: JSON.stringify({
        source: 'takeaway',
        fulfillment_type: 'takeaway',
        customer_name: 'Alice Muthoni',
        customer_phone: '+254722554433',
        special_instructions: 'Pack extra serviettes and cutlery',
        packaging_fee: 150,
        items: [
          {
            menu_item_name: 'Swahili Coconut Fish Curry',
            quantity: 1,
            unit_price: 1850,
            station: 'Main Kitchen',
          },
        ],
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.order.id);
    createdTakeawayOrderId = data.order.id;
    assert.equal(data.order.source, 'takeaway');
    assert.equal(data.order.customer_name, 'Alice Muthoni');
    assert.equal(data.order.packaging_fee, 150);
  });

  await t.test('5. Create Online Delivery Order with Address and Contact', async () => {
    const res = await fetch(`${BASE_URL}/api/central-orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orderManagerToken}`,
      },
      body: JSON.stringify({
        source: 'delivery',
        fulfillment_type: 'delivery',
        customer_name: 'Prof. Peter Anyang',
        customer_phone: '+254733998877',
        delivery_address: 'Kilimani, Argwings Kodhek Rd, Apt 4B',
        delivery_notes: 'Ring bell at Gate 2',
        delivery_fee: 300,
        items: [
          {
            menu_item_name: 'Slow Smoked Prime Rib',
            quantity: 1,
            unit_price: 2400,
            station: 'Grill',
          },
          {
            menu_item_name: 'Kilifi Passion Mojito',
            quantity: 2,
            unit_price: 650,
            station: 'Bar',
          },
        ],
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.order.id);
    createdDeliveryOrderId = data.order.id;
    assert.equal(data.order.source, 'delivery');
    assert.equal(data.order.delivery_fee, 300);
    assert.equal(data.order.delivery_address, 'Kilimani, Argwings Kodhek Rd, Apt 4B');
  });

  await t.test('6. Filter Central Orders by Source and Status', async () => {
    const resTakeaway = await fetch(`${BASE_URL}/api/central-orders?source=takeaway`, {
      headers: { Authorization: `Bearer ${orderManagerToken}` },
    });
    assert.equal(resTakeaway.status, 200);
    const dataTakeaway = await resTakeaway.json();
    const ordersTakeaway = Array.isArray(dataTakeaway) ? dataTakeaway : dataTakeaway.orders;
    assert.ok(Array.isArray(ordersTakeaway));
    assert.ok(ordersTakeaway.some((o) => o.id === createdTakeawayOrderId));

    const resDelivery = await fetch(`${BASE_URL}/api/central-orders?source=delivery`, {
      headers: { Authorization: `Bearer ${orderManagerToken}` },
    });
    assert.equal(resDelivery.status, 200);
    const dataDelivery = await resDelivery.json();
    const ordersDelivery = Array.isArray(dataDelivery) ? dataDelivery : dataDelivery.orders;
    assert.ok(Array.isArray(ordersDelivery));
    assert.ok(ordersDelivery.some((o) => o.id === createdDeliveryOrderId));
  });

  await t.test('7. Advance Order Lifecycle (new -> confirmed -> preparing -> ready -> dispatched -> delivered)', async () => {
    const transitions = [
      { status: 'confirmed', note: 'Kitchen accepted order' },
      { status: 'preparing', note: 'Cooking on grill station' },
      { status: 'ready', note: 'Plated and ready for runner' },
      { status: 'dispatched', note: 'Handed to courier' },
      { status: 'delivered', note: 'Customer received meal' },
    ];

    for (const step of transitions) {
      const res = await fetch(`${BASE_URL}/api/central-orders/${createdTakeawayOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${orderManagerToken}`,
        },
        body: JSON.stringify({ status: step.status, notes: step.note }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.order.status, step.status);
    }
  });

  await t.test('8. Reject Order with Reason', async () => {
    const res = await fetch(`${BASE_URL}/api/central-orders/${createdTableOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orderManagerToken}`,
      },
      body: JSON.stringify({ status: 'rejected', rejection_reason: 'Guest requested cancellation' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.order.status, 'rejected');
    assert.equal(data.order.rejection_reason, 'Guest requested cancellation');
  });

  // 3. DELIVERY MANAGEMENT & DISPATCH
  await t.test('9. Query Delivery Zones and Calculate Pricing', async () => {
    const res = await fetch(`${BASE_URL}/api/delivery/zones`, {
      headers: { Authorization: `Bearer ${dispatchToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    const zones = Array.isArray(data) ? data : data.zones;
    assert.ok(Array.isArray(zones));
    assert.ok(zones.length >= 2, 'Should have seeded delivery zones');
    const kilimaniZone = zones.find((z) => (z.name || z.zone_name)?.includes('Kilimani'));
    assert.ok(kilimaniZone, 'Kilimani zone must exist');
    assert.ok((kilimaniZone.base_fee || kilimaniZone.delivery_fee) >= 150);
  });

  await t.test('10. Query Drivers Fleet and Assign Driver to Order', async () => {
    const resDrivers = await fetch(`${BASE_URL}/api/delivery/drivers`, {
      headers: { Authorization: `Bearer ${dispatchToken}` },
    });
    assert.equal(resDrivers.status, 200);
    const dataDrivers = await resDrivers.json();
    const drivers = Array.isArray(dataDrivers) ? dataDrivers : dataDrivers.drivers;
    assert.ok(Array.isArray(drivers));
    assert.ok(drivers.length > 0);
    assignedDriverId = drivers[0].id;

    // Assign driver to created delivery order
    const resAssign = await fetch(`${BASE_URL}/api/delivery/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dispatchToken}`,
      },
      body: JSON.stringify({
        order_id: createdDeliveryOrderId,
        driver_id: assignedDriverId,
        distance_km: 4.8,
        delivery_fee: 300,
        estimated_delivery_minutes: 25,
      }),
    });
    assert.equal(resAssign.status, 200);
    const dataAssign = await resAssign.json();
    assert.equal(dataAssign.success, true);
    assert.ok(dataAssign.deliveryOrder.id);
  });

  await t.test('11. Driver Portal & Lifecycle (pickup -> complete with POD)', async () => {
    // 1. Pickup
    const resPickup = await fetch(`${BASE_URL}/api/delivery/orders/${createdDeliveryOrderId}/pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
    });
    assert.equal(resPickup.status, 200);
    const dataPickup = await resPickup.json();
    assert.equal(dataPickup.success, true);
    assert.equal(dataPickup.deliveryOrder.delivery_status, 'picked_up');

    // 2. Complete with proof of delivery
    const resComplete = await fetch(`${BASE_URL}/api/delivery/orders/${createdDeliveryOrderId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        recipient_name: 'Prof. Peter Anyang',
        pod_notes: 'Delivered securely to apartment door. Customer inspected hot seals.',
      }),
    });
    assert.equal(resComplete.status, 200);
    const dataComplete = await resComplete.json();
    assert.equal(dataComplete.success, true);
    assert.equal(dataComplete.deliveryOrder.delivery_status, 'delivered');
    assert.equal(dataComplete.deliveryOrder.recipient_name, 'Prof. Peter Anyang');
  });

  // 4. CATERING SERVICES & QUOTATION ENGINE
  await t.test('12. Catering Dashboard & Seeded Packages', async () => {
    const res = await fetch(`${BASE_URL}/api/catering/dashboard`, {
      headers: { Authorization: `Bearer ${cateringToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.enquiries);
    assert.ok(data.bookings);

    const resPackages = await fetch(`${BASE_URL}/api/catering/packages`, {
      headers: { Authorization: `Bearer ${cateringToken}` },
    });
    assert.equal(resPackages.status, 200);
    const dataPackages = await resPackages.json();
    assert.ok(Array.isArray(dataPackages.packages));
    assert.ok(dataPackages.packages.length >= 2);
  });

  await t.test('13. Submit Catering Event Enquiry', async () => {
    const res = await fetch(`${BASE_URL}/api/catering/enquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cateringToken}`,
      },
      body: JSON.stringify({
        customer_name: 'Wanjiku Kamau',
        customer_email: 'wanjiku.kamau@techafricahub.com',
        customer_phone: '+254722889900',
        organization: 'Tech Africa Innovations',
        event_name: 'Annual AI & Hospitality Summit Gala',
        event_type: 'corporate',
        event_date: '2026-12-15',
        event_duration_hours: 6,
        venue: 'Grand Heritage Ballroom A & Terrace',
        guest_count: 150,
        budget: 600000,
        service_style: 'buffet',
        dietary_requirements: 'Halal, Vegetarian, Gluten-Free desserts',
        special_instructions: 'High-speed audio-visual podium required',
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.enquiry.id);
    createdEnquiryId = data.enquiry.id;
    assert.equal(data.enquiry.event_name, 'Annual AI & Hospitality Summit Gala');
    assert.equal(data.enquiry.guest_count, 150);
  });

  await t.test('14. Generate Dynamic Catering Quotation with 50% Deposit & Taxes', async () => {
    const res = await fetch(`${BASE_URL}/api/catering/quotations/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cateringToken}`,
      },
      body: JSON.stringify({
        enquiry_id: createdEnquiryId,
        rate_per_person: 3200,
        guest_count: 150,
        labor_cost: 35000,
        equipment_cost: 45000,
        transport_cost: 15000,
        discount_amount: 10000,
        notes: 'Includes chafing dishes, executive waitstaff, and buffet presentation.',
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.quotation.id);
    createdQuotationId = data.quotation.id;

    // Verify mathematical breakdown:
    // Food = 150 * 3200 = 480,000
    // Total services = 480,000 + 35,000 + 45,000 + 15,000 - 10,000 = 565,000
    // VAT (16%) = 90,400
    // Catering Levy (2%) = 11,300
    // Total = 666,700
    // 50% Deposit = 333,350
    assert.equal(data.quotation.food_amount, 480000);
    assert.equal(data.quotation.subtotal, 565000);
    assert.equal(data.quotation.vat_amount, 90400);
    assert.equal(data.quotation.catering_levy, 11300);
    assert.equal(data.quotation.total_amount, 666700);
    assert.equal(data.quotation.deposit_required, 333350);
  });

  await t.test('15. Accept Quotation & Automatically Generate Event Booking & BEO Workspace', async () => {
    const res = await fetch(`${BASE_URL}/api/catering/quotations/${createdQuotationId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cateringToken}`,
      },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.booking.id);
    createdBookingId = data.booking.id;
    assert.equal(data.booking.event_name, 'Annual AI & Hospitality Summit Gala');
    assert.equal(data.booking.deposit_paid, 0);
    assert.ok(data.booking.payment_status === 'deposit_pending' || data.booking.payment_status === 'pending_deposit');
  });

  await t.test('16. Record 50% Deposit Payment via M-Pesa STK', async () => {
    const res = await fetch(`${BASE_URL}/api/catering/bookings/${createdBookingId}/pay-deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cateringToken}`,
      },
      body: JSON.stringify({
        payment_method: 'mpesa_stk',
        mpesa_code: 'QKH98765432',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.booking.payment_status, 'deposit_paid');
    assert.equal(data.booking.deposit_paid, data.booking.deposit_amount);
  });

  await t.test('17. Reconcile Final Balance Payment for Event', async () => {
    const res = await fetch(`${BASE_URL}/api/catering/bookings/${createdBookingId}/reconcile-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cateringToken}`,
      },
      body: JSON.stringify({
        payment_method: 'bank_transfer',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.booking.payment_status, 'fully_settled');
    assert.equal(data.booking.balance_due, 0);
  });

  await t.test('18. Verify Catering Equipment Inventory Tracking', async () => {
    const res = await fetch(`${BASE_URL}/api/catering/equipment`, {
      headers: { Authorization: `Bearer ${cateringToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.equipment));
    assert.ok(data.equipment.length >= 4);
    const chafers = data.equipment.find((e) => e.item_name.includes('Chafing'));
    assert.ok(chafers);
    assert.ok(chafers.quantity_in_stock > 0);
  });
});
