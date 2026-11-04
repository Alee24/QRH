import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, initDatabase, runInTransaction, execute, queryOne } from './index.js';

export function seedDatabase() {
  initDatabase();

  const existingTenant = queryOne('SELECT id FROM tenants LIMIT 1');
  if (existingTenant) {
    console.log('Database already initialized with multi-tenant seed data.');
    return;
  }

  console.log('Starting master multi-tenant seed generation...');

  runInTransaction(() => {
    // 0. SUBSCRIPTION PLANS
    const planStarter = 'plan-starter';
    const planGrowth = 'plan-growth';
    const planEnterprise = 'plan-enterprise';

    execute(`
      INSERT OR IGNORE INTO subscription_plans (id, name, description, price_monthly, currency, max_tables, max_outlets, max_staff, features_json, is_active)
      VALUES 
      (?, 'Boutique Starter', 'Ideal for boutique cafes and single restaurants', 9500.0, 'KES', 20, 1, 10, ?, 1),
      (?, 'Professional Growth', 'Full KDS, table management, M-Pesa STK, and inventory BOM', 24500.0, 'KES', 50, 3, 30, ?, 1),
      (?, 'Enterprise Hospitality', 'Multi-property hotel PMS integration, white-label branding and custom domains', 65000.0, 'KES', 150, 10, 100, ?, 1)
    `, [
      planStarter, JSON.stringify(['qr_ordering', 'kds', 'pos', 'mpesa_stk']),
      planGrowth, JSON.stringify(['qr_ordering', 'kds', 'pos', 'inventory_bom', 'mpesa_stk', 'reports']),
      planEnterprise, JSON.stringify(['qr_ordering', 'kds', 'pos', 'inventory_bom', 'mpesa_stk', 'hotel_rooms', 'white_label', 'multi_outlet', 'custom_domain'])
    ]);

    // 0.1 GLOBAL SAAS PLATFORM BRANDING & SETTINGS
    execute(`
      INSERT OR IGNORE INTO platform_settings (id, platform_name, company_name, logo_url, login_logo_url, favicon_url, browser_title, support_email, support_phone, footer_text, copyright_text, primary_color, secondary_color, accent_color, border_radius, font_family)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'global',
      'PlateIQ Hospitality Cloud',
      'PlateIQ Technologies Ltd',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
      '/vite.svg',
      'PlateIQ - Restaurant & Hotel Cloud POS',
      'support@plateiq.cloud',
      '+254 700 999 888',
      'PlateIQ Multi-Tenant Hospitality Engine',
      '© 2026 PlateIQ Technologies Ltd. All rights reserved.',
      '#ca8a26', '#1c1917', '#2563eb', '16px', 'Plus Jakarta Sans'
    ]);

    // 0.2 TENANTS (HOTEL SUBSCRIBERS)
    const tenant1Id = 'tenant-grand-heritage';
    const tenant2Id = 'tenant-serena-safari';
    const tenant3Id = 'tenant-carnivore-pit';

    execute(`
      INSERT OR IGNORE INTO tenants (id, name, slug, custom_domain, status, plan_id, subscription_status, max_tables, max_outlets, max_staff, owner_email, owner_phone)
      VALUES 
      (?, 'Grand Heritage Hotel & Resort', 'grand-heritage', 'pos.grandheritagehotel.com', 'active', ?, 'active', 100, 5, 50, 'owner@grandheritagehotel.com', '+254700123456'),
      (?, 'Serena Safari Lodge & Mara Grill', 'serena-safari', 'dining.serenasafari.com', 'active', ?, 'active', 50, 2, 30, 'gm@serenasafari.com', '+254711222333'),
      (?, 'The Carnivore Pit & Smoker', 'carnivore-pit', NULL, 'pending_approval', ?, 'trial', 20, 1, 10, 'director@carnivorepit.co.ke', '+254722333444')
    `, [
      tenant1Id, planEnterprise,
      tenant2Id, planGrowth,
      tenant3Id, planStarter
    ]);

    // TENANT BRANDING OVERRIDES (White-Label)
    execute(`
      INSERT OR IGNORE INTO tenant_branding (id, tenant_id, brand_name, logo_url, primary_color, secondary_color, accent_color, receipt_header, receipt_footer)
      VALUES 
      (?, ?, 'Grand Heritage Hotel', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80', '#ca8a26', '#1c1917', '#2563eb', 'Grand Heritage Hotel & Resort\nArgwings Kodhek Rd, Kilimani, Nairobi', 'Thank you for fine dining with Grand Heritage'),
      (?, ?, 'Serena Safari Lodge', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80', '#059669', '#064e3b', '#d97706', 'Serena Safari Lodge & Savanna Grill\nMaasai Mara Game Reserve', 'Experience wild luxury with Serena')
    `, [
      uuidv4(), tenant1Id,
      uuidv4(), tenant2Id
    ]);

    // 1. HOTEL ENTITIES
    const hotel1Id = 'hotel-grand-heritage';
    const hotel2Id = 'hotel-serena-safari';

    execute(`
      INSERT OR IGNORE INTO hotels (id, tenant_id, name, legal_name, tax_pin, currency, phone, email, address, logo_url, vat_rate, catering_levy_rate, service_charge_rate)
      VALUES 
      (?, ?, 'Grand Heritage Hotel & Resort', 'Grand Heritage Hospitality Ltd', 'P051239842M', 'KES', '+254 700 123 456', 'reservations@grandheritagehotel.com', 'Argwings Kodhek Rd, Kilimani, Nairobi', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80', 16.0, 2.0, 5.0),
      (?, ?, 'Serena Safari Lodge', 'Serena Savanna Holdings Ltd', 'P062394812K', 'KES', '+254 711 222 333', 'reservations@serenasafari.com', 'Maasai Mara National Reserve, Kenya', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80', 16.0, 2.0, 10.0)
    `, [hotel1Id, tenant1Id, hotel2Id, tenant2Id]);

    // 2. OUTLETS
    const outMainId = 'outlet-royal-orchid';
    const outSkylineId = 'outlet-skyline-lounge';
    const outSerenaId = 'outlet-mara-grill';

    execute(`
      INSERT OR IGNORE INTO outlets (id, tenant_id, hotel_id, name, code, type, is_active, opening_time, closing_time)
      VALUES 
      (?, ?, ?, 'The Royal Orchid Fine Dining', 'ROYAL-ORCHID', 'restaurant', 1, '06:30', '23:30'),
      (?, ?, ?, 'Skyline Rooftop Bar & Lounge', 'SKYLINE', 'bar', 1, '12:00', '02:00'),
      (?, ?, ?, 'Mara Savanna Charcoal Grill', 'MARA-GRILL', 'restaurant', 1, '07:00', '23:00')
    `, [
      outMainId, tenant1Id, hotel1Id,
      outSkylineId, tenant1Id, hotel1Id,
      outSerenaId, tenant2Id, hotel2Id
    ]);

    // 3. FLOORS & SECTIONS
    const floorGId = 'floor-ground';
    const floorRoofId = 'floor-rooftop';
    execute(`
      INSERT OR IGNORE INTO floors (id, tenant_id, outlet_id, name, level, sort_order)
      VALUES (?, ?, ?, 'Ground Floor Dining', 0, 1), (?, ?, ?, '5th Floor Panorama', 5, 2)
    `, [floorGId, tenant1Id, outMainId, floorRoofId, tenant1Id, outSkylineId]);

    const secIndoorId = 'sec-indoor';
    const secGardenId = 'sec-garden';
    const secTerraceId = 'sec-terrace';
    execute(`
      INSERT OR IGNORE INTO sections (id, tenant_id, floor_id, name, description)
      VALUES (?, ?, ?, 'Indoor Main Hall', 'Air-conditioned main hall'),
             (?, ?, ?, 'Orchid Garden Patio', 'Alfresco fountain dining'),
             (?, ?, ?, 'Panoramic Terrace', 'Skyline views')
    `, [secIndoorId, tenant1Id, floorGId, secGardenId, tenant1Id, floorGId, secTerraceId, tenant1Id, floorRoofId]);

    // 4. KITCHEN STATIONS
    const stMain = 'station-main';
    const stGrill = 'station-grill';
    const stBar = 'station-bar';
    const stDessert = 'station-dessert';
    const stSerenaMain = 'station-serena-main';

    execute(`
      INSERT OR IGNORE INTO kitchen_stations (id, tenant_id, outlet_id, name, code, color_code, is_active)
      VALUES (?, ?, ?, 'Main Hot Kitchen', 'MAIN', '#2563eb', 1),
             (?, ?, ?, 'Charcoal & Smoker Grill', 'GRILL', '#ea580c', 1),
             (?, ?, ?, 'Cocktail & Artisan Bar', 'BAR', '#16a34a', 1),
             (?, ?, ?, 'Pastry & Dessert Studio', 'PASTRY', '#9333ea', 1),
             (?, ?, ?, 'Savanna Bush Kitchen', 'BUSH', '#059669', 1)
    `, [
      stMain, tenant1Id, outMainId,
      stGrill, tenant1Id, outMainId,
      stBar, tenant1Id, outMainId,
      stDessert, tenant1Id, outMainId,
      stSerenaMain, tenant2Id, outSerenaId
    ]);

    // 5. RESTAURANT TABLES (Grand Heritage: T01 - T16, Serena Safari: S01 - S04)
    const tablesData = [
      { num: '01', name: 'Table 01 (Indoor Front)', cap: 2, sec: secIndoorId, floor: floorGId, x: 80, y: 100 },
      { num: '02', name: 'Table 02 (Window View)', cap: 4, sec: secIndoorId, floor: floorGId, x: 200, y: 100 },
      { num: '03', name: 'Table 03 (Center Booth)', cap: 6, sec: secIndoorId, floor: floorGId, x: 320, y: 100 },
      { num: '04', name: 'Table 04 (Family Round)', cap: 8, sec: secIndoorId, floor: floorGId, x: 440, y: 100 },
      { num: '05', name: 'Table 05 (Garden Gazebo)', cap: 4, sec: secGardenId, floor: floorGId, x: 80, y: 240 },
      { num: '06', name: 'Table 06 (Garden Pergola)', cap: 4, sec: secGardenId, floor: floorGId, x: 200, y: 240 },
      { num: '07', name: 'Table 07 (Fountain Side)', cap: 2, sec: secGardenId, floor: floorGId, x: 320, y: 240 },
      { num: '08', name: 'Table 08 (Garden VIP)', cap: 6, sec: secGardenId, floor: floorGId, x: 440, y: 240 },
      { num: '09', name: 'Table 09 (Indoor Lounge)', cap: 4, sec: secIndoorId, floor: floorGId, x: 80, y: 380 },
      { num: '10', name: 'Table 10 (Indoor Corner)', cap: 2, sec: secIndoorId, floor: floorGId, x: 200, y: 380 },
      { num: '11', name: 'Table 11 (Private Dining)', cap: 10, sec: secIndoorId, floor: floorGId, x: 320, y: 380 },
      { num: '12', name: 'Table 12 (Chef Table)', cap: 6, sec: secIndoorId, floor: floorGId, x: 440, y: 380 },
      { num: 'R1', name: 'Rooftop Lounge 01', cap: 4, sec: secTerraceId, floor: floorRoofId, x: 100, y: 100 },
      { num: 'R2', name: 'Rooftop Lounge 02', cap: 4, sec: secTerraceId, floor: floorRoofId, x: 240, y: 100 },
      { num: 'R3', name: 'Rooftop Bar Counter', cap: 2, sec: secTerraceId, floor: floorRoofId, x: 380, y: 100 },
      { num: 'R4', name: 'Rooftop VIP Cabana', cap: 8, sec: secTerraceId, floor: floorRoofId, x: 500, y: 100 },
    ];

    for (const t of tablesData) {
      const tableId = `tbl-${t.num.toLowerCase()}`;
      const qrToken = `qr_token_${t.num.toLowerCase()}_${uuidv4().substring(0, 8)}`;
      const outId = t.floor === floorRoofId ? outSkylineId : outMainId;
      execute(`
        INSERT OR IGNORE INTO restaurant_tables (id, tenant_id, outlet_id, floor_id, section_id, table_number, name, capacity, status, qr_token, pos_x, pos_y, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, 1)
      `, [tableId, tenant1Id, outId, t.floor, t.sec, t.num, t.name, t.cap, qrToken, t.x, t.y]);
    }

    // Serena Tables (Tenant 2 isolated tables)
    ['S1', 'S2', 'S3', 'S4'].forEach((num, idx) => {
      execute(`
        INSERT OR IGNORE INTO restaurant_tables (id, tenant_id, outlet_id, floor_id, section_id, table_number, name, capacity, status, qr_token, pos_x, pos_y, is_active)
        VALUES (?, ?, ?, NULL, NULL, ?, ?, 4, 'available', ?, ?, 100, 1)
      `, [
        `tbl-serena-${num.toLowerCase()}`, tenant2Id, outSerenaId, num,
        `Savanna Deck ${num}`, `qr_serena_${num.toLowerCase()}_${uuidv4().substring(0, 8)}`,
        idx * 120 + 80
      ]);
    });

    // 6. HOTEL ROOMS
    const rooms = [
      { num: '101', floor: 1, guest: 'Dr. David Kiprop', phone: '+254711223344' },
      { num: '102', floor: 1, guest: 'Sarah Jenkins', phone: '+254722334455' },
      { num: '103', floor: 1, guest: null, phone: null },
      { num: '201', floor: 2, guest: 'Hon. Wanjiku Mwangi', phone: '+254733445566' },
      { num: '202', floor: 2, guest: 'Alexandre Moreau', phone: '+254744556677' },
      { num: '501', floor: 5, guest: 'Ambassador Al-Mansoor', phone: '+254755667788' },
    ];

    for (const r of rooms) {
      execute(`
        INSERT OR IGNORE INTO hotel_rooms (id, tenant_id, room_number, floor, guest_name, guest_phone, is_occupied, check_in_date, check_out_date, billing_authorized, verification_pin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `, [
        `room-${r.num}`, tenant1Id, r.num, r.floor, r.guest, r.phone,
        r.guest ? 1 : 0, r.guest ? '2026-11-01' : null, r.guest ? '2026-11-10' : null,
        r.guest ? '1234' : null
      ]);
    }

    // 7. MULTI-LEVEL USERS & RBAC
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('Admin@2026!', salt);

    const users = [
      // LEVEL 1: SAAS PLATFORM SUPER ADMINISTRATORS
      { id: 'usr-saas-super', tenant: null, name: 'Alex Vance (SaaS Super Admin)', email: 'superadmin@plateiq.cloud', role: 'saas_super_admin', outlet: null, station: null },
      { id: 'usr-saas-support', tenant: null, name: 'Sonia Patel (SaaS Support)', email: 'support@plateiq.cloud', role: 'saas_support_admin', outlet: null, station: null },
      { id: 'usr-saas-finance', tenant: null, name: 'Daniel Muthama (SaaS Finance)', email: 'finance@plateiq.cloud', role: 'saas_finance_admin', outlet: null, station: null },
      { id: 'usr-saas-tech', tenant: null, name: 'Kevin Mworia (SaaS Tech Admin)', email: 'tech@plateiq.cloud', role: 'saas_tech_admin', outlet: null, station: null },

      // LEVEL 2 & 3: TENANT 1 (Grand Heritage Hotel & Resort)
      { id: 'usr-admin', tenant: tenant1Id, name: 'Arthur Pendelton (Owner)', email: 'admin@hotel.com', role: 'hotel_owner', outlet: outMainId, station: null },
      { id: 'usr-hotel-admin', tenant: tenant1Id, name: 'Beatrice Wambui (Hotel Admin)', email: 'admin-ops@hotel.com', role: 'hotel_admin', outlet: outMainId, station: null },
      { id: 'usr-manager', tenant: tenant1Id, name: 'Grace Muthoni (Manager)', email: 'manager@hotel.com', role: 'restaurant_manager', outlet: outMainId, station: null },
      { id: 'usr-chef', tenant: tenant1Id, name: 'Chef Samuel Otieno (Kitchen)', email: 'chef@hotel.com', role: 'kitchen_manager', outlet: outMainId, station: stMain },
      { id: 'usr-grill', tenant: tenant1Id, name: 'Chef Kelvin Barasa (Grill)', email: 'grill@hotel.com', role: 'kitchen_staff', outlet: outMainId, station: stGrill },
      { id: 'usr-bar', tenant: tenant1Id, name: 'Mixologist Brian Kimani (Bar)', email: 'bar@hotel.com', role: 'kitchen_staff', outlet: outMainId, station: stBar },
      { id: 'usr-pastry', tenant: tenant1Id, name: 'Chef Chloe Dubois (Pastry)', email: 'pastry@hotel.com', role: 'kitchen_staff', outlet: outMainId, station: stDessert },
      { id: 'usr-runner', tenant: tenant1Id, name: 'Felix Cheruiyot (Runner)', email: 'runner@hotel.com', role: 'service_staff', outlet: outMainId, station: null },
      { id: 'usr-cashier', tenant: tenant1Id, name: 'Faith Chebet (Cashier)', email: 'cashier@hotel.com', role: 'cashier', outlet: outMainId, station: null },
      { id: 'usr-reception', tenant: tenant1Id, name: 'Sharon Nekesa (Front Desk)', email: 'reception@hotel.com', role: 'receptionist', outlet: outMainId, station: null },
      { id: 'usr-accountant', tenant: tenant1Id, name: 'Patrick Ochieng (Accountant)', email: 'accountant@hotel.com', role: 'accountant', outlet: outMainId, station: null },
      { id: 'usr-inventory', tenant: tenant1Id, name: 'Mercy Achieng (Inventory)', email: 'inventory@hotel.com', role: 'inventory_manager', outlet: outMainId, station: null },
      { id: 'usr-auditor', tenant: tenant1Id, name: 'George Kariuki (Auditor)', email: 'audit@hotel.com', role: 'auditor', outlet: outMainId, station: null },

      // LEVEL 2 & 3: TENANT 2 (Serena Safari Lodge)
      { id: 'usr-serena-gm', tenant: tenant2Id, name: 'Capt. James Robertson', email: 'gm@serenasafari.com', role: 'hotel_owner', outlet: outSerenaId, station: null },
      { id: 'usr-serena-chef', tenant: tenant2Id, name: 'Chef Kipchoge Langat', email: 'chef@serenasafari.com', role: 'kitchen_manager', outlet: outSerenaId, station: stSerenaMain },
      { id: 'usr-serena-cashier', tenant: tenant2Id, name: 'Amina Hassan', email: 'cashier@serenasafari.com', role: 'cashier', outlet: outSerenaId, station: null }
    ];

    for (const u of users) {
      execute(`
        INSERT OR IGNORE INTO users (id, tenant_id, name, email, password_hash, role, outlet_id, station_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [u.id, u.tenant, u.name, u.email, defaultPasswordHash, u.role, u.outlet, u.station]);
    }

    // 8. MENU CATEGORIES (Grand Heritage)
    const categories = [
      { id: 'cat-breakfast', name: 'Gourmet Breakfast', slug: 'breakfast', mealType: 'breakfast', icon: 'Egg', order: 1, desc: 'Fresh morning artisanal dishes served until 11:30 AM' },
      { id: 'cat-starters', name: 'Starters & Small Plates', slug: 'starters', mealType: 'all_day', icon: 'Soup', order: 2, desc: 'Appetizers and sharing platters' },
      { id: 'cat-grill', name: 'Prime Grill & Steaks', slug: 'steaks-grill', mealType: 'lunch_dinner', icon: 'Flame', order: 3, desc: 'Aged prime beef, flame-grilled cuts and lamb' },
      { id: 'cat-swahili', name: 'Swahili & Coast Delicacies', slug: 'swahili-specialties', mealType: 'all_day', icon: 'Utensils', order: 4, desc: 'Traditional coconut curries, pilau and coastal seafood' },
      { id: 'cat-mains', name: 'Artisan Mains & Pasta', slug: 'mains-pasta', mealType: 'lunch_dinner', icon: 'Pizza', order: 5, desc: 'Handcrafted pasta, slow braises and poultry' },
      { id: 'cat-cocktails', name: 'Cocktails & Spirits', slug: 'cocktails-bar', mealType: 'drinks', icon: 'Wine', order: 6, desc: 'Master mixology, fine wine, single malts and mocktails' },
      { id: 'cat-beverages', name: 'Specialty Coffee & Teas', slug: 'beverages', mealType: 'drinks', icon: 'Coffee', order: 7, desc: 'Single-origin Kenyan coffee, spiced teas and cold presses' },
      { id: 'cat-dessert', name: 'Artisanal Desserts', slug: 'desserts', mealType: 'all_day', icon: 'Cake', order: 8, desc: 'Decadent chocolate tarts, cheesecakes and gelato' },
    ];

    for (const c of categories) {
      execute(`
        INSERT OR IGNORE INTO menu_categories (id, tenant_id, outlet_id, name, slug, description, icon, sort_order, meal_type, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [c.id, tenant1Id, outMainId, c.name, c.slug, c.desc, c.icon, c.order, c.mealType]);
    }

    // Serena Safari Categories (Tenant 2 isolated categories)
    execute(`
      INSERT OR IGNORE INTO menu_categories (id, tenant_id, outlet_id, name, slug, description, icon, sort_order, meal_type, is_active)
      VALUES 
      (?, ?, ?, 'Savanna Bush Breakfast', 'bush-breakfast', 'Cooked live over acacia embers', 'Egg', 1, 'breakfast', 1),
      (?, ?, ?, 'Game Reserve Charcoal Braai', 'braai-grill', 'Smoked game meats and ribs', 'Flame', 2, 'all_day', 1)
    `, [
      'cat-serena-breakfast', tenant2Id, outSerenaId,
      'cat-serena-grill', tenant2Id, outSerenaId
    ]);

    // 9. MENU ITEMS & RECIPES (Grand Heritage)
    const items = [
      {
        id: 'itm-heritage-breakfast',
        cat: 'cat-breakfast',
        station: stMain,
        name: 'The Grand Heritage Full English Breakfast',
        desc: 'Farm eggs any style, beef Cumberland sausages, crispy smoked bacon, sautéed wild mushrooms, grilled tomato, baked beans, sourdough toast.',
        price: 1850.0,
        cost: 620.0,
        prep: 14,
        img: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
        flags: JSON.stringify(['Chef Special']),
        allergens: JSON.stringify(['Eggs', 'Gluten', 'Dairy']),
        portions: [
          { name: 'Standard Plate', price: 1850.0, def: 1 },
          { name: 'Executive Platter', price: 2450.0, def: 0 },
        ],
        modifiers: [
          {
            name: 'Egg Preparation',
            req: 1, min: 1, max: 1,
            opts: [{ name: 'Sunny Side Up', price: 0 }, { name: 'Poached (Soft)', price: 0 }, { name: 'Fluffy Scrambled', price: 0 }]
          }
        ]
      },
      {
        id: 'itm-ribeye-steak',
        cat: 'cat-grill',
        station: stGrill,
        name: 'Prime Aged Angus Ribeye Steak (350g)',
        desc: '28-day dry-aged Angus ribeye flame-grilled over acacia charcoal, served with roasted bone marrow butter and a side of your choice.',
        price: 3600.0,
        cost: 1400.0,
        prep: 22,
        img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
        flags: JSON.stringify(['Halal', 'Chef Signature']),
        allergens: JSON.stringify(['Dairy']),
        portions: [
          { name: '350g Regular Cut', price: 3600.0, def: 1 },
          { name: '500g Tomahawk Reserve', price: 4900.0, def: 0 },
        ],
        modifiers: [
          {
            name: 'Meat Doneness',
            req: 1, min: 1, max: 1,
            opts: [
              { name: 'Rare', price: 0 },
              { name: 'Medium Rare', price: 0 },
              { name: 'Medium', price: 0 },
              { name: 'Well Done', price: 0 }
            ]
          },
          {
            name: 'Choice of Side',
            req: 1, min: 1, max: 1,
            opts: [
              { name: 'Truffle Parmesan Fries', price: 0 },
              { name: 'Creamy Garlic Mashed Potatoes', price: 0 },
              { name: 'Charred Broccolini', price: 150 }
            ]
          }
        ]
      },
      {
        id: 'itm-truffle-tagliatelle',
        cat: 'cat-mains',
        station: stMain,
        name: 'Handmade Black Truffle & Wild Porcini Tagliatelle',
        desc: 'Handcrafted egg tagliatelle tossed in creamy black truffle emulsion, sautéed porcini mushrooms, 24-month aged Parmigiano-Reggiano and micro-greens.',
        price: 2400.0,
        cost: 720.0,
        prep: 14,
        img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
        flags: JSON.stringify(['Vegetarian', 'Italian Artisanal']),
        allergens: JSON.stringify(['Gluten', 'Dairy', 'Eggs']),
        portions: [],
        modifiers: [
          {
            name: 'Add Protein',
            req: 0, min: 0, max: 1,
            opts: [
              { name: 'Grilled Herb Chicken Strips', price: 450 },
              { name: 'Pan-Seared Jumbo Prawns', price: 850 }
            ]
          }
        ]
      },
      {
        id: 'itm-savannah-sunset',
        cat: 'cat-cocktails',
        station: stBar,
        name: 'The Savannah Sunset Negroni',
        desc: 'Procera African gin, Carpano Antica Formula sweet vermouth, Campari, smoked baobab essence, flamed orange peel.',
        price: 1350.0,
        cost: 380.0,
        prep: 5,
        img: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
        flags: JSON.stringify(['Signature Cocktail', 'Alcoholic']),
        allergens: JSON.stringify([]),
        portions: [],
        modifiers: []
      },
      {
        id: 'itm-passion-dawa',
        cat: 'cat-cocktails',
        station: stBar,
        name: 'Highland Passion Honey Dawa',
        desc: 'Kenyan highland cane spirit, freshly muddled sweet limes, passion fruit pulp and local stingless bee organic honey with traditional wooden dawa stick.',
        price: 1200.0,
        cost: 320.0,
        prep: 4,
        img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
        flags: JSON.stringify(['Kenyan Classic', 'Popular']),
        allergens: JSON.stringify([]),
        portions: [
          { name: 'Classic Cocktail', price: 1200.0, def: 1 },
          { name: 'Virgin Mocktail', price: 750.0, def: 0 },
        ],
        modifiers: []
      }
    ];

    for (const item of items) {
      execute(`
        INSERT OR IGNORE INTO menu_items (id, tenant_id, category_id, outlet_id, station_id, name, description, price, cost_price, image_url, estimated_prep_time, is_available, is_sold_out, is_special, dietary_flags, allergens)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)
      `, [
        item.id, tenant1Id, item.cat, outMainId, item.station,
        item.name, item.desc, item.price, item.cost, item.img,
        item.prep,
        item.flags.includes('Chef Special') ? 1 : 0,
        item.flags, item.allergens
      ]);

      for (const p of item.portions) {
        execute(`
          INSERT OR IGNORE INTO menu_item_portions (id, menu_item_id, name, price, is_default)
          VALUES (?, ?, ?, ?, ?)
        `, [uuidv4(), item.id, p.name, p.price, p.def]);
      }

      for (const mg of item.modifiers) {
        const mgId = uuidv4();
        execute(`
          INSERT OR IGNORE INTO modifier_groups (id, menu_item_id, name, min_selection, max_selection, is_required)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [mgId, item.id, mg.name, mg.min, mg.max, mg.req]);

        for (const opt of mg.opts) {
          execute(`
            INSERT OR IGNORE INTO modifier_options (id, group_id, name, price)
            VALUES (?, ?, ?, ?)
          `, [uuidv4(), mgId, opt.name, opt.price]);
        }
      }
    }

    // Serena Items (Tenant 2 isolated items)
    execute(`
      INSERT OR IGNORE INTO menu_items (id, tenant_id, category_id, outlet_id, station_id, name, description, price, cost_price, image_url, estimated_prep_time, is_available, is_sold_out, is_special, dietary_flags, allergens)
      VALUES 
      ('itm-serena-nyama-choma', ?, 'cat-serena-grill', ?, ?, 'Maasai Mara Goat Nyama Choma Platter', 'Slow roasted seasoned goat ribs over wild olive wood, served with kachumbari and ugali.', 2800.0, 950.0, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', 25, 1, 0, 1, '["Halal","Chef Signature"]', '[]')
    `, [tenant2Id, outSerenaId, stSerenaMain]);

    // 10. INVENTORY INGREDIENTS & RECIPES
    const ingredients = [
      { id: 'ing-beef-angus', name: 'Angus Prime Ribeye (Whole Primal)', code: 'BEEF-001', cat: 'meat', uom: 'kg', stock: 45.0, min: 10.0, cost: 2400.0 },
      { id: 'ing-tagliatelle', name: 'Handmade Egg Pasta Flour', code: 'DRY-002', cat: 'dry_goods', uom: 'kg', stock: 120.0, min: 30.0, cost: 250.0 },
      { id: 'ing-gin-procera', name: 'Procera African Juniper Gin', code: 'ALC-001', cat: 'alcohol', uom: 'bottles', stock: 24.0, min: 6.0, cost: 6800.0 },
    ];

    for (const ing of ingredients) {
      execute(`
        INSERT OR IGNORE INTO inventory_items (id, tenant_id, outlet_id, name, code, category, unit_of_measure, current_stock, min_reorder_level, cost_per_unit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [ing.id, tenant1Id, outMainId, ing.name, ing.code, ing.cat, ing.uom, ing.stock, ing.min, ing.cost]);
    }

    // Recipes
    execute(`
      INSERT OR IGNORE INTO recipes (id, menu_item_id, ingredient_id, quantity_required, unit)
      VALUES 
      ('rec-ribeye-beef', 'itm-ribeye-steak', 'ing-beef-angus', 0.35, 'kg'),
      ('rec-tagliatelle-flour', 'itm-truffle-tagliatelle', 'ing-tagliatelle', 0.20, 'kg'),
      ('rec-negroni-gin', 'itm-savannah-sunset', 'ing-gin-procera', 0.06, 'bottles')
    `, []);

    // 11. MENU SCHEDULES
    execute(`
      INSERT OR IGNORE INTO menu_schedules (id, tenant_id, outlet_id, name, meal_type, start_time, end_time, days_of_week, is_active)
      VALUES 
      (?, ?, ?, 'Morning Artisanal Breakfast', 'breakfast', '06:30', '11:30', '["mon","tue","wed","thu","fri","sat","sun"]', 1),
      (?, ?, ?, 'Gourmet Dinner & Chef Grills', 'dinner', '16:00', '23:30', '["mon","tue","wed","thu","fri","sat","sun"]', 1)
    `, [uuidv4(), tenant1Id, outMainId, uuidv4(), tenant1Id, outMainId]);

    // 12. AUDIT LOG INITIALIZATION
    execute(`
      INSERT OR IGNORE INTO audit_logs (id, tenant_id, user_id, action, resource_type, resource_id, details)
      VALUES (?, NULL, 'usr-saas-super', 'SAAS_PLATFORM_INIT', 'SYSTEM', 'INIT', ?)
    `, [uuidv4(), JSON.stringify({ message: 'PlateIQ Multi-Tenant Platform initialized with 3 tenants and SaaS super admin portal.' })]);
  });

  console.log('Master multi-tenant seed generation complete!');
}
