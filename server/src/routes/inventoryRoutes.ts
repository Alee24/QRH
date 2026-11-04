import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute, runInTransaction } from '../db/index.js';
import { authenticate, authorize, logAudit } from '../middleware/auth.js';

export const inventoryRouter = Router();

// List Inventory Stock with Reorder Alert status
inventoryRouter.get('/', authenticate, (req, res) => {
  const items = queryAll(`
    SELECT 
      i.*,
      CASE WHEN i.current_stock <= i.min_reorder_level THEN 1 ELSE 0 END as is_low_stock,
      (SELECT COUNT(*) FROM recipes WHERE ingredient_id = i.id) as linked_menu_count
    FROM inventory_items i
    ORDER BY is_low_stock DESC, i.name ASC
  `);
  res.json(items);
});

// Stock Movements Log
inventoryRouter.get('/movements', authenticate, (req, res) => {
  const movements = queryAll(`
    SELECT sm.*, ii.name as ingredient_name, ii.code as ingredient_code
    FROM stock_movements sm
    JOIN inventory_items ii ON sm.ingredient_id = ii.id
    ORDER BY sm.created_at DESC
    LIMIT 100
  `);
  res.json(movements);
});

// Stock Adjustment / Receipt
inventoryRouter.post('/adjust', authenticate, authorize(['super_admin', 'hotel_admin', 'restaurant_manager', 'inventory_manager']), (req, res) => {
  const { ingredientId, quantity, type, notes } = req.body;
  if (!ingredientId || quantity === undefined) {
    return res.status(400).json({ error: 'Ingredient ID and quantity are required.' });
  }

  runInTransaction(() => {
    const item = queryOne('SELECT * FROM inventory_items WHERE id = ?', [ingredientId]);
    if (!item) throw new Error('Ingredient not found');

    const qty = Number(quantity);
    let newStock = item.current_stock;
    if (type === 'receipt') {
      newStock += qty;
    } else if (type === 'adjustment') {
      newStock = qty; // direct override
    } else {
      newStock = Math.max(0, newStock - qty);
    }

    execute(`
      UPDATE inventory_items 
      SET current_stock = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [newStock, ingredientId]);

    execute(`
      INSERT INTO stock_movements (id, ingredient_id, movement_type, quantity, unit, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [uuidv4(), ingredientId, type || 'adjustment', qty, item.unit_of_measure, notes || 'Manual adjustment', req.user?.id || 'STAFF']);
  });

  const updated = queryOne('SELECT * FROM inventory_items WHERE id = ?', [ingredientId]);
  logAudit(req.user?.id || null, 'STOCK_ADJUSTMENT', 'INVENTORY', ingredientId, { quantity, type, notes });

  res.json(updated);
});

// Wastage log
inventoryRouter.get('/wastage', authenticate, (req, res) => {
  const wastage = queryAll(`
    SELECT sw.*, ii.name as ingredient_name, ii.unit_of_measure
    FROM stock_wastage sw
    JOIN inventory_items ii ON sw.ingredient_id = ii.id
    ORDER BY sw.created_at DESC
  `);
  res.json(wastage);
});

inventoryRouter.post('/wastage', authenticate, authorize(['super_admin', 'hotel_admin', 'restaurant_manager', 'kitchen_manager', 'inventory_manager']), (req, res) => {
  const { ingredientId, quantity, reason } = req.body;
  if (!ingredientId || !quantity || !reason) {
    return res.status(400).json({ error: 'Ingredient ID, quantity, and reason are required.' });
  }

  runInTransaction(() => {
    const item = queryOne('SELECT * FROM inventory_items WHERE id = ?', [ingredientId]);
    if (!item) throw new Error('Ingredient not found');

    const qty = Number(quantity);
    const costLoss = qty * item.cost_per_unit;

    execute(`
      UPDATE inventory_items 
      SET current_stock = MAX(0, current_stock - ?), updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [qty, ingredientId]);

    const wasteId = uuidv4();
    execute(`
      INSERT INTO stock_wastage (id, ingredient_id, quantity, reason, logged_by, cost_loss)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [wasteId, ingredientId, qty, reason, req.user?.name || 'Staff', costLoss]);

    execute(`
      INSERT INTO stock_movements (id, ingredient_id, movement_type, quantity, unit, reference_id, notes)
      VALUES (?, ?, 'wastage', ?, ?, ?, ?)
    `, [uuidv4(), ingredientId, qty, item.unit_of_measure, wasteId, `Wastage: ${reason}`]);
  });

  logAudit(req.user?.id || null, 'STOCK_WASTAGE', 'INVENTORY', ingredientId, { quantity, reason });
  res.status(201).json({ success: true, message: 'Stock wastage logged and deducted.' });
});

// Recipes / Bill of Materials (BOM)
inventoryRouter.get('/recipes', authenticate, (req, res) => {
  const recipes = queryAll(`
    SELECT r.*, mi.name as menu_item_name, ii.name as ingredient_name
    FROM recipes r
    JOIN menu_items mi ON r.menu_item_id = mi.id
    JOIN inventory_items ii ON r.ingredient_id = ii.id
    ORDER BY mi.name ASC
  `);
  res.json(recipes);
});
