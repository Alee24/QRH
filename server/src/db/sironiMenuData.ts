import { execute, queryOne, queryAll } from './index.js';
import { v4 as uuidv4 } from 'uuid';

export interface SironiItemDef {
  id: string;
  catId: string;
  stationId: string;
  name: string;
  desc: string;
  price: number;
  cost: number;
  prep: number;
  img: string;
  flags: string[];
  allergens: string[];
  spices?: string[];
  portions?: { name: string; price: number; isDefault: boolean }[];
  modifiers?: {
    name: string;
    isRequired: boolean;
    minSelection: number;
    maxSelection: number;
    options: { name: string; price: number }[];
  }[];
}

export const SIRONI_MENU_ITEMS: SironiItemDef[] = [
  // 1. GOURMET BREAKFAST
  {
    id: 'itm-sironi-breakfast',
    catId: 'cat-breakfast',
    stationId: 'station-main',
    name: 'Sironi Signature Big Breakfast',
    desc: 'Two farm eggs cooked to your style, grilled beef boerewors sausages, crispy bacon, grilled halloumi, baked beans, herb-roasted roma tomatoes and artisanal sourdough toast.',
    price: 1650.0,
    cost: 580.0,
    prep: 15,
    img: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
    flags: ['Chef Special', 'Popular', 'Halal'],
    allergens: ['Eggs', 'Gluten', 'Dairy'],
    spices: ['Mild', 'Medium', 'Hot'],
    portions: [
      { name: 'Standard Full Plate', price: 1650.0, isDefault: true },
      { name: 'Executive Double Cut', price: 2250.0, isDefault: false },
    ],
    modifiers: [
      {
        name: 'Egg Preparation',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Sunny Side Up', price: 0 },
          { name: 'Poached (Soft)', price: 0 },
          { name: 'Fluffy Scrambled', price: 0 },
          { name: 'Spanish Herb Omelette', price: 100 }
        ]
      },
      {
        name: 'Choice of Bread',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Artisanal Sourdough', price: 0 },
          { name: 'Brioche Toast', price: 50 },
          { name: 'Gluten-Free Seeded Toast', price: 100 }
        ]
      }
    ]
  },
  {
    id: 'itm-avo-toast',
    catId: 'cat-breakfast',
    stationId: 'station-main',
    name: 'Avocado Sourdough Toast & Poached Eggs',
    desc: 'Crushed ripe Hass avocado, Danish creamy feta crumble, organic dukkah crunch, chili flakes, two soft poached eggs on grilled rustic sourdough.',
    price: 1250.0,
    cost: 380.0,
    prep: 12,
    img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    flags: ['Vegetarian', 'Healthy'],
    allergens: ['Eggs', 'Gluten', 'Dairy', 'Nuts'],
    modifiers: [
      {
        name: 'Gourmet Add-ons',
        isRequired: false,
        minSelection: 0,
        maxSelection: 3,
        options: [
          { name: 'Crispy Smoked Bacon', price: 350 },
          { name: 'Smoked Salmon Roses', price: 550 },
          { name: 'Grilled Cypriot Halloumi', price: 300 }
        ]
      }
    ]
  },
  {
    id: 'itm-pancake-stack',
    catId: 'cat-breakfast',
    stationId: 'station-main',
    name: 'Fluffy Buttermilk & Wild Berry Pancake Stack',
    desc: 'Triple fluffy golden pancakes, whipped Madagascar vanilla cream, organic Kenyan acacia honey, wild forest berry compote and toasted almond flakes.',
    price: 1150.0,
    cost: 320.0,
    prep: 14,
    img: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80',
    flags: ['Vegetarian', 'Popular'],
    allergens: ['Gluten', 'Dairy', 'Eggs', 'Nuts'],
    modifiers: [
      {
        name: 'Syrup Selection',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Organic Acacia Honey', price: 0 },
          { name: 'Pure Canadian Maple Syrup', price: 150 },
          { name: 'Warm Salted Caramel Drizzle', price: 100 }
        ]
      }
    ]
  },

  // 2. STARTERS & SMALL PLATES
  {
    id: 'itm-tiger-prawns',
    catId: 'cat-starters',
    stationId: 'station-main',
    name: 'Charred Garlic Butter Tiger Prawns',
    desc: 'Fresh Kilifi coast jumbo tiger prawns seared in garlic herb butter, smoked chili oil, lemon zest, served with toasted sourdough crusts.',
    price: 1850.0,
    cost: 720.0,
    prep: 12,
    img: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80',
    flags: ['Seafood', 'Chef Special', 'Halal'],
    allergens: ['Shellfish', 'Dairy', 'Gluten'],
    portions: [
      { name: 'Regular Portion (6 pcs)', price: 1850.0, isDefault: true },
      { name: 'Grand Sharing (12 pcs)', price: 3400.0, isDefault: false }
    ],
    modifiers: [
      {
        name: 'Heat Level',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Mild Herb Butter', price: 0 },
          { name: 'Spicy Piri-Piri', price: 0 },
          { name: 'Fiery Habanero Glaze', price: 0 }
        ]
      }
    ]
  },
  {
    id: 'itm-calamari-fritti',
    catId: 'cat-starters',
    stationId: 'station-main',
    name: 'Crispy Calamari Fritti',
    desc: 'Tender baby squid rings dusted in seasoned semolina crust, smoked paprika lime aioli and pickled red jalapeños.',
    price: 1450.0,
    cost: 490.0,
    prep: 10,
    img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
    flags: ['Seafood', 'Popular'],
    allergens: ['Shellfish', 'Eggs', 'Gluten'],
    modifiers: [
      {
        name: 'Dipping Sauce',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Smoked Paprika Lime Aioli', price: 0 },
          { name: 'Sweet Chili Tartar', price: 0 },
          { name: 'Garlic Parmesan Dip', price: 50 }
        ]
      }
    ]
  },
  {
    id: 'itm-bone-marrow',
    catId: 'cat-starters',
    stationId: 'station-main',
    name: 'Charcoal Roasted Bone Marrow',
    desc: 'Split beef marrow bones roasted over acacia embers, caper herb chimichurri, flaked Maldon salt and grilled sourdough crostini.',
    price: 1350.0,
    cost: 420.0,
    prep: 16,
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    flags: ['Chef Special', 'Halal'],
    allergens: ['Gluten']
  },
  {
    id: 'itm-truffle-arancini',
    catId: 'cat-starters',
    stationId: 'station-main',
    name: 'Truffle & Mozzarella Arancini (4 pcs)',
    desc: 'Golden crispy wild mushroom risotto croquettes with a molten mozzarella core, served over rich black truffle emulsion.',
    price: 1200.0,
    cost: 360.0,
    prep: 10,
    img: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80',
    flags: ['Vegetarian'],
    allergens: ['Dairy', 'Gluten']
  },

  // 3. PRIME GRILL & STEAKS
  {
    id: 'itm-ribeye-steak',
    catId: 'cat-grill',
    stationId: 'station-grill',
    name: 'Prime Aged Angus Ribeye Steak (350g)',
    desc: '28-day dry-aged Angus ribeye flame-grilled over acacia charcoal, served with roasted bone marrow herb butter and a side of your choice.',
    price: 3600.0,
    cost: 1400.0,
    prep: 22,
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    flags: ['Halal', 'Chef Special', 'Popular'],
    allergens: ['Dairy'],
    portions: [
      { name: '350g Regular Cut', price: 3600.0, isDefault: true },
      { name: '500g Tomahawk Reserve', price: 4900.0, isDefault: false },
    ],
    modifiers: [
      {
        name: 'Steak Doneness',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Rare', price: 0 },
          { name: 'Medium Rare (Recommended)', price: 0 },
          { name: 'Medium', price: 0 },
          { name: 'Medium Well', price: 0 },
          { name: 'Well Done', price: 0 }
        ]
      },
      {
        name: 'Choice of Steak Sauce',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Madagascar Green Peppercorn Jus', price: 0 },
          { name: 'Wild Mushroom Truffle Sauce', price: 0 },
          { name: 'House Fresh Herb Chimichurri', price: 0 },
          { name: 'Garlic Confit Herb Butter', price: 0 }
        ]
      },
      {
        name: 'Choice of Side',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Truffle Parmesan Fries', price: 0 },
          { name: 'Creamy Garlic Mashed Potatoes', price: 0 },
          { name: 'Charred Broccolini', price: 150 },
          { name: 'Sironi Organic Garden Salad', price: 0 }
        ]
      }
    ]
  },
  {
    id: 'itm-tomahawk-steak',
    catId: 'cat-grill',
    stationId: 'station-grill',
    name: 'Sironi Flame-Grilled Tomahawk Steak (800g Shareable)',
    desc: 'Showstopper 45-day dry-aged bone-in Tomahawk steak carved tableside, rosemary garlic butter baste, flaked sea salt, two premium sides.',
    price: 6800.0,
    cost: 2600.0,
    prep: 30,
    img: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80',
    flags: ['Chef Special', 'Halal', 'Popular'],
    allergens: ['Dairy'],
    modifiers: [
      {
        name: 'Steak Doneness',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Medium Rare (Chef Preferred)', price: 0 },
          { name: 'Medium', price: 0 },
          { name: 'Medium Well', price: 0 },
          { name: 'Well Done', price: 0 }
        ]
      },
      {
        name: 'Sauce Selection',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Chimichurri & Peppercorn Duo', price: 0 },
          { name: 'Double Truffle Mushroom Jus', price: 150 }
        ]
      }
    ]
  },
  {
    id: 'itm-lamb-chops',
    catId: 'cat-grill',
    stationId: 'station-grill',
    name: 'Succulent BBQ Lamb Chops (4 pcs)',
    desc: 'Char-grilled Kenyan highland lamb cutlets crusted with fresh mint and za\'atar, sweet potato purée, rosemary lamb reduction.',
    price: 2850.0,
    cost: 1100.0,
    prep: 20,
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    flags: ['Halal', 'Gluten-Free', 'Popular'],
    allergens: ['Dairy'],
    modifiers: [
      {
        name: 'Meat Doneness',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Medium Pink (Juicy)', price: 0 },
          { name: 'Well Done', price: 0 }
        ]
      }
    ]
  },
  {
    id: 'itm-spatchcock-chicken',
    catId: 'cat-grill',
    stationId: 'station-grill',
    name: 'Woodfired Half Peri-Peri Spatchcock Chicken',
    desc: 'Farm-raised young chicken marinated 24 hours in citrus, smoked paprika, garlic & African bird\'s eye chili, roasted over open charcoal embers.',
    price: 2100.0,
    cost: 750.0,
    prep: 20,
    img: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80',
    flags: ['Halal', 'Popular'],
    allergens: [],
    modifiers: [
      {
        name: 'Peri-Peri Heat',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Lemon & Garlic Herb (Mild)', price: 0 },
          { name: 'Medium Peri-Peri (Balanced)', price: 0 },
          { name: 'Extra Hot African Birdseye', price: 0 }
        ]
      }
    ]
  },

  // 4. SWAHILI & COAST DELICACIES
  {
    id: 'itm-samaki-kupaka',
    catId: 'cat-swahili',
    stationId: 'station-main',
    name: 'Swahili Coconut Fish Curry (Samaki wa Kupaka)',
    desc: 'Fresh wild red snapper fillet grilled over coconut husks, smothered in rich tamarind coconut cream reduction, served with aromatic pilau rice.',
    price: 2200.0,
    cost: 820.0,
    prep: 20,
    img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80',
    flags: ['Seafood', 'Halal', 'Chef Special'],
    allergens: ['Fish'],
    modifiers: [
      {
        name: 'Accompaniment',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Aromatic Swahili Pilau Rice', price: 0 },
          { name: 'Steamed Coconut Rice', price: 0 },
          { name: 'Layered Soft Chapatis (2 pcs)', price: 0 }
        ]
      }
    ]
  },
  {
    id: 'itm-goat-biryani',
    catId: 'cat-swahili',
    stationId: 'station-main',
    name: 'Slow-Cooked Goat Biryani (Nairobi Special)',
    desc: 'Aged long-grain fragrant basmati rice layered with tender spiced goat shoulder, caramelized shallots, boiled egg, served with fresh cucumber raita.',
    price: 1750.0,
    cost: 650.0,
    prep: 15,
    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    flags: ['Halal', 'Popular'],
    allergens: ['Dairy', 'Eggs']
  },
  {
    id: 'itm-zanzibar-seafood',
    catId: 'cat-swahili',
    stationId: 'station-main',
    name: 'Zanzibar Seafood Mixed Platter',
    desc: 'Grilled lobster tail, jumbo tiger prawns, calamari, and line-caught red snapper tossed in garlic ginger lime butter, served with coconut saffron rice.',
    price: 4500.0,
    cost: 1800.0,
    prep: 25,
    img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
    flags: ['Seafood', 'Halal', 'Chef Special'],
    allergens: ['Shellfish', 'Fish', 'Dairy']
  },

  // 5. ARTISAN MAINS & PASTA
  {
    id: 'itm-truffle-tagliatelle',
    catId: 'cat-mains',
    stationId: 'station-main',
    name: 'Handmade Black Truffle & Wild Porcini Tagliatelle',
    desc: 'Handcrafted egg tagliatelle tossed in creamy black truffle emulsion, sautéed porcini mushrooms, 24-month aged Parmigiano-Reggiano and micro-greens.',
    price: 2400.0,
    cost: 720.0,
    prep: 14,
    img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
    flags: ['Vegetarian', 'Chef Special'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    modifiers: [
      {
        name: 'Add Protein',
        isRequired: false,
        minSelection: 0,
        maxSelection: 1,
        options: [
          { name: 'Grilled Herb Chicken Strips', price: 450 },
          { name: 'Pan-Seared Jumbo Tiger Prawns', price: 850 }
        ]
      }
    ]
  },
  {
    id: 'itm-wagyu-burger',
    catId: 'cat-mains',
    stationId: 'station-main',
    name: 'Sironi Gourmet Wagyu Smash Burger',
    desc: 'Double Wagyu beef patties, melted sharp cheddar, smoked bacon jam, caramelized balsamic onions, truffle mayo on toasted brioche bun, served with fries.',
    price: 1950.0,
    cost: 680.0,
    prep: 15,
    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    flags: ['Halal', 'Popular'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    portions: [
      { name: 'Double Patty (Standard)', price: 1950.0, isDefault: true },
      { name: 'Triple Patty Beast', price: 2450.0, isDefault: false }
    ],
    modifiers: [
      {
        name: 'Side Selection',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Rustic Skin-on French Fries', price: 0 },
          { name: 'Crispy Sweet Potato Fries', price: 100 },
          { name: 'Golden Beer Battered Onion Rings', price: 100 }
        ]
      }
    ]
  },
  {
    id: 'itm-short-rib-pappardelle',
    catId: 'cat-mains',
    stationId: 'station-main',
    name: 'Braised Angus Short Rib Pappardelle',
    desc: '12-hour slow-braised beef short rib ragù, San Marzano plum tomatoes, fresh rosemary, tossed with broad ribbon pappardelle and shaved pecorino.',
    price: 2350.0,
    cost: 850.0,
    prep: 15,
    img: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80',
    flags: ['Halal'],
    allergens: ['Gluten', 'Dairy', 'Eggs']
  },

  // 6. COCKTAILS & SPIRITS
  {
    id: 'itm-savannah-sunset',
    catId: 'cat-cocktails',
    stationId: 'station-bar',
    name: 'The Savannah Sunset Negroni',
    desc: 'Procera African gin, Carpano Antica Formula sweet vermouth, Campari, smoked baobab essence, flamed orange peel.',
    price: 1350.0,
    cost: 380.0,
    prep: 5,
    img: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
    flags: ['Chef Special', 'Popular'],
    allergens: []
  },
  {
    id: 'itm-passion-dawa',
    catId: 'cat-cocktails',
    stationId: 'station-bar',
    name: 'Highland Passion Honey Dawa',
    desc: 'Kenyan highland cane spirit, freshly muddled sweet limes, passion fruit pulp and local stingless bee organic honey with traditional wooden dawa stick.',
    price: 1200.0,
    cost: 320.0,
    prep: 4,
    img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    flags: ['Popular'],
    allergens: [],
    portions: [
      { name: 'Spirited Cane Cocktail', price: 1200.0, isDefault: true },
      { name: 'Virgin Passion Dawa Mocktail', price: 750.0, isDefault: false }
    ]
  },
  {
    id: 'itm-rosemary-old-fashioned',
    catId: 'cat-cocktails',
    stationId: 'station-bar',
    name: 'Smoked Rosemary Old Fashioned',
    desc: 'Woodford Reserve bourbon, Angostura aromatic bitters, organic raw demerara syrup, smoked rosemary cloud served over clear ice rock.',
    price: 1400.0,
    cost: 450.0,
    prep: 5,
    img: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
    flags: ['Chef Special'],
    allergens: []
  },
  {
    id: 'itm-coconut-mojito',
    catId: 'cat-cocktails',
    stationId: 'station-bar',
    name: 'Kilifi Coast Coconut Mojito',
    desc: 'White rum, freshly pressed coconut milk, muddled fresh mint, raw sugar, fresh lime juice and a dash of sparkling club soda.',
    price: 1150.0,
    cost: 290.0,
    prep: 4,
    img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    flags: ['Popular'],
    allergens: [],
    portions: [
      { name: 'Spirited Rum Mojito', price: 1150.0, isDefault: true },
      { name: 'Virgin Coconut Mocktail', price: 650.0, isDefault: false }
    ]
  },

  // 7. SPECIALTY COFFEE & TEAS
  {
    id: 'itm-kenyan-flat-white',
    catId: 'cat-beverages',
    stationId: 'station-bar',
    name: 'Single-Origin Nyeri Peaberry Flat White',
    desc: 'Double shot of artisan Kenyan Nyeri AA peaberry espresso topped with velvety micro-foamed silky whole milk.',
    price: 450.0,
    cost: 110.0,
    prep: 4,
    img: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=600&q=80',
    flags: ['Popular'],
    allergens: ['Dairy'],
    modifiers: [
      {
        name: 'Milk Preference',
        isRequired: true,
        minSelection: 1,
        maxSelection: 1,
        options: [
          { name: 'Fresh Farm Whole Milk', price: 0 },
          { name: 'Creamy Oat Milk', price: 100 },
          { name: 'Roasted Almond Milk', price: 100 }
        ]
      }
    ]
  },
  {
    id: 'itm-masala-chai',
    catId: 'cat-beverages',
    stationId: 'station-bar',
    name: 'Artisanal Kericho Masala Spiced Chai',
    desc: 'Slow-brewed black tea leaves from Kericho highlands simmered with fresh crushed ginger root, green cardamom, cinnamon quills and cloves in rich whole milk.',
    price: 400.0,
    cost: 85.0,
    prep: 5,
    img: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    flags: ['Popular'],
    allergens: ['Dairy']
  },
  {
    id: 'itm-tropical-detox',
    catId: 'cat-beverages',
    stationId: 'station-bar',
    name: 'Fresh Cold-Pressed Tropical Detox Juice',
    desc: '100% pure cold-pressed juice of sweet pineapples, fresh passion fruit pulp, raw ginger root and garden mint. Pure fruit with zero added sugars.',
    price: 550.0,
    cost: 140.0,
    prep: 3,
    img: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=600&q=80',
    flags: ['Healthy', 'Vegetarian', 'Gluten-Free'],
    allergens: []
  },

  // 8. ARTISANAL DESSERTS
  {
    id: 'itm-choco-fondant',
    catId: 'cat-dessert',
    stationId: 'station-dessert',
    name: 'Warm Belgian Dark Chocolate Lava Fondant',
    desc: 'Rich 70% Callebaut dark chocolate cake with a warm flowing molten center, served with salted caramel artisanal gelato and roasted hazelnut crumble.',
    price: 1100.0,
    cost: 320.0,
    prep: 12,
    img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    flags: ['Chef Special', 'Popular'],
    allergens: ['Dairy', 'Eggs', 'Gluten', 'Nuts']
  },
  {
    id: 'itm-creme-brulee',
    catId: 'cat-dessert',
    stationId: 'station-dessert',
    name: 'Madagascar Vanilla Bean Crème Brûlée',
    desc: 'Silky baked rich egg custard infused with pure Madagascar vanilla pods, topped with a crisp torched caramel shell and wild berries.',
    price: 950.0,
    cost: 260.0,
    prep: 8,
    img: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?auto=format&fit=crop&w=600&q=80',
    flags: ['Gluten-Free'],
    allergens: ['Dairy', 'Eggs']
  },
  {
    id: 'itm-espresso-tiramisu',
    catId: 'cat-dessert',
    stationId: 'station-dessert',
    name: 'Classic Espresso Tiramisu al Mascarpone',
    desc: 'House-baked ladyfinger biscuits dipped in robust espresso and Kahlúa, layered with velvety mascarpone zabaglione and dusted with Dutch cocoa.',
    price: 1050.0,
    cost: 290.0,
    prep: 5,
    img: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
    flags: ['Popular'],
    allergens: ['Dairy', 'Gluten', 'Eggs']
  }
];

/**
 * Ensures Sironi Restaurants menu items are fully populated in SQLite.
 * This runs idempotently on server start so that live and demo modes
 * both have access to complete dishes with portions, modifiers, and categories.
 */
export function ensureSironiMenuItems(tenantId: string = 'tenant-grand-heritage', outletId: string = 'outlet-royal-orchid') {
  console.log(`[SironiMenu] Verifying and provisioning Sironi menu items for tenant ${tenantId}...`);

  for (const item of SIRONI_MENU_ITEMS) {
    const existing = queryOne('SELECT id FROM menu_items WHERE id = ?', [item.id]);

    const flagsJson = JSON.stringify(item.flags);
    const allergensJson = JSON.stringify(item.allergens);
    const spicesJson = JSON.stringify(item.spices || ['Mild', 'Medium', 'Hot', 'Extra Spicy']);

    if (!existing) {
      execute(`
        INSERT INTO menu_items (
          id, tenant_id, category_id, outlet_id, station_id,
          name, description, price, cost_price, image_url,
          estimated_prep_time, is_available, is_sold_out, is_special,
          dietary_flags, allergens, spices_json, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, 0)
      `, [
        item.id, tenantId, item.catId, outletId, item.stationId,
        item.name, item.desc, item.price, item.cost, item.img,
        item.prep,
        item.flags.includes('Chef Special') ? 1 : 0,
        flagsJson, allergensJson, spicesJson
      ]);
    } else {
      // Ensure it is live, available, and has correct details
      execute(`
        UPDATE menu_items SET
          tenant_id = ?, category_id = ?, outlet_id = ?, station_id = ?,
          name = ?, description = ?, price = ?, cost_price = ?, image_url = ?,
          estimated_prep_time = ?, is_available = 1, is_sold_out = 0,
          is_special = ?, dietary_flags = ?, allergens = ?, spices_json = ?, is_demo = 0
        WHERE id = ?
      `, [
        tenantId, item.catId, outletId, item.stationId,
        item.name, item.desc, item.price, item.cost, item.img,
        item.prep,
        item.flags.includes('Chef Special') ? 1 : 0,
        flagsJson, allergensJson, spicesJson,
        item.id
      ]);
    }

    // Provision Portions
    if (item.portions && item.portions.length > 0) {
      execute('DELETE FROM menu_item_portions WHERE menu_item_id = ?', [item.id]);
      for (const p of item.portions) {
        execute(`
          INSERT INTO menu_item_portions (id, menu_item_id, name, price, is_default)
          VALUES (?, ?, ?, ?, ?)
        `, [uuidv4(), item.id, p.name, p.price, p.isDefault ? 1 : 0]);
      }
    }

    // Provision Modifiers
    if (item.modifiers && item.modifiers.length > 0) {
      const existingGroups = queryAll('SELECT id FROM modifier_groups WHERE menu_item_id = ?', [item.id]);
      for (const g of existingGroups) {
        execute('DELETE FROM modifier_options WHERE group_id = ?', [g.id]);
      }
      execute('DELETE FROM modifier_groups WHERE menu_item_id = ?', [item.id]);

      for (const mg of item.modifiers) {
        const mgId = uuidv4();
        execute(`
          INSERT INTO modifier_groups (id, menu_item_id, name, min_selection, max_selection, is_required)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [mgId, item.id, mg.name, mg.minSelection, mg.maxSelection, mg.isRequired ? 1 : 0]);

        for (const opt of mg.options) {
          execute(`
            INSERT INTO modifier_options (id, group_id, name, price)
            VALUES (?, ?, ?, ?)
          `, [uuidv4(), mgId, opt.name, opt.price]);
        }
      }
    }
  }

  // Also convert any other existing items with is_demo = 1 to is_demo = 0 so nothing is hidden
  execute('UPDATE menu_items SET is_demo = 0, is_available = 1 WHERE is_demo = 1');

  const count = queryOne('SELECT count(*) as total FROM menu_items WHERE is_available = 1');
  console.log(`[SironiMenu] Complete! Total active menu items available: ${count?.total}`);
}

