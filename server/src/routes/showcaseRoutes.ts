import { Router } from 'express';
import { queryOne, queryAll } from '../db/index.js';

export const showcaseRouter = Router();

// 1. Public: Get All Active Subscriber Hotels for Main Showcase Directory
showcaseRouter.get('/hotels', (req, res) => {
  const tenants = queryAll(`
    SELECT 
      t.id as tenant_id,
      t.name,
      t.slug,
      t.custom_domain,
      t.status,
      sp.name as plan_name,
      tb.brand_name,
      tb.logo_url as custom_logo,
      tb.primary_color,
      tb.accent_color,
      h.address,
      h.phone,
      h.email,
      h.currency,
      (SELECT COUNT(*) FROM outlets WHERE tenant_id = t.id AND is_active = 1) as outlet_count,
      (SELECT COUNT(*) FROM menu_items WHERE tenant_id = t.id AND is_available = 1) as item_count,
      (SELECT qr_token FROM restaurant_tables WHERE tenant_id = t.id AND is_active = 1 LIMIT 1) as sample_table_token
    FROM tenants t
    JOIN subscription_plans sp ON t.plan_id = sp.id
    LEFT JOIN tenant_branding tb ON tb.tenant_id = t.id
    LEFT JOIN hotels h ON h.tenant_id = t.id
    WHERE t.status = 'active'
    ORDER BY t.created_at ASC
  `);

  // Rich metadata for each subscriber property
  const enriched = tenants.map((t) => {
    let heroImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
    let tagline = 'Luxury Fine Dining & Artisanal Hospitality';
    let cuisine = 'Contemporary Continental & Swahili Coast';

    if (t.slug.includes('serena')) {
      heroImage = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80';
      tagline = 'Untamed Luxury Overlooking the Mara Plains';
      cuisine = 'Acacia Charcoal Grills & Safari Dining';
    } else if (t.slug.includes('carnivore')) {
      heroImage = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80';
      tagline = 'Legendary Open-Fire Smoked Meats & Steaks';
      cuisine = 'Smoked Ribs, BBQ & Craft Ales';
    }

    return {
      ...t,
      hero_image: heroImage,
      tagline,
      cuisine,
      subdomain: `${t.slug}.plateiq.cloud`,
      showcase_url: `/h/${t.slug}`,
    };
  });

  res.json(enriched);
});

// 2. Public: Get Specific Hotel Subscriber Details & The Day's Scheduled Menu
showcaseRouter.get('/hotel/:slug', (req, res) => {
  const { slug } = req.params;

  const tenant = queryOne(`
    SELECT 
      t.id as tenant_id,
      t.name,
      t.slug,
      t.custom_domain,
      t.status,
      sp.name as plan_name,
      tb.brand_name,
      tb.logo_url as custom_logo,
      tb.primary_color,
      tb.secondary_color,
      tb.accent_color,
      tb.receipt_header,
      tb.receipt_footer,
      h.name as hotel_name,
      h.legal_name,
      h.address,
      h.phone,
      h.email,
      h.currency,
      h.vat_rate,
      h.catering_levy_rate,
      h.service_charge_rate
    FROM tenants t
    JOIN subscription_plans sp ON t.plan_id = sp.id
    LEFT JOIN tenant_branding tb ON tb.tenant_id = t.id
    LEFT JOIN hotels h ON h.tenant_id = t.id
    WHERE (t.slug = ? OR t.id = ? OR t.custom_domain = ?)
  `, [slug, slug, slug]);

  if (!tenant) {
    return res.status(404).json({ error: `Hotel subscriber with identifier '${slug}' not found.` });
  }

  // Get Outlets
  const outlets = queryAll(`
    SELECT id, name, code, type, opening_time, closing_time
    FROM outlets
    WHERE tenant_id = ? AND is_active = 1
    ORDER BY name ASC
  `, [tenant.tenant_id]);

  // Get Sample Active Table for Quick Ordering Demo
  const sampleTable = queryOne(`
    SELECT id, table_number, name, qr_token
    FROM restaurant_tables
    WHERE tenant_id = ? AND is_active = 1
    ORDER BY table_number ASC LIMIT 1
  `, [tenant.tenant_id]);

  // Get Menu Categories
  const categories = queryAll(`
    SELECT id, name, slug, meal_type, icon, description, sort_order
    FROM menu_categories
    WHERE (tenant_id = ? OR tenant_id IS NULL) AND is_active = 1
    ORDER BY sort_order ASC
  `, [tenant.tenant_id]);

  // Get Menu Items for this tenant
  const items = queryAll(`
    SELECT 
      id, category_id, name, description, price, image_url,
      estimated_prep_time, is_special, dietary_flags, allergens
    FROM menu_items
    WHERE tenant_id = ? AND is_available = 1
    ORDER BY is_special DESC, name ASC
  `, [tenant.tenant_id]);

  // Map items to categories
  const categoriesWithItems = categories.map((cat) => ({
    ...cat,
    items: items.filter((it) => it.category_id === cat.id),
  })).filter((cat) => cat.items.length > 0);

  // Determine current day-part meal schedule based on local hour
  const currentHour = new Date().getHours();
  let currentMealSchedule = 'Dinner & Chef Grills';
  if (currentHour >= 6 && currentHour < 12) {
    currentMealSchedule = 'Artisanal Breakfast';
  } else if (currentHour >= 12 && currentHour < 16) {
    currentMealSchedule = 'Executive Lunch & Veranda Specials';
  } else if (currentHour >= 22 || currentHour < 2) {
    currentMealSchedule = 'Late Night Bites & Master Mixology';
  }

  // Hero photography and hotel details based on slug
  let heroImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85';
  let tagline = 'A Symphony of Epicurean Elegance in the Heart of Nairobi';
  let description = 'Nestled amidst lush botanical gardens in Kilimani, Grand Heritage Hotel & Resort delivers Michelin-standard dining, aged prime charcoal steaks, handcrafted pastas, and rare African single-origin spirits. Every dish celebrates locally-sourced Kenyan provenance prepared by master culinary craftsmen.';
  let rating = 4.9;
  let reviewsCount = 482;
  let amenities = [
    'Alfresco Garden Fountain Terrace',
    'Sommelier Wine Cellar',
    'Private VIP Dining Suites',
    'Acacia Charcoal & Wood Smoker',
    'Complimentary High-Speed Guest Wi-Fi',
    'Secure Valet Parking',
  ];

  if (tenant.slug.includes('serena')) {
    heroImage = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=85';
    tagline = 'Savanna Wild Luxury & Fireside Bush Feasts';
    description = 'Perched on the rim of the world-famous Maasai Mara National Reserve, Serena Safari Lodge blends dramatic wilderness vistas with indigenous olive-wood charcoal grills, Swahili coconut seafood curries, and sundowner cocktails under star-studded African skies.';
    rating = 4.95;
    reviewsCount = 614;
    amenities = [
      'Panoramic Savanna View Deck',
      'Wild Olive Wood Bush Kitchen',
      'Sundowner Champagne Cocktail Lounge',
      'Starlit Boma Fireside Dining',
      'Eco-Certified Game Reserve Cuisine',
      'Wildlife Waterhole Viewing Area',
    ];
  }

  res.json({
    hotel: {
      ...tenant,
      display_name: tenant.brand_name || tenant.hotel_name || tenant.name,
      tagline,
      description,
      hero_image: heroImage,
      rating,
      reviews_count: reviewsCount,
      amenities,
      current_meal_schedule: currentMealSchedule,
      subdomain: `${tenant.slug}.plateiq.cloud`,
      sample_table: sampleTable,
    },
    outlets,
    today_specials: items.filter((i) => i.is_special === 1),
    categories: categoriesWithItems,
    all_items: items,
  });
});
