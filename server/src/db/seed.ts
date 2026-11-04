import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, initDatabase, runInTransaction, execute, queryOne } from './index.js';

export function seedDatabase() {
  initDatabase();

  const existingHotel = queryOne('SELECT id FROM hotels LIMIT 1');
  if (existingHotel) {
    console.log('Database already initialized with seed data.');
    return;
  }

  console.log('Starting master seed generation...');

  runInTransaction(() => {
    // 1. HOTEL
    const hotelId = 'hotel-grand-heritage';
    execute(`
      INSERT INTO hotels (id, name, legal_name, tax_pin, currency, phone, email, address, logo_url, vat_rate, catering_levy_rate, service_charge_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      hotelId,
      'Grand Heritage Hotel & Resort',
      'Grand Heritage Hospitality Ltd',
      'P051239842M',
      'KES',
      '+254 700 123 456',
      'reservations@grandheritagehotel.com',
      'Argwings Kodhek Rd, Kilimani, Nairobi, Kenya',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
      16.0, // 16% VAT
      2.0,  // 2% Catering Levy
      5.0   // 5% Service Charge
    ]);

    // 2. OUTLETS
    const outletMainId = 'outlet-royal-orchid';
    const outletSkylineId = 'outlet-skyline-lounge';

    execute(`
      INSERT INTO outlets (id, hotel_id, name, code, type, is_active, opening_time, closing_time)
      VALUES (?, ?, ?, ?, ?, 1, '06:30', '23:30'), (?, ?, ?, ?, ?, 1, '12:00', '02:00')
    `, [
      outletMainId, hotelId, 'The Royal Orchid Fine Dining', 'ROYAL-ORCHID', 'restaurant',
      outletSkylineId, hotelId, 'Skyline Rooftop Bar & Lounge', 'SKYLINE', 'bar'
    ]);

    // 3. FLOORS & SECTIONS
    const floorGId = 'floor-ground';
    const floorRoofId = 'floor-rooftop';
    execute(`
      INSERT INTO floors (id, outlet_id, name, level, sort_order)
      VALUES (?, ?, 'Ground Floor Dining', 0, 1), (?, ?, '5th Floor Panorama', 5, 2)
    `, [floorGId, outletMainId, floorRoofId, outletSkylineId]);

    const secIndoorId = 'sec-indoor';
    const secGardenId = 'sec-garden';
    const secTerraceId = 'sec-terrace';
    execute(`
      INSERT INTO sections (id, floor_id, name, description)
      VALUES (?, ?, 'Indoor Main Hall', 'Elegant air-conditioned hall'),
             (?, ?, 'Orchid Garden Patio', 'Alfresco garden dining with fountain'),
             (?, ?, 'Panoramic Terrace', 'Open-air views of the city skyline')
    `, [secIndoorId, floorGId, secGardenId, floorGId, secTerraceId, floorRoofId]);

    // 4. KITCHEN STATIONS
    const stMain = 'station-main';
    const stGrill = 'station-grill';
    const stBar = 'station-bar';
    const stDessert = 'station-dessert';
    execute(`
      INSERT INTO kitchen_stations (id, outlet_id, name, code, color_code, is_active)
      VALUES (?, ?, 'Main Hot Kitchen', 'MAIN', '#2563eb', 1),
             (?, ?, 'Charcoal & Smoker Grill', 'GRILL', '#ea580c', 1),
             (?, ?, 'Cocktail & Artisan Bar', 'BAR', '#16a34a', 1),
             (?, ?, 'Pastry & Dessert Studio', 'PASTRY', '#9333ea', 1)
    `, [
      stMain, outletMainId,
      stGrill, outletMainId,
      stBar, outletMainId,
      stDessert, outletMainId
    ]);

    // 5. RESTAURANT TABLES (12 Ground floor, 4 Rooftop)
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
      // Cryptographically random unique token for table QR
      const qrToken = `qr_token_${t.num.toLowerCase()}_${uuidv4().substring(0, 8)}`;
      const outId = t.floor === floorRoofId ? outletSkylineId : outletMainId;
      execute(`
        INSERT INTO restaurant_tables (id, outlet_id, floor_id, section_id, table_number, name, capacity, status, qr_token, pos_x, pos_y, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, 1)
      `, [tableId, outId, t.floor, t.sec, t.num, t.name, t.cap, qrToken, t.x, t.y]);
    }

    // 6. HOTEL ROOMS (For Room Charge & Room Service)
    const rooms = [
      { num: '101', floor: 1, guest: 'Dr. David Kiprop', phone: '+254711223344' },
      { num: '102', floor: 1, guest: 'Sarah Jenkins', phone: '+254722334455' },
      { num: '103', floor: 1, guest: null, phone: null }, // Unoccupied
      { num: '201', floor: 2, guest: 'Hon. Wanjiku Mwangi', phone: '+254733445566' },
      { num: '202', floor: 2, guest: 'Alexandre Moreau', phone: '+254744556677' },
      { num: '501', floor: 5, guest: 'Ambassador Al-Mansoor', phone: '+254755667788' }, // Suite
    ];

    for (const r of rooms) {
      const roomId = `room-${r.num}`;
      execute(`
        INSERT INTO hotel_rooms (id, room_number, floor, guest_name, guest_phone, is_occupied, check_in_date, check_out_date, billing_authorized, verification_pin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `, [
        roomId, r.num, r.floor, r.guest, r.phone,
        r.guest ? 1 : 0,
        r.guest ? '2026-11-01' : null,
        r.guest ? '2026-11-10' : null,
        r.guest ? '1234' : null
      ]);
    }

    // 7. USERS & ROLES
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('Admin@2026!', salt);

    const users = [
      { id: 'usr-admin', name: 'Arthur Pendelton', email: 'admin@hotel.com', role: 'super_admin', outlet: outletMainId, station: null },
      { id: 'usr-manager', name: 'Grace Muthoni', email: 'manager@hotel.com', role: 'restaurant_manager', outlet: outletMainId, station: null },
      { id: 'usr-chef', name: 'Chef Samuel Otieno', email: 'chef@hotel.com', role: 'kitchen_manager', outlet: outletMainId, station: stMain },
      { id: 'usr-grill', name: 'Chef Kelvin Barasa', email: 'grill@hotel.com', role: 'kitchen_staff', outlet: outletMainId, station: stGrill },
      { id: 'usr-bar', name: 'Mixologist Brian Kimani', email: 'bar@hotel.com', role: 'kitchen_staff', outlet: outletMainId, station: stBar },
      { id: 'usr-pastry', name: 'Chef Chloe Dubois', email: 'pastry@hotel.com', role: 'kitchen_staff', outlet: outletMainId, station: stDessert },
      { id: 'usr-runner', name: 'Felix Cheruiyot', email: 'runner@hotel.com', role: 'service_staff', outlet: outletMainId, station: null },
      { id: 'usr-cashier', name: 'Faith Chebet', email: 'cashier@hotel.com', role: 'cashier', outlet: outletMainId, station: null },
      { id: 'usr-accountant', name: 'Patrick Ochieng', email: 'accountant@hotel.com', role: 'accountant', outlet: outletMainId, station: null },
      { id: 'usr-inventory', name: 'Mercy Achieng', email: 'inventory@hotel.com', role: 'inventory_manager', outlet: outletMainId, station: null },
    ];

    for (const u of users) {
      execute(`
        INSERT INTO users (id, name, email, password_hash, role, outlet_id, station_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `, [u.id, u.name, u.email, defaultPasswordHash, u.role, u.outlet, u.station]);
    }

    // 8. MENU CATEGORIES
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
        INSERT INTO menu_categories (id, outlet_id, name, slug, description, icon, sort_order, meal_type, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [c.id, outletMainId, c.name, c.slug, c.desc, c.icon, c.order, c.mealType]);
    }

    // 9. MENU ITEMS & RECIPES
    const items = [
      // Breakfast
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
          { name: 'Executive Platter (Double Sausages & Avocado)', price: 2450.0, def: 0 },
        ],
        modifiers: [
          {
            name: 'Egg Preparation',
            req: 1, min: 1, max: 1,
            opts: [{ name: 'Sunny Side Up', price: 0 }, { name: 'Poached (Soft)', price: 0 }, { name: 'Fluffy Scrambled', price: 0 }, { name: 'Over Easy', price: 0 }]
          },
          {
            name: 'Bread Choice',
            req: 1, min: 1, max: 1,
            opts: [{ name: 'Sourdough Toast', price: 0 }, { name: 'Rye Bread', price: 0 }, { name: 'Gluten-Free Brioche', price: 150 }]
          }
        ]
      },
      {
        id: 'itm-avocado-tartine',
        cat: 'cat-breakfast',
        station: stMain,
        name: 'Smoked Salmon & Avocado Brioche Tartine',
        desc: 'Crushed Hass avocado, Norwegian cured smoked salmon, poached organic egg, hollandaise drizzle, caper berries on toasted brioche.',
        price: 1750.0,
        cost: 580.0,
        prep: 12,
        img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
        flags: JSON.stringify(['Seafood', 'Healthy Choice']),
        allergens: JSON.stringify(['Fish', 'Eggs', 'Gluten', 'Dairy']),
        portions: [],
        modifiers: []
      },
      // Starters
      {
        id: 'itm-chilli-garlic-prawns',
        cat: 'cat-starters',
        station: stMain,
        name: 'Sizzling Kilifi Garlic & Chilli Tiger Prawns',
        desc: 'Jumbo coastal prawns tossed in extra virgin olive oil, garlic butter, bird’s eye chilli, white wine and fresh parsley. Served with warm crusty baguette.',
        price: 2100.0,
        cost: 750.0,
        prep: 12,
        img: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80',
        flags: JSON.stringify(['Coastal Catch', 'Chef Special']),
        allergens: JSON.stringify(['Crustaceans', 'Dairy', 'Gluten']),
        portions: [],
        modifiers: [
          {
            name: 'Spice Level',
            req: 1, min: 1, max: 1,
            opts: [{ name: 'Mild Herb Butter', price: 0 }, { name: 'Medium Swahili Chilli', price: 0 }, { name: 'Extra Spicy Bird-Eye', price: 0 }]
          }
        ]
      },
      // Steaks & Grill
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
              { name: 'Rare (Warm Red Center)', price: 0 },
              { name: 'Medium Rare (Warm Pink Center)', price: 0 },
              { name: 'Medium (Pink Throughout)', price: 0 },
              { name: 'Medium Well (Touch of Pink)', price: 0 },
              { name: 'Well Done (Thoroughly Cooked)', price: 0 }
            ]
          },
          {
            name: 'Choice of Side',
            req: 1, min: 1, max: 1,
            opts: [
              { name: 'Truffle Parmesan Fries', price: 0 },
              { name: 'Creamy Garlic Mashed Potatoes', price: 0 },
              { name: 'Charred Broccolini & Asparagus', price: 150 },
              { name: 'House Garden Salad', price: 0 }
            ]
          },
          {
            name: 'Sauce Selection',
            req: 1, min: 1, max: 1,
            opts: [
              { name: 'Madagascar Green Peppercorn', price: 0 },
              { name: 'Wild Forest Mushroom & Truffle', price: 200 },
              { name: 'Chimichurri Herb Sauce', price: 0 },
              { name: 'Red Wine Reduction Jus', price: 150 }
            ]
          }
        ]
      },
      {
        id: 'itm-lamb-chops',
        cat: 'cat-grill',
        station: stGrill,
        name: 'Rosemary & Garlic Karoo Lamb Chops',
        desc: 'Tender marinated lamb chops, chargrilled medium-rare with mint demi-glace and roasted sweet potato wedges.',
        price: 2950.0,
        cost: 1100.0,
        prep: 18,
        img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
        flags: JSON.stringify(['Halal', 'Chef Special']),
        allergens: JSON.stringify(['Dairy']),
        portions: [],
        modifiers: [
          {
            name: 'Meat Doneness',
            req: 1, min: 1, max: 1,
            opts: [
              { name: 'Medium Rare', price: 0 },
              { name: 'Medium', price: 0 },
              { name: 'Well Done', price: 0 }
            ]
          }
        ]
      },
      // Swahili Specialties
      {
        id: 'itm-swahili-kuku-coconut',
        cat: 'cat-swahili',
        station: stMain,
        name: 'Swahili Kuku wa Kupaka (Coconut Braised Chicken)',
        desc: 'Charcoal grilled free-range chicken quarter simmered in rich spiced coastal coconut cream, turmeric, tamarind and coriander. Served with fragrant steamed saffron jasmine rice.',
        price: 2200.0,
        cost: 680.0,
        prep: 16,
        img: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
        flags: JSON.stringify(['Halal', 'Traditional Specialty']),
        allergens: JSON.stringify([]),
        portions: [],
        modifiers: [
          {
            name: 'Accompaniment Choice',
            req: 1, min: 1, max: 1,
            opts: [
              { name: 'Saffron Jasmine Rice', price: 0 },
              { name: 'Layered Butter Naan (2 pcs)', price: 100 },
              { name: 'Swahili Mahamri (3 pcs)', price: 150 }
            ]
          }
        ]
      },
      {
        id: 'itm-lamu-crab-curry',
        cat: 'cat-swahili',
        station: stMain,
        name: 'Lamu Island Coconut Mangrove Crab Curry',
        desc: 'Fresh Lamu mangrove crab segments gently simmered in fresh ground coconut milk, ginger, garlic, crushed cardamoms and curry leaves.',
        price: 3200.0,
        cost: 1250.0,
        prep: 20,
        img: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80',
        flags: JSON.stringify(['Seafood', 'Gluten-Free']),
        allergens: JSON.stringify(['Crustaceans']),
        portions: [],
        modifiers: []
      },
      // Mains & Pasta
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
            req: 0, min: 0, max: 2,
            opts: [
              { name: 'Grilled Herb Chicken Strips', price: 450 },
              { name: 'Pan-Seared Jumbo Prawns (3 pcs)', price: 850 }
            ]
          }
        ]
      },
      // Cocktails & Drinks
      {
        id: 'itm-savannah-sunset',
        cat: 'cat-cocktails',
        station: stBar,
        name: 'The Savannah Sunset Negroni',
        desc: 'Procera African gin, Carpano Antica Formula sweet vermouth, Campari, smoked baobab essence, flamed orange peel over artisanal ice sphere.',
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
          { name: 'Virgin Mocktail (Zero Alcohol)', price: 750.0, def: 0 },
        ],
        modifiers: []
      },
      // Coffee & Tea
      {
        id: 'itm-kenya-aa-pour-over',
        cat: 'cat-beverages',
        station: stBar,
        name: 'Single Origin Nyeri Hill Kenya AA Pour-Over',
        desc: 'Specialty V60 pour-over showcasing notes of blackcurrant, bright citrus and bergamot from volcanic Nyeri volcanic soils.',
        price: 550.0,
        cost: 110.0,
        prep: 6,
        img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
        flags: JSON.stringify(['Single Origin', 'Barista Reserve']),
        allergens: JSON.stringify([]),
        portions: [],
        modifiers: [
          {
            name: 'Milk Choice',
            req: 0, min: 0, max: 1,
            opts: [
              { name: 'Oat Milk', price: 100 },
              { name: 'Almond Milk', price: 100 },
              { name: 'Fresh Farm Whole Milk', price: 0 }
            ]
          }
        ]
      },
      // Dessert
      {
        id: 'itm-belgian-chocolate-fondant',
        cat: 'cat-dessert',
        station: stDessert,
        name: 'Warm Belgian Dark Chocolate Lava Fondant',
        desc: '70% Valrhona dark chocolate molten cake with a warm flowing center, served with house-churned Tahitian vanilla bean gelato and raspberry coulis.',
        price: 1150.0,
        cost: 340.0,
        prep: 15,
        img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
        flags: JSON.stringify(['Signature Dessert', 'Vegetarian']),
        allergens: JSON.stringify(['Dairy', 'Eggs', 'Gluten']),
        portions: [],
        modifiers: []
      }
    ];

    for (const item of items) {
      execute(`
        INSERT INTO menu_items (id, category_id, outlet_id, station_id, name, description, price, cost_price, image_url, estimated_prep_time, is_available, is_sold_out, is_special, dietary_flags, allergens)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)
      `, [
        item.id, item.cat, outletMainId, item.station,
        item.name, item.desc, item.price, item.cost, item.img,
        item.prep,
        item.flags.includes('Chef Special') ? 1 : 0,
        item.flags, item.allergens
      ]);

      // Portions
      for (const p of item.portions) {
        execute(`
          INSERT INTO menu_item_portions (id, menu_item_id, name, price, is_default)
          VALUES (?, ?, ?, ?, ?)
        `, [uuidv4(), item.id, p.name, p.price, p.def]);
      }

      // Modifiers
      for (const mg of item.modifiers) {
        const mgId = uuidv4();
        execute(`
          INSERT INTO modifier_groups (id, menu_item_id, name, min_selection, max_selection, is_required)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [mgId, item.id, mg.name, mg.min, mg.max, mg.req]);

        for (const opt of mg.opts) {
          execute(`
            INSERT INTO modifier_options (id, group_id, name, price)
            VALUES (?, ?, ?, ?)
          `, [uuidv4(), mgId, opt.name, opt.price]);
        }
      }
    }

    // 10. INVENTORY INGREDIENTS & RECIPES
    const ingredients = [
      { id: 'ing-beef-angus', name: 'Angus Prime Ribeye (Whole Primal)', code: 'BEEF-001', cat: 'meat', uom: 'kg', stock: 45.0, min: 10.0, cost: 2400.0 },
      { id: 'ing-prawns-tiger', name: 'Kilifi Jumbo Tiger Prawns (Headless)', code: 'SEAF-001', cat: 'produce', uom: 'kg', stock: 28.5, min: 8.0, cost: 2200.0 },
      { id: 'ing-chicken-breast', name: 'Organic Free-Range Chicken', code: 'POUL-001', cat: 'poultry', uom: 'kg', stock: 60.0, min: 15.0, cost: 850.0 },
      { id: 'ing-lamb-chops', name: 'Karoo Fresh Lamb Racks', code: 'MEAT-002', cat: 'meat', uom: 'kg', stock: 22.0, min: 6.0, cost: 2100.0 },
      { id: 'ing-coconut-cream', name: 'Fresh Coastal Coconut Cream', code: 'DRY-001', cat: 'produce', uom: 'L', stock: 85.0, min: 20.0, cost: 320.0 },
      { id: 'ing-tagliatelle', name: 'Handmade Egg Pasta Flour & Semolina', code: 'DRY-002', cat: 'dry_goods', uom: 'kg', stock: 120.0, min: 30.0, cost: 250.0 },
      { id: 'ing-parmesan', name: '24-Month Parmigiano Reggiano', code: 'DAIR-001', cat: 'dairy', uom: 'kg', stock: 18.0, min: 5.0, cost: 3800.0 },
      { id: 'ing-truffle-oil', name: 'White & Black Truffle Essence Oil', code: 'COND-001', cat: 'dry_goods', uom: 'L', stock: 6.5, min: 2.0, cost: 7500.0 },
      { id: 'ing-chocolate-valrhona', name: 'Valrhona 70% Dark Chocolate', code: 'BAKE-001', cat: 'dry_goods', uom: 'kg', stock: 25.0, min: 8.0, cost: 3200.0 },
      { id: 'ing-gin-procera', name: 'Procera African Juniper Gin', code: 'ALC-001', cat: 'alcohol', uom: 'bottles', stock: 24.0, min: 6.0, cost: 6800.0 },
      { id: 'ing-coffee-nyeri', name: 'Nyeri Hill Kenya AA Green Beans (Roasted)', code: 'BEV-001', cat: 'beverages', uom: 'kg', stock: 40.0, min: 10.0, cost: 1800.0 },
      { id: 'ing-honey-organic', name: 'Highland Stingless Bee Wild Honey', code: 'DRY-003', cat: 'dry_goods', uom: 'kg', stock: 35.0, min: 10.0, cost: 1400.0 },
    ];

    for (const ing of ingredients) {
      execute(`
        INSERT INTO inventory_items (id, outlet_id, name, code, category, unit_of_measure, current_stock, min_reorder_level, cost_per_unit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [ing.id, outletMainId, ing.name, ing.code, ing.cat, ing.uom, ing.stock, ing.min, ing.cost]);
    }

    // Bill of Materials (Recipes linking menu items to ingredients for deduction)
    const recipesData = [
      // Ribeye steak: consumes 0.35kg angus beef
      { item: 'itm-ribeye-steak', ing: 'ing-beef-angus', qty: 0.35, unit: 'kg' },
      // Garlic prawns: consumes 0.25kg prawns
      { item: 'itm-chilli-garlic-prawns', ing: 'ing-prawns-tiger', qty: 0.25, unit: 'kg' },
      // Swahili chicken: consumes 0.4kg chicken, 0.2L coconut cream
      { item: 'itm-swahili-kuku-coconut', ing: 'ing-chicken-breast', qty: 0.40, unit: 'kg' },
      { item: 'itm-swahili-kuku-coconut', ing: 'ing-coconut-cream', qty: 0.20, unit: 'L' },
      // Lamb chops: consumes 0.35kg lamb
      { item: 'itm-lamb-chops', ing: 'ing-lamb-chops', qty: 0.35, unit: 'kg' },
      // Truffle tagliatelle: consumes 0.2kg pasta, 0.05kg parmesan, 0.01L truffle oil
      { item: 'itm-truffle-tagliatelle', ing: 'ing-tagliatelle', qty: 0.20, unit: 'kg' },
      { item: 'itm-truffle-tagliatelle', ing: 'ing-parmesan', qty: 0.05, unit: 'kg' },
      { item: 'itm-truffle-tagliatelle', ing: 'ing-truffle-oil', qty: 0.01, unit: 'L' },
      // Negroni: consumes 0.06 bottle gin
      { item: 'itm-savannah-sunset', ing: 'ing-gin-procera', qty: 0.06, unit: 'bottles' },
      // Coffee: consumes 0.02kg coffee
      { item: 'itm-kenya-aa-pour-over', ing: 'ing-coffee-nyeri', qty: 0.02, unit: 'kg' },
      // Chocolate fondant: consumes 0.12kg chocolate
      { item: 'itm-belgian-chocolate-fondant', ing: 'ing-chocolate-valrhona', qty: 0.12, unit: 'kg' },
    ];

    for (const r of recipesData) {
      execute(`
        INSERT INTO recipes (id, menu_item_id, ingredient_id, quantity_required, unit)
        VALUES (?, ?, ?, ?, ?)
      `, [uuidv4(), r.item, r.ing, r.qty, r.unit]);
    }

    // 11. MENU SCHEDULES
    execute(`
      INSERT INTO menu_schedules (id, outlet_id, name, meal_type, start_time, end_time, days_of_week, is_active)
      VALUES (?, ?, 'Morning Artisanal Breakfast', 'breakfast', '06:30', '11:30', '["mon","tue","wed","thu","fri","sat","sun"]', 1),
             (?, ?, 'Lunch Specials & Light Fare', 'lunch', '11:30', '16:00', '["mon","tue","wed","thu","fri","sat","sun"]', 1),
             (?, ?, 'Gourmet Dinner & Chef Grills', 'dinner', '16:00', '23:30', '["mon","tue","wed","thu","fri","sat","sun"]', 1),
             (?, ?, 'Skyline Sunset Cocktail Hour', 'happy_hour', '17:00', '19:30', '["mon","tue","wed","thu","fri"]', 1)
    `, [uuidv4(), outletMainId, uuidv4(), outletMainId, uuidv4(), outletMainId, uuidv4(), outletSkylineId]);

    // 12. AUDIT LOG INITIALIZATION
    execute(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details)
      VALUES (?, ?, 'SYSTEM_SEED', 'SYSTEM', 'INIT', ?)
    `, [uuidv4(), 'usr-admin', JSON.stringify({ message: 'Master system seed generated with 16 tables, 4 stations, 8 categories, inventory and hotel rooms' })]);
  });

  console.log('Master seed generation complete!');
}
