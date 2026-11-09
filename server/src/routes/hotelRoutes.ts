import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute, runInTransaction } from '../db/index.js';
import { authenticate, authorize, logAudit } from '../middleware/auth.js';

export const hotelRouter = Router();

// ----------------------------------------------------
// 1. HOTEL ROOMS & CHARGES (PMS)
// ----------------------------------------------------

// List Hotel Rooms (for Room Charge dropdown)
hotelRouter.get('/rooms', (req, res) => {
  const rooms = queryAll(`
    SELECT * FROM hotel_rooms 
    ORDER BY floor ASC, room_number ASC
  `);
  res.json(rooms);
});

// Verify Guest Room for charging
hotelRouter.post('/rooms/verify', (req, res) => {
  const { roomNumber, guestName, pin } = req.body;
  const room = queryOne(`
    SELECT * FROM hotel_rooms 
    WHERE room_number = ? AND is_occupied = 1
  `, [roomNumber]);

  if (!room) {
    return res.status(404).json({ error: `Room ${roomNumber} is currently not occupied.` });
  }

  if (!room.billing_authorized) {
    return res.status(403).json({ error: `Room ${roomNumber} does not have restaurant billing privileges authorized.` });
  }

  if (pin && room.verification_pin && room.verification_pin !== pin) {
    return res.status(401).json({ error: 'Invalid room guest PIN.' });
  }

  res.json({
    valid: true,
    room: {
      id: room.id,
      room_number: room.room_number,
      guest_name: room.guest_name,
      check_out_date: room.check_out_date,
    }
  });
});

// Room Charges History
hotelRouter.get('/charges', authenticate, (req, res) => {
  const charges = queryAll(`
    SELECT rc.*, hr.room_number, ts.session_code
    FROM room_charges rc
    JOIN hotel_rooms hr ON rc.room_id = hr.id
    JOIN table_sessions ts ON rc.table_session_id = ts.id
    ORDER BY rc.created_at DESC
  `);
  res.json(charges);
});

// ----------------------------------------------------
// 2. HOTEL SETTINGS & CREDENTIALS (SUPER ADMIN / OWNER)
// ----------------------------------------------------

// GET Hotel Settings & Credentials
hotelRouter.get('/settings', authenticate, (req: any, res) => {
  const tenantId = req.tenantId || req.user?.tenant_id || 'tenant-grand-heritage';

  let hotel = queryOne(`
    SELECT * FROM hotels 
    WHERE tenant_id = ? 
    LIMIT 1
  `, [tenantId]);

  if (!hotel) {
    // Check if there is any hotel or fallback
    hotel = queryOne(`SELECT * FROM hotels LIMIT 1`);
  }

  if (!hotel) {
    return res.status(404).json({ error: 'Hotel configuration not found.' });
  }

  // Parse payment methods JSON safely
  let paymentMethods = ['mpesa', 'cash', 'card', 'bank_transfer', 'room_charge'];
  try {
    if (hotel.payment_methods_json) {
      paymentMethods = JSON.parse(hotel.payment_methods_json);
    }
  } catch (e) {
    paymentMethods = ['mpesa', 'cash', 'card', 'bank_transfer', 'room_charge'];
  }

  // Mask sensitive credentials
  const maskSecret = (secret: string | null) => {
    if (!secret || secret.length < 4) return '';
    return '••••••••••••' + secret.slice(-4);
  };

  res.json({
    id: hotel.id,
    tenant_id: hotel.tenant_id,
    name: hotel.name,
    legal_name: hotel.legal_name || '',
    tax_pin: hotel.tax_pin || '',
    currency: hotel.currency || 'KES',
    phone: hotel.phone || '',
    email: hotel.email || '',
    address: hotel.address || '',
    logo_url: hotel.logo_url || '',
    vat_rate: hotel.vat_rate !== undefined ? hotel.vat_rate : 16.0,
    catering_levy_rate: hotel.catering_levy_rate !== undefined ? hotel.catering_levy_rate : 2.0,
    service_charge_rate: hotel.service_charge_rate !== undefined ? hotel.service_charge_rate : 0.0,
    system_mode: hotel.system_mode || 'live',

    // M-Pesa Daraja Configuration
    mpesa_consumer_key: hotel.mpesa_consumer_key || '',
    mpesa_consumer_secret: maskSecret(hotel.mpesa_consumer_secret),
    mpesa_shortcode: hotel.mpesa_shortcode || '',
    mpesa_passkey: maskSecret(hotel.mpesa_passkey),
    mpesa_callback_url: hotel.mpesa_callback_url || '',
    mpesa_environment: hotel.mpesa_environment || 'sandbox',
    mpesa_enabled: hotel.mpesa_enabled !== 0,

    // SMTP Email Configuration
    smtp_host: hotel.smtp_host || '',
    smtp_port: hotel.smtp_port || 587,
    smtp_username: hotel.smtp_username || '',
    smtp_password: maskSecret(hotel.smtp_password),
    smtp_from_address: hotel.smtp_from_address || '',
    smtp_enabled: hotel.smtp_enabled === 1,

    // Supported Payment Methods
    payment_methods: paymentMethods,
    master_qr_token: hotel.master_qr_token || `qr_master_${hotel.id.replace(/-/g, '_')}`,
    theme_preset: hotel.theme_preset || 'heritage_gold',
  });
});

// GET Master QR Code Details for Hotel (Public / Staff)
hotelRouter.get('/master-qr', (req, res) => {
  const tenantId = (req.query.tenantId as string) || 'tenant-grand-heritage';

  let hotel = queryOne(`SELECT * FROM hotels WHERE tenant_id = ? LIMIT 1`, [tenantId]);
  if (!hotel) {
    hotel = queryOne(`SELECT * FROM hotels LIMIT 1`);
  }
  if (!hotel) {
    return res.status(404).json({ error: 'Hotel not found.' });
  }

  const tenant = queryOne('SELECT slug FROM tenants WHERE id = ?', [hotel.tenant_id]);
  const host = req.get('host') || 'localhost:8967';
  const protocol = req.protocol === 'https' ? 'https' : 'http';
  const masterToken = hotel.master_qr_token || `qr_master_${hotel.id.replace(/-/g, '_')}`;

  const qrUrl = `${protocol}://${host}/?table=${masterToken}&hotel=${tenant?.slug || 'grand-heritage'}`;
  const menuUrl = `${protocol}://${host}/h/${tenant?.slug || 'grand-heritage'}`;

  res.json({
    hotel_id: hotel.id,
    tenant_id: hotel.tenant_id,
    hotel_name: hotel.name,
    legal_name: hotel.legal_name || hotel.name,
    logo_url: hotel.logo_url,
    currency: hotel.currency || 'KES',
    token: masterToken,
    master_qr_token: masterToken,
    qr_url: qrUrl,
    direct_url: qrUrl,
    menu_url: menuUrl,
    wifi_ssid: `${hotel.name.split(' ')[0]}_Guest_WiFi`,
    wifi_password: `WelcomeTo${hotel.name.split(' ')[0]}`,
    instructions: "Scan with your phone camera to view today's scheduled menu, customize dishes, and order directly with Safaricom M-Pesa."
  });
});

// GET Public Hotel Identity & Branding Info (No Auth Required)
hotelRouter.get('/public-info', (req, res) => {
  const tenantId = (req.query.tenantId as string) || (req.headers['x-tenant-id'] as string) || 'tenant-grand-heritage';

  let hotel = queryOne(`SELECT * FROM hotels WHERE tenant_id = ? LIMIT 1`, [tenantId]);
  if (!hotel) {
    hotel = queryOne(`SELECT * FROM hotels LIMIT 1`);
  }
  if (!hotel) {
    return res.status(404).json({ error: 'Hotel not found.' });
  }

  res.json({
    id: hotel.id,
    tenant_id: hotel.tenant_id,
    name: hotel.name,
    legal_name: hotel.legal_name || hotel.name,
    logo_url: hotel.logo_url || null,
    currency: hotel.currency || 'KES',
    phone: hotel.phone || '',
    email: hotel.email || '',
    address: hotel.address || '',
  });
});

// Regenerate Master Hotel QR Token
hotelRouter.post('/master-qr/regenerate', authenticate, authorize(['super_admin', 'saas_super_admin', 'hotel_owner', 'hotel_admin']), (req: any, res) => {
  const tenantId = req.tenantId || req.user?.tenant_id || 'tenant-grand-heritage';
  const newToken = `qr_master_${Date.now()}_${uuidv4().substring(0, 8)}`;

  execute(`
    UPDATE hotels 
    SET master_qr_token = ?, updated_at = CURRENT_TIMESTAMP
    WHERE tenant_id = ?
  `, [newToken, tenantId]);

  logAudit(req.user.id, 'REGENERATE_MASTER_QR', 'HOTEL', tenantId, { newToken });

  res.json({
    success: true,
    token: newToken,
    master_qr_token: newToken,
    message: 'Master Hotel QR token regenerated successfully.'
  });
});

// Switch Global / Hotel App Theme
hotelRouter.post('/theme', authenticate, authorize(['super_admin', 'saas_super_admin', 'hotel_owner', 'hotel_admin']), (req: any, res) => {
  const tenantId = req.tenantId || req.user?.tenant_id || 'tenant-grand-heritage';
  const theme = req.body.theme || req.body.themePreset;

  if (!theme) {
    return res.status(400).json({ error: 'Theme preset ID is required.' });
  }

  execute(`
    UPDATE hotels 
    SET theme_preset = ?, updated_at = CURRENT_TIMESTAMP
    WHERE tenant_id = ?
  `, [theme, tenantId]);

  logAudit(req.user.id, 'CHANGE_THEME_PRESET', 'HOTEL', tenantId, { theme });

  res.json({
    success: true,
    theme,
    theme_preset: theme,
    message: `Application theme updated to '${theme}'.`
  });
});

// PUT Update Hotel Details & Credentials
hotelRouter.put('/settings', authenticate, authorize(['super_admin', 'saas_super_admin', 'hotel_owner', 'hotel_admin']), (req: any, res) => {
  const tenantId = req.tenantId || req.user?.tenant_id || 'tenant-grand-heritage';

  const {
    name, legal_name, tax_pin, currency, phone, email, address, logo_url,
    vat_rate, catering_levy_rate, service_charge_rate,
    mpesa_consumer_key, mpesa_consumer_secret, mpesa_shortcode, mpesa_passkey,
    mpesa_callback_url, mpesa_environment, mpesa_enabled,
    smtp_host, smtp_port, smtp_username, smtp_password, smtp_from_address, smtp_enabled,
    payment_methods, system_mode, theme_preset
  } = req.body;

  let hotel = queryOne(`SELECT * FROM hotels WHERE tenant_id = ? LIMIT 1`, [tenantId]);
  if (!hotel) {
    hotel = queryOne(`SELECT * FROM hotels LIMIT 1`);
  }

  if (!hotel) {
    return res.status(404).json({ error: 'Hotel record not found.' });
  }

  // Preserve secret if unedited (contains masked bullets)
  let finalMpesaSecret = hotel.mpesa_consumer_secret;
  if (mpesa_consumer_secret && !mpesa_consumer_secret.includes('••')) {
    finalMpesaSecret = mpesa_consumer_secret;
  }

  let finalMpesaPasskey = hotel.mpesa_passkey;
  if (mpesa_passkey && !mpesa_passkey.includes('••')) {
    finalMpesaPasskey = mpesa_passkey;
  }

  let finalSmtpPass = hotel.smtp_password;
  if (smtp_password && !smtp_password.includes('••')) {
    finalSmtpPass = smtp_password;
  }

  const paymentMethodsJson = payment_methods ? JSON.stringify(payment_methods) : hotel.payment_methods_json;

  execute(`
    UPDATE hotels
    SET 
      name = COALESCE(?, name),
      legal_name = COALESCE(?, legal_name),
      tax_pin = COALESCE(?, tax_pin),
      currency = COALESCE(?, currency),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      address = COALESCE(?, address),
      logo_url = COALESCE(?, logo_url),
      vat_rate = COALESCE(?, vat_rate),
      catering_levy_rate = COALESCE(?, catering_levy_rate),
      service_charge_rate = COALESCE(?, service_charge_rate),
      system_mode = COALESCE(?, system_mode),
      theme_preset = COALESCE(?, theme_preset),
      mpesa_consumer_key = COALESCE(?, mpesa_consumer_key),
      mpesa_consumer_secret = ?,
      mpesa_shortcode = COALESCE(?, mpesa_shortcode),
      mpesa_passkey = ?,
      mpesa_callback_url = COALESCE(?, mpesa_callback_url),
      mpesa_environment = COALESCE(?, mpesa_environment),
      mpesa_enabled = COALESCE(?, mpesa_enabled),
      smtp_host = COALESCE(?, smtp_host),
      smtp_port = COALESCE(?, smtp_port),
      smtp_username = COALESCE(?, smtp_username),
      smtp_password = ?,
      smtp_from_address = COALESCE(?, smtp_from_address),
      smtp_enabled = COALESCE(?, smtp_enabled),
      payment_methods_json = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    name, legal_name, tax_pin, currency, phone, email, address, logo_url,
    vat_rate, catering_levy_rate, service_charge_rate, system_mode, theme_preset,
    mpesa_consumer_key, finalMpesaSecret, mpesa_shortcode, finalMpesaPasskey,
    mpesa_callback_url, mpesa_environment, mpesa_enabled ? 1 : 0,
    smtp_host, smtp_port, smtp_username, finalSmtpPass, smtp_from_address, smtp_enabled ? 1 : 0,
    paymentMethodsJson,
    hotel.id
  ]);

  // Synchronize Hotel Name & Logo across tenants, tenant_branding, and platform_settings
  if (name || logo_url) {
    try {
      if (name) {
        execute(`UPDATE tenants SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [name, hotel.tenant_id]);
      }
      execute(`
        INSERT INTO tenant_branding (id, tenant_id, brand_name, logo_url, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(tenant_id) DO UPDATE SET
          brand_name = COALESCE(?, brand_name),
          logo_url = COALESCE(?, logo_url),
          updated_at = CURRENT_TIMESTAMP
      `, [uuidv4(), hotel.tenant_id, name || hotel.name, logo_url || hotel.logo_url, name, logo_url]);

      execute(`
        UPDATE platform_settings
        SET platform_name = COALESCE(?, platform_name),
            company_name = COALESCE(?, company_name),
            logo_url = COALESCE(?, logo_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 'global'
      `, [name, legal_name || name, logo_url]);
    } catch (syncErr) {
      console.warn('Branding sync warning:', syncErr);
    }
  }

  logAudit(req.user.id, 'UPDATE_HOTEL_SETTINGS', 'HOTEL', hotel.id, { name, system_mode, currency });

  res.json({
    success: true,
    message: 'Hotel details, credentials, and settings updated successfully.'
  });
});

// ----------------------------------------------------
// 3. LIVE VS DEMO MODE & DEMO PURGE / SEED
// ----------------------------------------------------

// Toggle System Mode (live vs demo)
hotelRouter.post('/mode', authenticate, authorize(['super_admin', 'saas_super_admin', 'hotel_owner', 'hotel_admin']), (req: any, res) => {
  const tenantId = req.tenantId || req.user?.tenant_id || 'tenant-grand-heritage';
  const { mode } = req.body;

  if (mode !== 'live' && mode !== 'demo') {
    return res.status(400).json({ error: "Mode must be either 'live' or 'demo'." });
  }

  execute(`
    UPDATE hotels
    SET system_mode = ?, updated_at = CURRENT_TIMESTAMP
    WHERE tenant_id = ?
  `, [mode, tenantId]);

  logAudit(req.user.id, 'CHANGE_SYSTEM_MODE', 'HOTEL', tenantId, { mode });

  res.json({
    success: true,
    mode,
    message: mode === 'live' 
      ? 'System switched to Live Production mode. Showing clean active operational records.'
      : 'System switched to Demo Showcase mode. Demo items and preview data are visible.'
  });
});

// Switch to Live Mode & Clear All Demo Menu Items
hotelRouter.post('/clear-demo', authenticate, authorize(['super_admin', 'saas_super_admin', 'hotel_owner', 'hotel_admin']), (req: any, res) => {
  const tenantId = req.tenantId || req.user?.tenant_id || 'tenant-grand-heritage';

  runInTransaction(() => {
    // Delete order items that reference demo menu items
    execute(`
      DELETE FROM order_items
      WHERE menu_item_id IN (
        SELECT id FROM menu_items
        WHERE (tenant_id = ? OR tenant_id IS NULL) AND is_demo = 1
      )
    `, [tenantId]);

    // Delete demo menu items
    execute(`
      DELETE FROM menu_items
      WHERE (tenant_id = ? OR tenant_id IS NULL) AND is_demo = 1
    `, [tenantId]);

    // Set hotel to live mode
    execute(`
      UPDATE hotels
      SET system_mode = 'live', updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ?
    `, [tenantId]);
  });

  const remainingCount = queryOne(`
    SELECT COUNT(*) as count FROM menu_items WHERE tenant_id = ? OR tenant_id IS NULL
  `, [tenantId]);

  logAudit(req.user.id, 'CLEAR_DEMO_DATA', 'MENU', tenantId, { remainingItems: remainingCount?.count || 0 });

  res.json({
    success: true,
    system_mode: 'live',
    message: 'Demo items cleared successfully! Your system is now in clean Live Mode, ready for adding your real menu items, staff, and pricing.',
    remaining_items_count: remainingCount?.count || 0
  });
});

// Load Demo Menu Items for Showcase / Demonstration
hotelRouter.post('/load-demo', authenticate, authorize(['super_admin', 'saas_super_admin', 'hotel_owner', 'hotel_admin']), (req: any, res) => {
  const tenantId = req.tenantId || req.user?.tenant_id || 'tenant-grand-heritage';

  const outlet = queryOne(`SELECT id FROM outlets WHERE tenant_id = ? LIMIT 1`, [tenantId]) || { id: 'outlet-royal-orchid' };
  const stationMain = queryOne(`SELECT id FROM kitchen_stations WHERE tenant_id = ? AND code = 'MAIN' LIMIT 1`, [tenantId]) || { id: 'station-main' };
  const stationGrill = queryOne(`SELECT id FROM kitchen_stations WHERE tenant_id = ? AND code = 'GRILL' LIMIT 1`, [tenantId]) || { id: 'station-grill' };
  const stationBar = queryOne(`SELECT id FROM kitchen_stations WHERE tenant_id = ? AND code = 'BAR' LIMIT 1`, [tenantId]) || { id: 'station-bar' };
  const stationPastry = queryOne(`SELECT id FROM kitchen_stations WHERE tenant_id = ? AND code = 'PASTRY' LIMIT 1`, [tenantId]) || { id: 'station-dessert' };

  // Ensure default categories exist
  const catBreakfast = queryOne(`SELECT id FROM menu_categories WHERE slug = 'breakfast' AND tenant_id = ?`, [tenantId])?.id || 'cat-breakfast';
  const catGrill = queryOne(`SELECT id FROM menu_categories WHERE slug = 'steaks-grill' AND tenant_id = ?`, [tenantId])?.id || 'cat-grill';
  const catMains = queryOne(`SELECT id FROM menu_categories WHERE slug = 'mains-pasta' AND tenant_id = ?`, [tenantId])?.id || 'cat-mains';
  const catCocktails = queryOne(`SELECT id FROM menu_categories WHERE slug = 'cocktails-bar' AND tenant_id = ?`, [tenantId])?.id || 'cat-cocktails';
  const catDesserts = queryOne(`SELECT id FROM menu_categories WHERE slug = 'desserts' AND tenant_id = ?`, [tenantId])?.id || 'cat-dessert';

  const demoDishes = [
    {
      id: `itm-demo-breakfast-${Date.now()}`,
      cat: catBreakfast,
      station: stationMain.id,
      name: 'The Grand Heritage Full English Breakfast',
      desc: 'Farm eggs any style, beef Cumberland sausages, crispy bacon, sautéed wild mushrooms, grilled tomato, baked beans, sourdough toast.',
      price: 1850.0,
      cost: 620.0,
      prep: 14,
      img: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
      flags: JSON.stringify(['Chef Special']),
      allergens: JSON.stringify(['Eggs', 'Gluten', 'Dairy']),
      spices: JSON.stringify(['Mild', 'Medium', 'Hot']),
      is_special: 1
    },
    {
      id: `itm-demo-ribeye-${Date.now()}`,
      cat: catGrill,
      station: stationGrill.id,
      name: '45-Day Dry Aged Prime Angus Ribeye Steak (350g)',
      desc: 'Flame-seared over acacia charcoal, bone marrow & black truffle compound butter, smoked chimichurri, rosemary duck-fat roasted wedges.',
      price: 4200.0,
      cost: 1450.0,
      prep: 22,
      img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      flags: JSON.stringify(['Chef Special', 'Gluten-Free']),
      allergens: JSON.stringify(['Dairy']),
      spices: JSON.stringify(['Mild Garlic', 'Medium Peppercorn', 'Hot Peri-Peri', 'Signature Smoked Herb']),
      is_special: 1
    },
    {
      id: `itm-demo-pasta-${Date.now()}`,
      cat: catMains,
      station: stationMain.id,
      name: 'Handmade Tagliatelle al Tartufo & Wild Morel',
      desc: 'Extruded daily bronze-die pasta, wild Aberdare mountain morels, 30-month Parmigiano Reggiano emulsified velouté, shaved black summer truffles.',
      price: 2650.0,
      cost: 720.0,
      prep: 15,
      img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
      flags: JSON.stringify(['Vegetarian']),
      allergens: JSON.stringify(['Gluten', 'Dairy', 'Eggs']),
      spices: JSON.stringify(['Garlic Herb', 'Chili Flakes']),
      is_special: 0
    },
    {
      id: `itm-demo-negroni-${Date.now()}`,
      cat: catCocktails,
      station: stationBar.id,
      name: 'The Savannah Sunset Negroni',
      desc: 'Procera African gin, Carpano Antica Formula sweet vermouth, Campari, smoked baobab essence, flamed orange peel.',
      price: 1350.0,
      cost: 380.0,
      prep: 5,
      img: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
      flags: JSON.stringify(['Signature Cocktail', 'Alcoholic']),
      allergens: JSON.stringify([]),
      spices: JSON.stringify([]),
      is_special: 1
    },
    {
      id: `itm-demo-dawa-${Date.now()}`,
      cat: catCocktails,
      station: stationBar.id,
      name: 'Highland Passion Honey Dawa',
      desc: 'Kenyan highland cane spirit, freshly muddled sweet limes, passion fruit pulp and local stingless bee organic honey with traditional wooden dawa stick.',
      price: 1200.0,
      cost: 320.0,
      prep: 4,
      img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
      flags: JSON.stringify(['Kenyan Classic', 'Popular']),
      allergens: JSON.stringify([]),
      spices: JSON.stringify([]),
      is_special: 0
    },
    {
      id: `itm-demo-fondant-${Date.now()}`,
      cat: catDesserts,
      station: stationPastry.id,
      name: 'Molten Belgian Dark Chocolate Fondant (72%)',
      desc: 'Warm flowing Guanaja chocolate center, Madagascar bourbon vanilla bean gelato, roasted pistachio crumble, gold leaf garnish.',
      price: 1450.0,
      cost: 410.0,
      prep: 16,
      img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
      flags: JSON.stringify(['Vegetarian']),
      allergens: JSON.stringify(['Dairy', 'Eggs', 'Gluten', 'Nuts']),
      spices: JSON.stringify(['Cinnamon Dust', 'Vanilla Bean']),
      is_special: 1
    }
  ];

  let seededCount = 0;
  runInTransaction(() => {
    for (const d of demoDishes) {
      execute(`
        INSERT INTO menu_items (
          id, tenant_id, category_id, outlet_id, station_id,
          name, description, price, cost_price, image_url,
          estimated_prep_time, is_available, is_sold_out, is_special,
          dietary_flags, allergens, spices_json, is_demo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, 1)
      `, [
        d.id, tenantId, d.cat, outlet.id, d.station,
        d.name, d.desc, d.price, d.cost, d.img,
        d.prep, d.is_special, d.flags, d.allergens, d.spices
      ]);
      seededCount++;
    }

    // Set hotel to demo mode
    execute(`
      UPDATE hotels
      SET system_mode = 'demo', updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = ?
    `, [tenantId]);
  });

  logAudit(req.user.id, 'LOAD_DEMO_DATA', 'MENU', tenantId, { seededCount });

  res.json({
    success: true,
    system_mode: 'demo',
    message: `Loaded ${seededCount} gourmet showcase demo items. You can preview all menu presentations or switch back to Live clean mode at any time.`,
    seeded_count: seededCount
  });
});
