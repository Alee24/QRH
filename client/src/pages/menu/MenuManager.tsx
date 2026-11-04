import React, { useState, useEffect, useRef } from 'react';
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
  Utensils,
  Upload,
  Download,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Layers,
  ChefHat,
  Filter
} from 'lucide-react';

interface MenuItem {
  id: string;
  category_id: string;
  station_id?: string;
  station_name?: string;
  name: string;
  description: string;
  price: number;
  cost_price: number;
  image_url: string;
  estimated_prep_time: number;
  is_available: number;
  is_sold_out: number;
  is_special: number;
  dietary_flags: any;
  allergens: any;
}

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  meal_type: string;
  sort_order: number;
  items?: MenuItem[];
}

interface KitchenStation {
  id: string;
  name: string;
  code: string;
  color_code: string;
}

export const MenuManager: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [stations, setStations] = useState<KitchenStation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialsOnly, setFilterSpecialsOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inline Price Editing
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Add / Edit Modal
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formPrepTime, setFormPrepTime] = useState(15);
  const [formCategory, setFormCategory] = useState('');
  const [formStation, setFormStation] = useState('');
  const [formSpecial, setFormSpecial] = useState(false);
  const [formImage, setFormImage] = useState('');

  // CSV Import Modal
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvSuccessMsg, setCsvSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadMenu();
    loadStations();
  }, []);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/menu');
      setCategories(data.categories || []);
      setSchedules(data.schedules || []);
      if (data.categories?.length > 0 && !formCategory) {
        setFormCategory(data.categories[0].id);
      }
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStations = async () => {
    try {
      const data = await apiFetch<KitchenStation[]>('/kds/stations');
      setStations(data);
      if (data.length > 0 && !formStation) {
        setFormStation(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load stations:', err);
    }
  };

  // Toggle Availability
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

  // Toggle Sold Out (86ed)
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

  // Inline Price Save
  const handleSavePrice = async (itemId: string) => {
    const newPrice = parseFloat(tempPrice);
    if (isNaN(newPrice) || newPrice < 0) return;
    try {
      await apiFetch(`/menu/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ price: newPrice }),
      });
      setEditingPriceId(null);
      loadMenu();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Create / Edit Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormDesc('');
    setFormPrice('');
    setFormCost('');
    setFormPrepTime(15);
    setFormCategory(categories[0]?.id || '');
    setFormStation(stations[0]?.id || '');
    setFormSpecial(false);
    setFormImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
    setItemModalOpen(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDesc(item.description || '');
    setFormPrice(String(item.price));
    setFormCost(String(item.cost_price || 0));
    setFormPrepTime(item.estimated_prep_time || 15);
    setFormCategory(item.category_id);
    setFormStation(item.station_id || stations[0]?.id || '');
    setFormSpecial(item.is_special === 1);
    setFormImage(item.image_url || '');
    setItemModalOpen(true);
  };

  const handleSaveItem = async () => {
    if (!formName.trim() || !formPrice || !formCategory) {
      alert('Name, category, and price are required.');
      return;
    }

    const payload = {
      name: formName.trim(),
      description: formDesc.trim(),
      price: parseFloat(formPrice),
      cost_price: parseFloat(formCost || '0'),
      estimated_prep_time: formPrepTime,
      category_id: formCategory,
      station_id: formStation,
      is_special: formSpecial ? 1 : 0,
      image_url: formImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    };

    try {
      if (editingItem) {
        await apiFetch(`/menu/items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/menu/items', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setItemModalOpen(false);
      loadMenu();
    } catch (err: any) {
      alert(err.message || 'Failed to save menu item');
    }
  };

  // Delete Item
  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete '${name}'?`)) return;
    try {
      await apiFetch(`/menu/items/${itemId}`, { method: 'DELETE' });
      loadMenu();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // CSV Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError(null);
    setCsvSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          throw new Error('CSV must contain at least a header line and one data row.');
        }

        // Parse header
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[\s_-]/g, ''));
        
        const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('item'));
        const catIdx = headers.findIndex((h) => h.includes('cat'));
        const priceIdx = headers.findIndex((h) => h.includes('price') || h.includes('cost') || h.includes('kes'));
        const descIdx = headers.findIndex((h) => h.includes('desc'));
        const prepIdx = headers.findIndex((h) => h.includes('prep') || h.includes('time'));
        const stationIdx = headers.findIndex((h) => h.includes('station'));
        const specialIdx = headers.findIndex((h) => h.includes('special'));
        const dietIdx = headers.findIndex((h) => h.includes('diet'));

        if (nameIdx === -1 || priceIdx === -1) {
          throw new Error('CSV must contain at least "Name" and "Price" columns.');
        }

        const parsedRows = [];
        for (let i = 1; i < lines.length; i++) {
          // Handle quoted commas properly
          const rowText = lines[i];
          const cols: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let c = 0; c < rowText.length; c++) {
            const char = rowText[c];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cols.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          cols.push(current.trim());

          const name = cols[nameIdx] || '';
          const price = parseFloat(cols[priceIdx]?.replace(/[^0-9.]/g, '') || '0');
          const category = catIdx !== -1 ? cols[catIdx] : 'Mains';
          const description = descIdx !== -1 ? cols[descIdx] : '';
          const prep_time = prepIdx !== -1 ? parseInt(cols[prepIdx], 10) || 15 : 15;
          const station = stationIdx !== -1 ? cols[stationIdx] : 'Main Kitchen';
          const is_special = specialIdx !== -1 && (cols[specialIdx]?.toLowerCase() === 'true' || cols[specialIdx] === '1');
          const dietary_flags = dietIdx !== -1 ? cols[dietIdx] : '';

          if (name) {
            parsedRows.push({
              name,
              category: category || 'Mains',
              price,
              description,
              prep_time,
              station,
              is_special,
              dietary_flags,
            });
          }
        }

        if (parsedRows.length === 0) {
          throw new Error('No valid menu rows parsed from CSV.');
        }

        setCsvRows(parsedRows);
      } catch (err: any) {
        setCsvError(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  // Submit Parsed CSV to Backend
  const handleImportCsv = async () => {
    if (csvRows.length === 0) return;
    setCsvImporting(true);
    setCsvError(null);
    try {
      const res = await apiFetch<any>('/menu/bulk-csv', {
        method: 'POST',
        body: JSON.stringify({ items: csvRows }),
      });
      setCsvSuccessMsg(res.message || `Successfully imported ${res.importedCount} items.`);
      setCsvRows([]);
      loadMenu();
      setTimeout(() => {
        setCsvModalOpen(false);
        setCsvSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setCsvError(err.message || 'Import failed.');
    } finally {
      setCsvImporting(false);
    }
  };

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const csvContent =
      'Name,Category,Price,Description,PrepTime,Station,IsSpecial,DietaryFlags\n' +
      '"Prime Aged Ribeye Steak","Grills",3200,"Charcoal grilled Kenya Angus beef with herb butter",25,"Charcoal Grill",true,"Gluten-Free"\n' +
      '"Truffle Tagliatelle","Pasta & Mains",2400,"Handmade fresh pasta with shaved black truffle and parmesan",18,"Main Kitchen",false,"Vegetarian"\n' +
      '"Savannah Sunset Negroni","Beverages",1200,"Single-origin Kenyan botanicals and Campari",5,"Cocktail Bar",true,"Alcoholic"\n' +
      '"Vanilla Bean Creme Brulee","Desserts",950,"Madagascar vanilla bean with caramelized sugar crust",10,"Pastry Studio",false,"Vegetarian"\n' +
      '"Crispy Swahili Calamari","Starters",1450,"Spiced salt and pepper squid with lime aioli",12,"Main Kitchen",false,"Seafood"';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'plateiq_sample_menu_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Items
  const allItems: MenuItem[] = categories.flatMap((c) => c.items || []);
  const filteredItems = allItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category_id !== selectedCategory) return false;
    if (selectedStation !== 'all' && item.station_id !== selectedStation) return false;
    if (filterSpecialsOnly && item.is_special !== 1) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-3 sm:p-5 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* 1. TOP HEADER WITH ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <MenuSquare size={18} />
              </div>
              <h1 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                Menu & Price Management
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {allItems.length} Active Items
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Configure dishes, station routing, fast inline price updates, and bulk CSV catalog imports.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadSampleCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition-colors"
              title="Download sample CSV template format"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Sample CSV</span>
            </button>

            <button
              onClick={() => {
                setCsvRows([]);
                setCsvError(null);
                setCsvModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <Upload size={14} />
              <span>Import Menu CSV</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <Plus size={15} />
              <span>Add Single Item</span>
            </button>
          </div>
        </div>

        {/* 2. OPERATIONAL FILTER CONTROLS & SEARCH */}
        <div className="bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              All ({allItems.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === c.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                {c.name} ({c.items?.length || 0})
              </button>
            ))}
          </div>

          {/* Search, Station & Specials filter */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
              <input
                type="text"
                placeholder="Search dish or price..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Station Filter */}
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="text-xs py-1.5 px-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 focus:outline-none"
            >
              <option value="all">All Stations</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Specials Toggle */}
            <button
              onClick={() => setFilterSpecialsOnly((prev) => !prev)}
              className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                filterSpecialsOnly
                  ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700'
              }`}
              title="Show Chef Specials Only"
            >
              <Flame size={14} />
            </button>
          </div>
        </div>

        {/* 3. HIGH-DENSITY MENU ITEMS TABLE */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-xs">
              <Utensils size={32} className="mx-auto mb-2 text-stone-300 dark:text-stone-700" />
              <p className="font-bold text-stone-700 dark:text-stone-300 text-sm">No menu items found</p>
              <p className="text-stone-500 mt-1">Try adjusting your filters, or use "Import Menu CSV" to upload your menu.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200/80 dark:border-stone-800/80 text-stone-500 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Item & Details</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Station</th>
                    <th className="py-2.5 px-3">Price (KES)</th>
                    <th className="py-2.5 px-3">Prep Time</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-medium">
                  {filteredItems.map((item) => {
                    const isSoldOut = item.is_sold_out === 1;
                    const isAvailable = item.is_available === 1;
                    const isEditingThisPrice = editingPriceId === item.id;
                    const catName = categories.find((c) => c.id === item.category_id)?.name || 'Mains';

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors ${
                          !isAvailable || isSoldOut ? 'opacity-60 bg-stone-50/40 dark:bg-stone-950/40' : ''
                        }`}
                      >
                        {/* Thumbnail & Title */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-stone-200 dark:border-stone-800"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-900 dark:text-stone-100">
                                  {item.name}
                                </span>
                                {item.is_special === 1 && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-stone-950 text-[9px] font-extrabold uppercase">
                                    Special
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-stone-400 line-clamp-1 max-w-xs mt-0.5">
                                {item.description || 'No description provided'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-semibold">
                            {catName}
                          </span>
                        </td>

                        {/* Station */}
                        <td className="py-2.5 px-3">
                          <span className="text-[11px] text-stone-500 font-mono">
                            {item.station_name || 'Main Kitchen'}
                          </span>
                        </td>

                        {/* Price (With Quick Inline Edit) */}
                        <td className="py-2.5 px-3">
                          {isEditingThisPrice ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={tempPrice}
                                onChange={(e) => setTempPrice(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSavePrice(item.id);
                                  if (e.key === 'Escape') setEditingPriceId(null);
                                }}
                                autoFocus
                                className="w-20 px-1.5 py-0.5 text-xs font-bold rounded border border-amber-500 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                              />
                              <button
                                onClick={() => handleSavePrice(item.id)}
                                className="p-1 rounded bg-amber-600 text-white hover:bg-amber-700"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => setEditingPriceId(null)}
                                className="p-1 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingPriceId(item.id);
                                setTempPrice(String(item.price));
                              }}
                              className="font-extrabold text-stone-900 dark:text-stone-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group flex items-center gap-1.5"
                              title="Click to inline edit price"
                            >
                              <span>KES {item.price.toLocaleString()}</span>
                              <Edit2 size={11} className="opacity-0 group-hover:opacity-100 text-stone-400" />
                            </button>
                          )}
                        </td>

                        {/* Prep Time */}
                        <td className="py-2.5 px-3">
                          <span className="text-stone-500 flex items-center gap-1 text-[11px]">
                            <Clock size={12} className="text-stone-400" />
                            ~{item.estimated_prep_time || 15}m
                          </span>
                        </td>

                        {/* Status Toggles */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleSoldOut(item.id, isSoldOut)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                                isSoldOut
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                              title={isSoldOut ? 'Click to mark in stock' : 'Click to 86 / mark sold out'}
                            >
                              {isSoldOut ? '86ed / Sold Out' : 'In Stock'}
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                              title="Edit Item Details"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 4. CSV BULK IMPORT MODAL */}
      <Modal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        title="Bulk Import Menu Items & Prices from CSV"
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-500 leading-relaxed">
            Upload your spreadsheet or CSV file with your food, beverage, and price list. New dishes will be created automatically, and existing dishes with the same name will have their prices updated.
          </p>

          {/* File Picker / Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-stone-50/50 dark:bg-stone-900/50"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <FileSpreadsheet size={32} className="mx-auto text-amber-600 mb-2" />
            <span className="font-bold text-xs text-stone-800 dark:text-stone-200 block">
              Click to select .CSV file or drag & drop
            </span>
            <span className="text-[11px] text-stone-400 block mt-1">
              Columns: Name, Category, Price, Description, PrepTime, Station, IsSpecial
            </span>
          </div>

          {/* Error Banner */}
          {csvError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{csvError}</span>
            </div>
          )}

          {/* Success Banner */}
          {csvSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle size={15} className="shrink-0" />
              <span>{csvSuccessMsg}</span>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {csvRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  Ready to Import: {csvRows.length} Items Detected
                </span>
                <span className="text-[11px] text-stone-400">Previewing first 5 rows:</span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-800">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-stone-100 dark:bg-stone-800 font-bold text-stone-600 dark:text-stone-300">
                    <tr>
                      <th className="p-2">Item Name</th>
                      <th className="p-2">Category</th>
                      <th className="p-2">Price</th>
                      <th className="p-2">Station</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {csvRows.slice(0, 5).map((r, i) => (
                      <tr key={i} className="text-stone-700 dark:text-stone-300">
                        <td className="p-2 font-bold">{r.name}</td>
                        <td className="p-2">{r.category}</td>
                        <td className="p-2 font-extrabold text-amber-600">KES {r.price}</td>
                        <td className="p-2">{r.station}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleImportCsv}
                disabled={csvImporting}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {csvImporting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Importing to Database...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Confirm & Import {csvRows.length} Dishes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* 5. CREATE / EDIT SINGLE ITEM MODAL */}
      <Modal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItem ? `Edit: ${editingItem.name}` : 'Add New Menu Item'}
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Dish Name *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Grilled King Salmon"
              className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Price (KES) *</label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="2500"
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Cost Price (KES)</label>
              <input
                type="number"
                value={formCost}
                onChange={(e) => setFormCost(e.target.value)}
                placeholder="800"
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Category *</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Kitchen Station</label>
              <select
                value={formStation}
                onChange={(e) => setFormStation(e.target.value)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-none"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Description</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Sensory description of flavors, ingredients, and preparation..."
              rows={2}
              className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 items-center">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Prep Time (mins)</label>
              <input
                type="number"
                value={formPrepTime}
                onChange={(e) => setFormPrepTime(parseInt(e.target.value, 10) || 15)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>
            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formSpecial}
                  onChange={(e) => setFormSpecial(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                  <Flame size={13} className="text-amber-500" />
                  <span>Chef's Daily Special</span>
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Image URL</label>
            <input
              type="text"
              value={formImage}
              onChange={(e) => setFormImage(e.target.value)}
              placeholder="https://..."
              className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => setItemModalOpen(false)}
              className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveItem}
              className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md"
            >
              {editingItem ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
