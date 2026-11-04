import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Modal } from '../../components/Modal.js';
import {
  MenuSquare,
  Plus,
  Clock,
  Flame,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  Utensils
} from 'lucide-react';

export const MenuManager: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Item Modal
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [newItemPrepTime, setNewItemPrepTime] = useState(15);
  const [newItemCat, setNewItemCat] = useState('');
  const [newItemStation, setNewItemStation] = useState('');
  const [newItemImg, setNewItemImg] = useState('');

  useEffect(() => {
    loadMenu();
    loadStations();
  }, []);

  const loadMenu = async () => {
    try {
      const data = await apiFetch<any>('/menu');
      setCategories(data.categories || []);
      setSchedules(data.schedules || []);
      if (data.categories?.length > 0 && !newItemCat) {
        setNewItemCat(data.categories[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStations = async () => {
    try {
      const data = await apiFetch<any[]>('/kds/stations');
      setStations(data);
      if (data.length > 0 && !newItemStation) {
        setNewItemStation(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSoldOut = async (itemId: string, current: boolean) => {
    try {
      await apiFetch(`/menu/items/${itemId}/sold-out`, {
        method: 'PATCH',
        body: JSON.stringify({ is_sold_out: !current }),
      });
      loadMenu();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleAvailable = async (itemId: string, current: boolean) => {
    try {
      await apiFetch(`/menu/items/${itemId}/available`, {
        method: 'PATCH',
        body: JSON.stringify({ is_available: !current }),
      });
      loadMenu();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateItem = async () => {
    if (!newItemName || !newItemPrice || !newItemCat) return;
    try {
      await apiFetch('/menu/items', {
        method: 'POST',
        body: JSON.stringify({
          category_id: newItemCat,
          station_id: newItemStation,
          name: newItemName,
          description: newItemDesc,
          price: Number(newItemPrice),
          cost_price: Number(newItemCost || 0),
          estimated_prep_time: Number(newItemPrepTime),
          image_url: newItemImg || undefined,
        }),
      });
      setAddItemModalOpen(false);
      setNewItemName('');
      setNewItemDesc('');
      setNewItemPrice('');
      loadMenu();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const allItems = categories.flatMap((c) => c.items || []);
  const filteredItems = (selectedCategory === 'all'
    ? allItems
    : categories.find((c) => c.id === selectedCategory)?.items || []
  ).filter((i: any) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <MenuSquare className="text-amber-600" />
              <span>Menu & Schedule Management</span>
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Food items, meal portion modifiers, preparation station routing and daily schedules
            </p>
          </div>

          <button
            onClick={() => setAddItemModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/30 transition-colors"
          >
            <Plus size={15} />
            <span>Add Menu Item</span>
          </button>
        </div>

        {/* 1. SCHEDULE BANNERS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {schedules.map((sch) => (
            <div
              key={sch.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Calendar size={18} />
              </div>
              <div>
                <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100 block">
                  {sch.name}
                </span>
                <span className="text-[11px] text-stone-500 font-mono">
                  {sch.start_time} - {sch.end_time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 2. CATEGORY TABS & SEARCH */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
              }`}
            >
              All Categories ({allItems.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === c.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
                }`}
              >
                {c.name} ({c.items?.length || 0})
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        {/* 3. MENU ITEMS TABLE */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-4">Dish</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Kitchen Station</th>
                  <th className="p-4">Prep Time</th>
                  <th className="p-4">Portions & Modifiers</th>
                  <th className="p-4">Sold Out Toggle</th>
                  <th className="p-4">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 dark:divide-stone-800">
                {filteredItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover bg-stone-100"
                        />
                        <div>
                          <span className="font-bold text-stone-900 dark:text-stone-100 block">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-stone-400 line-clamp-1 max-w-xs">
                            {item.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono font-bold text-stone-900 dark:text-stone-100">
                      KES {item.price.toLocaleString()}
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-semibold text-[11px]">
                        {item.station_name || 'Main Kitchen'}
                      </span>
                    </td>

                    <td className="p-4 font-medium text-stone-600 dark:text-stone-400">
                      {item.estimated_prep_time} mins
                    </td>

                    <td className="p-4 text-stone-500">
                      <div>{item.portions?.length || 0} Portions</div>
                      <div>{item.modifier_groups?.length || 0} Modifier Groups</div>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleSoldOut(item.id, Boolean(item.is_sold_out))}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                          item.is_sold_out
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}
                      >
                        {item.is_sold_out ? '86\'d (Sold Out)' : 'In Stock'}
                      </button>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleAvailable(item.id, Boolean(item.is_available))}
                        className={`p-1 rounded-lg ${
                          item.is_available ? 'text-emerald-600' : 'text-stone-400'
                        }`}
                      >
                        {item.is_available ? <CheckCircle size={18} /> : <XCircle size={18} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD ITEM MODAL */}
      <Modal
        isOpen={addItemModalOpen}
        onClose={() => setAddItemModalOpen(false)}
        title="Add New Gourmet Dish"
        maxWidth="md"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Dish Name
            </label>
            <input
              type="text"
              placeholder="E.g. Grilled King Prawns with Herb Butter"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Detailed culinary description..."
              value={newItemDesc}
              onChange={(e) => setNewItemDesc(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Base Price (KES)
              </label>
              <input
                type="number"
                placeholder="2400"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Cost Price (KES)
              </label>
              <input
                type="number"
                placeholder="800"
                value={newItemCost}
                onChange={(e) => setNewItemCost(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Menu Category
              </label>
              <select
                value={newItemCat}
                onChange={(e) => setNewItemCat(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Kitchen Prep Station
              </label>
              <select
                value={newItemStation}
                onChange={(e) => setNewItemStation(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Food Photography Image URL
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={newItemImg}
              onChange={(e) => setNewItemImg(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            />
          </div>

          <button
            onClick={handleCreateItem}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow mt-2"
          >
            Publish Dish to Menu
          </button>
        </div>
      </Modal>
    </div>
  );
};

