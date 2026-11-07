import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute, runInTransaction } from '../db/index.js';
import { authenticate, authorize, logAudit } from '../middleware/auth.js';

export const cateringRouter = Router();

// ==============================================================================
// PUBLIC CATERING ENDPOINTS (Accessible to website visitors without staff JWT)
// ==============================================================================
cateringRouter.get('/public/packages', (req, res) => {
  const packages = queryAll(`
    SELECT * FROM catering_packages 
    WHERE is_active = 1 
    ORDER BY price_per_person ASC
  `);
  res.json(packages);
});

cateringRouter.post('/public/enquiry', (req, res) => {
  const tenantId = (req.query.tenant_id as string) || (req.headers['x-tenant-id'] as string) || 'tenant-grand-heritage';
  const {
    customer_name, customer_email, customer_phone, organization,
    event_name, event_type, event_date, event_time, event_duration_hours,
    venue, guest_count, budget, service_style, dietary_requirements,
    special_instructions, package_id
  } = req.body;

  if (!customer_name || !customer_phone || !event_date || !guest_count) {
    return res.status(400).json({ error: 'Customer name, phone number, event date, and guest count are required.' });
  }

  const enquiryId = `enq-${Date.now()}`;
  const enquirySeq = Math.floor(100 + Math.random() * 900);
  const enquiryNumber = `SIRONI-CAT-${new Date().toISOString().slice(0, 7).replace('-', '')}-${enquirySeq}`;
  const effectiveEventName = event_name || `${customer_name} ${event_type || 'Private'} Catering`;

  const specialNotes = [
    event_time ? `Serving Time: ${event_time}` : '',
    package_id ? `Package: ${package_id}` : '',
    special_instructions || ''
  ].filter(Boolean).join(' • ');

  execute(`
    INSERT INTO catering_enquiries (
      id, tenant_id, enquiry_number, customer_name, customer_email, customer_phone,
      organization, event_name, event_type, event_date, event_duration_hours,
      venue, guest_count, budget, service_style, dietary_requirements,
      special_instructions, status, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `, [
    enquiryId, tenantId, enquiryNumber, customer_name, customer_email || null, customer_phone,
    organization || null, effectiveEventName, event_type || 'corporate', event_date,
    event_duration_hours || 5.0, venue || 'Sironi Hotel Nairobi & Client Venues', parseInt(guest_count, 10),
    budget ? parseFloat(budget) : null, service_style || 'buffet',
    dietary_requirements || null, specialNotes
  ]);

  const enquiry = queryOne('SELECT * FROM catering_enquiries WHERE id = ?', [enquiryId]);
  res.status(201).json({
    success: true,
    enquiry_number: enquiryNumber,
    enquiry,
    message: `Your catering request ${enquiryNumber} for ${guest_count} guests has been confirmed. Our Executive Chef & Events Team will reach out within 2 hours.`
  });
});

// Authenticated staff endpoints below
cateringRouter.use(authenticate);

// 1. GET /api/catering/dashboard: Executive Catering Pipeline Telemetry
cateringRouter.get('/dashboard', (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';

  const enquiriesCount = queryOne(`
    SELECT
      COUNT(*) as total_enquiries,
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_enquiries,
      SUM(CASE WHEN status = 'quoted' THEN 1 ELSE 0 END) as quoted_enquiries,
      SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END) as booked_enquiries
    FROM catering_enquiries
    WHERE (tenant_id = ? OR tenant_id IS NULL)
  `, [tenantId]);

  const bookingsStats = queryOne(`
    SELECT
      COUNT(*) as confirmed_bookings,
      COALESCE(SUM(total_amount), 0) as total_booked_value,
      COALESCE(SUM(deposit_amount), 0) as total_deposits_collected,
      COALESCE(SUM(balance_due), 0) as outstanding_balances,
      COALESCE(SUM(guest_count), 0) as total_guests_catered
    FROM catering_bookings
    WHERE (tenant_id = ? OR tenant_id IS NULL)
  `, [tenantId]);

  const upcomingEvents = queryAll(`
    SELECT b.*, e.completion_notes, e.actual_expenditure, e.profitability
    FROM catering_bookings b
    LEFT JOIN catering_events e ON e.booking_id = b.id
    WHERE (b.tenant_id = ? OR b.tenant_id IS NULL) AND b.event_status != 'cancelled'
    ORDER BY b.event_date ASC LIMIT 5
  `, [tenantId]);

  res.json({
    enquiries: enquiriesCount,
    bookings: bookingsStats,
    upcoming_events: upcomingEvents,
  });
});

// 2. GET & POST /api/catering/enquiries: Enquiries Pipeline
cateringRouter.get('/enquiries', (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';
  const { status, event_type } = req.query;

  let sql = `
    SELECT ce.*, u.name as assigned_staff_name
    FROM catering_enquiries ce
    LEFT JOIN users u ON ce.assigned_to = u.id
    WHERE (ce.tenant_id = ? OR ce.tenant_id IS NULL)
  `;
  const params: any[] = [tenantId];

  if (status && status !== 'all') {
    sql += ' AND ce.status = ?';
    params.push(status);
  }

  if (event_type && event_type !== 'all') {
    sql += ' AND ce.event_type = ?';
    params.push(event_type);
  }

  sql += ' ORDER BY ce.created_at DESC';

  const enquiries = queryAll(sql, params);
  res.json(enquiries);
});

cateringRouter.post('/enquiries', (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';
  const {
    customer_name, customer_email, customer_phone, organization,
    event_name, event_type, event_date, event_duration_hours,
    venue, guest_count, budget, service_style, dietary_requirements,
    special_instructions
  } = req.body;

  if (!customer_name || !customer_phone || !event_name || !event_date || !guest_count) {
    return res.status(400).json({ error: 'Customer name, phone, event name, date and guest count are required.' });
  }

  const enquiryId = `enq-${Date.now()}`;
  const enquirySeq = Math.floor(100 + Math.random() * 900);
  const enquiryNumber = `ENQ-${new Date().toISOString().slice(0, 7).replace('-', '')}-${enquirySeq}`;

  execute(`
    INSERT INTO catering_enquiries (
      id, tenant_id, enquiry_number, customer_name, customer_email, customer_phone,
      organization, event_name, event_type, event_date, event_duration_hours,
      venue, guest_count, budget, service_style, dietary_requirements,
      special_instructions, status, assigned_to
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)
  `, [
    enquiryId, tenantId, enquiryNumber, customer_name, customer_email || null, customer_phone,
    organization || null, event_name, event_type || 'corporate', event_date,
    event_duration_hours || 5.0, venue || 'TBD', parseInt(guest_count, 10),
    budget ? parseFloat(budget) : null, service_style || 'buffet',
    dietary_requirements || null, special_instructions || null, req.user!.id
  ]);

  logAudit(req.user!.id, 'CREATE_CATERING_ENQUIRY', 'CATERING_ENQUIRY', enquiryId, { event_name, guest_count });

  const enquiry = queryOne('SELECT * FROM catering_enquiries WHERE id = ?', [enquiryId]);
  res.status(201).json({
    success: true,
    enquiry,
  });
});

// 3. GET /api/catering/packages: Reusable Packages Catalog
cateringRouter.get('/packages', (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';
  const packages = queryAll(`
    SELECT * FROM catering_packages 
    WHERE (tenant_id = ? OR tenant_id IS NULL) AND is_active = 1
    ORDER BY price_per_person ASC
  `, [tenantId]);

  const parsed = packages.map((p) => {
    try {
      p.included_items = JSON.parse(p.included_items_json || '[]');
    } catch {
      p.included_items = [];
    }
    return p;
  });

  res.json({
    packages: parsed,
  });
});

// 4. POST /api/catering/quotations/calculate: Quotation Engine
cateringRouter.post('/quotations/calculate', authorize(['super_admin', 'hotel_admin', 'restaurant_manager', 'catering_manager', 'catering_sales_officer']), (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';
  const {
    enquiry_id, package_id, per_person_rate, rate_per_person, guest_count,
    labor_cost, equipment_cost, transport_cost, setup_breakdown_cost,
    discount_amount, notes, validity_days
  } = req.body;

  if (!enquiry_id) {
    return res.status(400).json({ error: 'enquiry_id is required.' });
  }

  const enquiry = queryOne('SELECT * FROM catering_enquiries WHERE id = ?', [enquiry_id]);
  if (!enquiry) return res.status(404).json({ error: 'Catering enquiry not found.' });

  const guests = parseInt(guest_count || enquiry.guest_count, 10);
  const rate = parseFloat(per_person_rate || rate_per_person || 3500.0);
  const foodCost = rate * guests;
  const labor = parseFloat(labor_cost !== undefined ? labor_cost : 35000.0);
  const equipment = parseFloat(equipment_cost !== undefined ? equipment_cost : 45000.0);
  const transport = parseFloat(transport_cost !== undefined ? transport_cost : 15000.0);
  const setup = parseFloat(setup_breakdown_cost !== undefined ? setup_breakdown_cost : 0.0);
  const discount = parseFloat(discount_amount || 0.0);

  const subtotal = foodCost + labor + equipment + transport + setup - discount;
  const vat = subtotal * 0.16; // 16% VAT
  const cateringLevy = subtotal * 0.02; // 2% Tourism Levy
  const totalAmount = Math.round(subtotal + vat + cateringLevy);
  const depositRequired = Math.round(totalAmount * 0.50); // 50% deposit

  const quotationId = `qt-${Date.now()}`;
  const seq = Math.floor(1000 + Math.random() * 9000);
  const quotationNumber = `QT-${new Date().toISOString().slice(0, 7).replace('-', '')}-${seq}`;

  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + (parseInt(validity_days, 10) || 14));

  execute(`
    INSERT INTO catering_quotations (
      id, tenant_id, quotation_number, enquiry_id, package_id,
      per_person_rate, guest_count, food_cost, labor_cost, equipment_cost,
      transport_cost, setup_breakdown_cost, subtotal, tax_amount,
      discount_amount, service_charge, total_amount, deposit_required,
      status, validity_date, notes, created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, ?, ?, 'draft', ?, ?, ?)
  `, [
    quotationId, tenantId, quotationNumber, enquiry_id, package_id || null,
    rate, guests, foodCost, labor, equipment,
    transport, setup, subtotal, vat + cateringLevy,
    discount, totalAmount, depositRequired,
    validityDate.toISOString().slice(0, 10), notes || 'Includes 50% confirmation deposit', req.user!.id
  ]);

  execute("UPDATE catering_enquiries SET status = 'quoted' WHERE id = ?", [enquiry_id]);

  logAudit(req.user!.id, 'GENERATE_CATERING_QUOTATION', 'QUOTATION', quotationId, { quotationNumber, totalAmount, guests });

  const quotation = queryOne('SELECT * FROM catering_quotations WHERE id = ?', [quotationId]);
  res.status(201).json({
    success: true,
    quotation: {
      ...quotation,
      food_amount: foodCost,
      subtotal,
      vat_amount: vat,
      catering_levy: cateringLevy,
      total_amount: totalAmount,
      deposit_required: depositRequired,
    },
  });
});

// 5. POST /api/catering/quotations/:id/accept: Confirm Booking & Create Event Production
cateringRouter.post('/quotations/:id/accept', authorize(['super_admin', 'hotel_admin', 'restaurant_manager', 'catering_manager', 'catering_sales_officer']), (req, res) => {
  const { id } = req.params;
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';

  const quotation = queryOne('SELECT * FROM catering_quotations WHERE id = ?', [id]);
  if (!quotation) return res.status(404).json({ error: 'Quotation not found.' });

  const enquiry = queryOne('SELECT * FROM catering_enquiries WHERE id = ?', [quotation.enquiry_id]);
  if (!enquiry) return res.status(404).json({ error: 'Associated enquiry not found.' });

  const bookingId = `bkg-${Date.now()}`;
  const bookingSeq = Math.floor(100 + Math.random() * 900);
  const bookingNumber = `BKG-${new Date().toISOString().slice(0, 7).replace('-', '')}-${bookingSeq}`;

  runInTransaction(() => {
    execute("UPDATE catering_quotations SET status = 'accepted' WHERE id = ?", [id]);
    execute("UPDATE catering_enquiries SET status = 'booked' WHERE id = ?", [quotation.enquiry_id]);

    execute(`
      INSERT INTO catering_bookings (
        id, tenant_id, booking_number, quotation_id, enquiry_id,
        event_name, event_date, venue, guest_count, total_amount,
        deposit_amount, deposit_paid, balance_due, payment_status, event_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'deposit_pending', 'confirmed')
    `, [
      bookingId, tenantId, bookingNumber, id, quotation.enquiry_id,
      enquiry.event_name, enquiry.event_date, enquiry.venue, quotation.guest_count,
      quotation.total_amount, quotation.deposit_required, quotation.total_amount
    ]);

    // Create Event Workspace & Production Sheet
    const eventId = `ev-${Date.now()}`;
    const sampleSchedule = [
      { time: '08:00', task: 'Kitchen prep and hot box thermal loading' },
      { time: '11:00', task: 'Fleet departure to venue & equipment setup' },
      { time: '13:00', task: 'Buffet live stations open' },
      { time: '16:00', task: 'Breakdown and return logistics' },
    ];

    execute(`
      INSERT INTO catering_events (
        id, tenant_id, booking_id, event_coordinator_id, head_chef_id,
        schedule_json, kitchen_production_json, logistics_notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      eventId, tenantId, bookingId, req.user!.id, 'usr-chef',
      JSON.stringify(sampleSchedule),
      JSON.stringify([{ item: `${enquiry.event_name} Carvery & Buffet`, portions: quotation.guest_count }]),
      `Venue Access: ${enquiry.venue}. Loading dock pass required.`
    ]);
  });

  logAudit(req.user!.id, 'ACCEPT_CATERING_QUOTATION', 'BOOKING', bookingId, { bookingNumber, total_amount: quotation.total_amount });

  res.json({
    success: true,
    message: `Quotation accepted! Confirmed Event Booking #${bookingNumber} created.`,
    booking: queryOne('SELECT * FROM catering_bookings WHERE id = ?', [bookingId]),
  });
});

// 6. POST /api/catering/bookings/:id/pay-deposit: Record Deposit (M-Pesa or Cash)
cateringRouter.post('/bookings/:id/pay-deposit', (req, res) => {
  const { id } = req.params;
  const { payment_method, mpesa_code } = req.body;

  const booking = queryOne('SELECT * FROM catering_bookings WHERE id = ?', [id]);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });

  const balance = booking.total_amount - booking.deposit_amount;

  execute(`
    UPDATE catering_bookings
    SET 
      deposit_paid = 1,
      deposit_paid_at = CURRENT_TIMESTAMP,
      balance_due = ?,
      payment_status = 'deposit_paid'
    WHERE id = ?
  `, [balance, id]);

  logAudit(req.user!.id, 'PAY_CATERING_DEPOSIT', 'BOOKING', id, {
    deposit_amount: booking.deposit_amount,
    payment_method: payment_method || 'mpesa_stk',
    mpesa_code: mpesa_code || `MPESA-${Date.now()}`
  });

  const updatedBooking = queryOne('SELECT * FROM catering_bookings WHERE id = ?', [id]);

  res.json({
    success: true,
    message: `Deposit of KES ${booking.deposit_amount.toLocaleString()} confirmed. Balance remaining: KES ${balance.toLocaleString()}`,
    booking: {
      ...updatedBooking,
      deposit_paid: updatedBooking.deposit_amount,
    },
  });
});

// 7. POST /api/catering/bookings/:id/reconcile-balance: Settle Final Balance
cateringRouter.post('/bookings/:id/reconcile-balance', (req, res) => {
  const { id } = req.params;

  const booking = queryOne('SELECT * FROM catering_bookings WHERE id = ?', [id]);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });

  execute(`
    UPDATE catering_bookings
    SET 
      balance_paid = 1,
      balance_paid_at = CURRENT_TIMESTAMP,
      balance_due = 0.0,
      payment_status = 'fully_settled'
    WHERE id = ?
  `, [id]);

  logAudit(req.user!.id, 'SETTLE_CATERING_BALANCE', 'BOOKING', id, { total_amount: booking.total_amount });

  res.json({
    success: true,
    message: 'Event balance settled in full. Booking is marked fully paid.',
    booking: queryOne('SELECT * FROM catering_bookings WHERE id = ?', [id]),
  });
});

// 8. GET /api/catering/bookings: Bookings Directory
cateringRouter.get('/bookings', (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';
  const bookings = queryAll(`
    SELECT b.*, ce.customer_name, ce.customer_phone, ce.organization
    FROM catering_bookings b
    JOIN catering_enquiries ce ON b.enquiry_id = ce.id
    WHERE (b.tenant_id = ? OR b.tenant_id IS NULL)
    ORDER BY b.event_date ASC
  `, [tenantId]);
  res.json(bookings);
});

// 9. GET /api/catering/equipment: Equipment Inventory
cateringRouter.get('/equipment', (req, res) => {
  const tenantId = req.user!.tenant_id || req.tenantId || 'tenant-grand-heritage';
  const equipment = queryAll(`
    SELECT * FROM catering_equipment 
    WHERE (tenant_id = ? OR tenant_id IS NULL) AND is_active = 1
    ORDER BY category ASC, name ASC
  `, [tenantId]);
  res.json({
    equipment: equipment.map(e => ({
      ...e,
      item_name: e.name,
      quantity_in_stock: e.available_quantity,
    })),
  });
});
