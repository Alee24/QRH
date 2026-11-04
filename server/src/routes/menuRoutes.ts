import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, execute, runInTransaction } from '../db/index.js';
import { authenticate, authorize, logAudit } from '../middleware/auth.js';

export const menuRouter = Router();

// Public / Customer: Get Full Menu with current schedule filter
menuRouter.get('/', (req, res) => {
  const { mealType, outletId } = req.query;
  const currentOutlet = outletId || 'outlet-royal-orchid';

  let catSql = `
    SELECT * FROM menu_categories 
    WHERE outlet_id = ? AND is_active = 1
  `;
  const catParams: any[] = [currentOutlet];

  if (mealType && mealType !== 'all') {
    catSql += ` AND (meal_type = ? OR meal_type = 'all_day')`;
    catParams.push(mealType);
  }

  catSql += ' ORDER BY sort_order ASC';
  const categories = queryAll(catSql, catParams);

  for (const cat of categories) {
    cat.items = queryAll(`
      SELECT m.*, ks.name as station_name
      FROM menu_items m
      LEFT JOIN kitchen_stations ks ON m.station_id = ks.id
      WHERE m.category_id = ? AND m.is_available = 1
      ORDER BY m.sort_order ASC, m.name ASC
    `, [cat.id]);

    for (const itm of cat.items) {
      // Parse JSON tags
      try {
        itm.dietary_flags = JSON.parse(itm.dietary_flags || '[]');
      } catch (e) {
        itm.dietary_flags = [];
      }
      try {
        itm.allergens = JSON.parse(itm.allergens || '[]');
      } catch (e) {
        itm.allergens = [];
      }

      // Fetch Portions
      itm.portions = queryAll('SELECT * FROM menu_item_portions WHERE menu_item_id = ?', [itm.id]);

      // Fetch Modifiers
      const modGroups = queryAll('SELECT * FROM modifier_groups WHERE menu_item_id = ?', [itm.id]);
      for (const mg of modGroups) {
        mg.options = queryAll('SELECT * FROM modifier_options WHERE group_id = ?', [mg.id]);
      }
      itm.modifier_groups = modGroups;
    }
  }

  // Active schedules
  const schedules = queryAll('SELECT * FROM menu_schedules WHERE outlet_id = ? AND is_active = 1', [currentOutlet]);

  res.json({
    categories,
    schedules,
  });
});

// Single Item Detail
menuRouter.get('/items/:id', (req, res) => {
  const item = queryOne(`
    SELECT m.*, c.name as category_name, ks.name as station_name
    FROM menu_items m
    JOIN menu_categories c ON m.category_id = c.id
    LEFT JOIN kitchen_stations ks ON m.station_id = ks.id
    WHERE m.id = ?
  `, [req.params.id]);

  if (!item) return res.status(404).json({ error: 'Item not found' });

  item.portions = queryAll('SELECT * FROM menu_item_portions WHERE menu_item_id = ?', [item.id]);

  const modGroups = queryAll('SELECT * FROM modifier_groups WHERE menu_item_id = ?', [item.id]);
  for (const mg of modGroups) {
    mg.options = queryAll('SELECT * FROM modifier_options WHERE group_id = ?', [mg.id]);
  }
  item.modifier_groups = modGroups;

  res.json(item);
});

// Toggle Sold Out status
menuRouter.patch('/items/:id/sold-out', authenticate, authorize(['super_admin', 'hotel_admin', 'restaurant_manager', 'kitchen_manager', 'kitchen_staff']), (req, res) => {
  const { is_sold_out } = req.body;
  execute(`UPDATE menu_items SET is_sold_out = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [is_sold_out ? 1 : 0, req.params.id]);
  const item = queryOne('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
  res.json(item);
});

// Toggle Availability (e.g. temporary unpublish)
menuRouter.patch('/items/:id/available', authenticate, authorize(['super_admin', 'hotel_admin', 'restaurant_manager', 'kitchen_manager']), (req, res) => {
  const { is_available } = req.body;
  execute(`UPDATE menu_items SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [is_available ? 1 : 0, req.params.id]);
  const item = queryOne('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
  res.json(item);
});

// Create Menu Item
menuRouter.post('/items', authenticate, authorize(['super_admin', 'hotel_admin', 'restaurant_manager']), (req, res) => {
  const {
    category_id, outlet_id, station_id, name, description,
    price, cost_price, image_url, estimated_prep_time,
    dietary_flags, allergens, portions, modifier_groups
  } = req.body;

  if (!name || !price || !category_id) {
    return res.status(400).json({ error: 'Name, price and category are required.' });
  }

  const itemId = `itm-${Date.now()}`;

  runInTransaction(() => {
    execute(`
      INSERT INTO menu_items (id, category_id, outlet_id, station_id, name, description, price, cost_price, image_url, estimated_prep_time, is_available, is_sold_out, dietary_flags, allergens)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
    `, [
      itemId, category_id, outlet_id || 'outlet-royal-orchid', station_id || 'station-main',
      name, description || '', price, cost_price || 0,
      image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      estimated_prep_time || 15,
      JSON.stringify(dietary_flags || []), JSON.stringify(allergens || [])
    ]);

    if (portions && Array.isArray(portions)) {
      for (const p of portions) {
        execute(`
          INSERT INTO menu_item_portions (id, menu_item_id, name, price, is_default)
          VALUES (?, ?, ?, ?, ?)
        `, [uuidv4(), itemId, p.name, p.price, p.is_default ? 1 : 0]);
      }
    }

    if (modifier_groups && Array.isArray(modifier_groups)) {
      for (const mg of modifier_groups) {
        const mgId = uuidv4();
        execute(`
          INSERT INTO modifier_groups (id, menu_item_id, name, min_selection, max_selection, is_required)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [mgId, itemId, mg.name, mg.min_selection || 0, mg.max_selection || 1, mg.is_required ? 1 : 0]);

        if (mg.options && Array.isArray(mg.options)) {
          for (const opt of mg.options) {
            execute(`
              INSERT INTO modifier_options (id, group_id, name, price)
              VALUES (?, ?, ?, ?)
            `, [uuidv4(), mgId, opt.name, opt.price || 0]);
          }
        }
      }
    }
  });

  const created = queryOne('SELECT * FROM menu_items WHERE id = ?', [itemId]);
  logAudit(req.user!.id, 'CREATE_MENU_ITEM', 'MENU_ITEM', itemId, { name, price });

  res.status(201).json(created);
});

// Update Existing Menu Item & Price
menuRouter.put('/items/:id', authenticate, authorize(['super_admin', 'hotel_admin', 'restaurant_manager']), (req, res) => {
  const { id } = req.params;
  const { name, description, price, cost_price, estimated_prep_time, category_id, station_id, is_special, image_url } = req.body;

  const existing = queryOne('SELECT * FROM menu_items WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ error: 'Menu item not found.' });
  }

  execute(`
    UPDATE menu_items
    SET 
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      cost_price = COALESCE(?, cost_price),
      estimated_prep_time = COALESCE(?, estimated_prep_time),
      category_id = COALESCE(?, category_id),
      station_id = COALESCE(?, station_id),
      is_special = COALESCE(?, is_special),
      image_url = COALESCE(?, image_url),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [name, description, price, cost_price, estimated_prep_time, category_id, station_id, is_special, image_url, id]);

  logAudit(req.user!.id, 'UPDATE_MENU_ITEM', 'MENU_ITEM', id, { name, price });
  res.json(queryOne('SELECT * FROM menu_items WHERE id = ?', [id]));
});

// Delete Menu Item
menuRouter.delete('/items/:id', authenticate, authorize(['super_admin', 'hotel_admin', 'restaurant_manager']), (req, res) => {
  const { id } = req.params;
  const existing = queryOne('SELECT * FROM menu_items WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ error: 'Menu item not found.' });
  }

  execute('DELETE FROM menu_items WHERE id = ?', [id]);
  logAudit(req.user!.id, 'DELETE_MENU_ITEM', 'MENU_ITEM', id, { name: existing.name });
  res.json({ message: 'Menu item deleted successfully.', id });
});

// Bulk CSV Menu Items & Prices Upload
menuRouter.post('/bulk-csv', authenticate, authorize(['super_admin', 'hotel_admin', 'restaurant_manager']), (req, res) => {
  const { items, outletId } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'CSV items array is required and cannot be empty.' });
  }

  const tenantId = req.user!.tenant_id || 'tenant-grand-heritage';
  const targetOutlet = outletId || 'outlet-royal-orchid';

  let importedCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  runInTransaction(() => {
    // Get existing categories and stations for matching
    const existingCats = queryAll('SELECT id, name, slug FROM menu_categories WHERE tenant_id = ? OR tenant_id IS NULL', [tenantId]);
    const existingStations = queryAll('SELECT id, name, code FROM kitchen_stations WHERE tenant_id = ? OR tenant_id IS NULL', [tenantId]);

    const defaultStation = existingStations.find((s: any) => s.code === 'MAIN') || existingStations[0] || { id: 'station-main' };

    for (let index = 0; index < items.length; index++) {
      const row = items[index];
      const rowNum = index + 1;

      const name = (row.name || '').trim();
      const rawPrice = row.price;
      const price = parseFloat(rawPrice);

      if (!name) {
        errors.push(`Row ${rowNum}: Item name is missing.`);
        continue;
      }
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${rowNum}: Invalid price '${rawPrice}' for item '${name}'.`);
        continue;
      }

      // Match or Create Category
      const rawCat = (row.category || 'Mains').trim();
      let matchedCat = existingCats.find((c: any) => c.name.toLowerCase() === rawCat.toLowerCase());

      if (!matchedCat) {
        const catId = `cat-${rawCat.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
        const catSlug = rawCat.toLowerCase().replace(/[^a-z0-9]/g, '-');
        execute(`
          INSERT INTO menu_categories (id, tenant_id, outlet_id, name, slug, meal_type, sort_order, is_active)
          VALUES (?, ?, ?, ?, ?, 'all_day', 99, 1)
        `, [catId, tenantId, targetOutlet, rawCat, catSlug]);

        matchedCat = { id: catId, name: rawCat, slug: catSlug };
        existingCats.push(matchedCat);
      }

      // Match Station
      const rawStation = (row.station || '').toLowerCase();
      let matchedStation = defaultStation;
      if (rawStation) {
        const found = existingStations.find((s: any) =>
          s.name.toLowerCase().includes(rawStation) || s.code.toLowerCase().includes(rawStation)
        );
        if (found) matchedStation = found;
      }

      // Check if item with this name already exists in tenant
      const existingItem = queryOne('SELECT id FROM menu_items WHERE LOWER(name) = LOWER(?) AND (tenant_id = ? OR tenant_id IS NULL)', [name, tenantId]);

      const description = (row.description || '').trim();
      const prepTime = parseInt(row.prep_time, 10) || 15;
      const isSpecial = row.is_special === true || row.is_special === '1' || row.is_special === 'true' ? 1 : 0;
      const dietary = row.dietary_flags ? (typeof row.dietary_flags === 'string' ? row.dietary_flags : JSON.stringify(row.dietary_flags)) : '';
      const imageUrl = row.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

      if (existingItem) {
        // Update price, description, etc.
        execute(`
          UPDATE menu_items
          SET 
            price = ?,
            description = CASE WHEN ? != '' THEN ? ELSE description END,
            estimated_prep_time = ?,
            is_special = ?,
            dietary_flags = ?,
            category_id = ?,
            station_id = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [price, description, description, prepTime, isSpecial, dietary, matchedCat.id, matchedStation.id, existingItem.id]);
        updatedCount++;
      } else {
        // Insert new item
        const newItemId = `itm-csv-${Date.now()}-${index}`;
        execute(`
          INSERT INTO menu_items (
            id, tenant_id, category_id, outlet_id, station_id, name, description,
            price, cost_price, image_url, estimated_prep_time, is_available, is_sold_out,
            is_special, dietary_flags, allergens
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, '[]')
        `, [
          newItemId, tenantId, matchedCat.id, targetOutlet, matchedStation.id,
          name, description, price, price * 0.4, imageUrl, prepTime, isSpecial, dietary
        ]);
        importedCount++;
      }
    }
  });

  logAudit(req.user!.id, 'BULK_CSV_MENU_IMPORT', 'MENU', targetOutlet, { importedCount, updatedCount, errorsCount: errors.length });

  res.json({
    success: true,
    message: `CSV import completed: ${importedCount} created, ${updatedCount} updated.`,
    importedCount,
    updatedCount,
    errors,
  });
});


