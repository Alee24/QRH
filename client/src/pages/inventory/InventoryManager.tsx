import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Modal } from '../../components/Modal.js';
import {
  Package,
  AlertTriangle,
  Plus,
  Trash2,
  TrendingDown,
  History,
  Scale,
  DollarSign
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [wastageLogs, setWastageLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stock' | 'recipes' | 'wastage' | 'movements'>('stock');
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<'receipt' | 'adjustment'>('receipt');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Wastage Modal
  const [wasteModalOpen, setWasteModalOpen] = useState(false);
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState('spoiled');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stockData, recipeData, moveData, wasteData] = await Promise.all([
        apiFetch<any[]>('/inventory'),
        apiFetch<any[]>('/inventory/recipes'),
        apiFetch<any[]>('/inventory/movements'),
        apiFetch<any[]>('/inventory/wastage'),
      ]);
      setItems(stockData);
      setRecipes(recipeData);
      setMovements(moveData);
      setWastageLogs(wasteData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedIngredient || !adjustQty) return;
    try {
      await apiFetch('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          ingredientId: selectedIngredient.id,
          quantity: Number(adjustQty),
          type: adjustType,
          notes: adjustNotes,
        }),
      });
      setAdjustModalOpen(false);
      setAdjustQty('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogWastage = async () => {
    if (!selectedIngredient || !wasteQty) return;
    try {
      await apiFetch('/inventory/wastage', {
        method: 'POST',
        body: JSON.stringify({
          ingredientId: selectedIngredient.id,
          quantity: Number(wasteQty),
          reason: wasteReason,
        }),
      });
      setWasteModalOpen(false);
      setWasteQty('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const lowStockCount = items.filter((i) => i.is_low_stock).length;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Package className="text-amber-600" />
              <span>Inventory & Recipe (BOM) Engine</span>
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Ingredient stock levels, automatic order deductions, reorder triggers, and wastage logs
            </p>
          </div>
        </div>

        {/* Low Stock Warning Banner */}
        {lowStockCount > 0 && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center gap-3">
            <AlertTriangle className="text-rose-600 shrink-0" size={20} />
            <div className="text-xs">
              <span className="font-bold">Attention Needed: </span>
              <span>{lowStockCount} inventory {lowStockCount === 1 ? 'ingredient has' : 'ingredients have'} dropped below minimum reorder thresholds.</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 text-xs font-bold">
          {[
            { id: 'stock', label: `Stock Levels (${items.length})` },
            { id: 'recipes', label: `Recipe BOM (${recipes.length})` },
            { id: 'movements', label: `Movements Log (${movements.length})` },
            { id: 'wastage', label: `Wastage Logs (${wastageLogs.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl transition-colors ${
                activeTab === t.id
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 1. STOCK LEVELS TAB */}
        {activeTab === 'stock' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-4">Ingredient Name</th>
                  <th className="p-4">SKU Code</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Reorder Level</th>
                  <th className="p-4">Cost / Unit</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 dark:divide-stone-800">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                    <td className="p-4 font-bold text-stone-900 dark:text-stone-100">
                      {it.name}
                    </td>
                    <td className="p-4 font-mono text-stone-400">{it.code}</td>
                    <td className="p-4 uppercase text-[10px] font-bold text-stone-500">
                      {it.category}
                    </td>
                    <td className="p-4 font-mono font-bold text-sm">
                      <span className={it.is_low_stock ? 'text-rose-600' : 'text-emerald-600'}>
                        {it.current_stock.toFixed(2)} {it.unit_of_measure}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-stone-400">
                      {it.min_reorder_level} {it.unit_of_measure}
                    </td>
                    <td className="p-4 font-mono text-stone-600 dark:text-stone-400">
                      KES {it.cost_per_unit.toLocaleString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedIngredient(it);
                          setAdjustType('receipt');
                          setAdjustModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]"
                      >
                        + Receive
                      </button>
                      <button
                        onClick={() => {
                          setSelectedIngredient(it);
                          setWasteModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold text-[11px]"
                      >
                        Log Waste
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. RECIPES BOM TAB */}
        {activeTab === 'recipes' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 text-xs text-stone-500">
              When customer orders are confirmed, the ingredients below are atomically deducted from current inventory stock.
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-4">Menu Dish</th>
                  <th className="p-4">Required Ingredient</th>
                  <th className="p-4">Deduction Quantity per Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 dark:divide-stone-800">
                {recipes.map((r) => (
                  <tr key={r.id}>
                    <td className="p-4 font-bold text-stone-900 dark:text-stone-100">
                      {r.menu_item_name}
                    </td>
                    <td className="p-4 text-stone-700 dark:text-stone-300">
                      {r.ingredient_name}
                    </td>
                    <td className="p-4 font-mono font-bold text-amber-600">
                      {r.quantity_required} {r.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. MOVEMENTS LOG TAB */}
        {activeTab === 'movements' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-4">Date Time</th>
                  <th className="p-4">Ingredient</th>
                  <th className="p-4">Movement Type</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 dark:divide-stone-800">
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="p-4 text-stone-400 font-mono text-[11px]">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-stone-900 dark:text-stone-100">
                      {m.ingredient_name}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {m.movement_type}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-stone-900 dark:text-stone-100">
                      {m.quantity} {m.unit}
                    </td>
                    <td className="p-4 text-stone-500">{m.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. WASTAGE LOG TAB */}
        {activeTab === 'wastage' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-4">Date Time</th>
                  <th className="p-4">Ingredient</th>
                  <th className="p-4">Quantity Wasted</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Financial Loss (Cost)</th>
                  <th className="p-4">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 dark:divide-stone-800">
                {wastageLogs.map((w) => (
                  <tr key={w.id}>
                    <td className="p-4 text-stone-400 font-mono text-[11px]">
                      {new Date(w.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-stone-900 dark:text-stone-100">
                      {w.ingredient_name}
                    </td>
                    <td className="p-4 font-mono font-bold text-rose-600">
                      {w.quantity} {w.unit_of_measure}
                    </td>
                    <td className="p-4 uppercase text-[10px] font-bold text-stone-500">
                      {w.reason}
                    </td>
                    <td className="p-4 font-mono font-bold text-rose-600">
                      KES {w.cost_loss.toLocaleString()}
                    </td>
                    <td className="p-4 text-stone-600 dark:text-stone-400">{w.logged_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADJUSTMENT MODAL */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Stock Adjustment: ${selectedIngredient?.name}`}
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Operation Type
            </label>
            <select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold"
            >
              <option value="receipt">Stock Receipt (Add stock from supplier)</option>
              <option value="adjustment">Stock Override (Direct recount)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Quantity ({selectedIngredient?.unit_of_measure})
            </label>
            <input
              type="number"
              step="0.01"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              placeholder="E.g. 10.5"
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Supplier / Audit Note
            </label>
            <input
              type="text"
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              placeholder="E.g. PO-8492 Supplier Delivery"
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            />
          </div>

          <button
            onClick={handleAdjustStock}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow mt-2"
          >
            Update Inventory Stock
          </button>
        </div>
      </Modal>

      {/* WASTAGE MODAL */}
      <Modal
        isOpen={wasteModalOpen}
        onClose={() => setWasteModalOpen(false)}
        title={`Record Wastage: ${selectedIngredient?.name}`}
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Quantity Wasted ({selectedIngredient?.unit_of_measure})
            </label>
            <input
              type="number"
              step="0.01"
              value={wasteQty}
              onChange={(e) => setWasteQty(e.target.value)}
              placeholder="E.g. 1.2"
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Reason for Wastage
            </label>
            <select
              value={wasteReason}
              onChange={(e) => setWasteReason(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold"
            >
              <option value="spoiled">Spoiled / Cold Chain Break</option>
              <option value="expired">Passed Expiry Date</option>
              <option value="spilled">Spilled / Damaged in Kitchen</option>
              <option value="trim_loss">Excess Trim Loss</option>
            </select>
          </div>

          <button
            onClick={handleLogWastage}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow mt-2"
          >
            Deduct Stock & Record Wastage Loss
          </button>
        </div>
      </Modal>
    </div>
  );
};

