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
  Filter,
  Image,
  RefreshCw,
  Zap,
  Tag
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
  spices?: string[];
  is_demo?: number;
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

const COMMON_SPICES = [
  'Mild',
  'Medium',
  'Hot',
  'Extra Spicy',
  'Peri-Peri',
  'Garlic Herb',
  'Smoked Barbecue',
  'Black Truffle & Peppercorn',
  'Swahili Coconut Curry',
  'Lemon Butter & Herb'
];

export const MenuManager: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [stations, setStations] = useState<KitchenStation[]>([]);
  const [systemMode, setSystemMode] = useState<'live' | 'demo'>('live');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialsOnly, setFilterSpecialsOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modeSwitching, setModeSwitching] = useState(false);

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
  const [formSpices, setFormSpices] = useState<string[]>([]);
  const [customSpiceInput, setCustomSpiceInput] = useState('');

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
      if (data.system_mode) {
        setSystemMode(data.system_mode);
      }
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

  // Switch to Live Clean Mode
  const handleSwitchToLiveClean = async () => {
    const confirmed = window.confirm(
      'Switch to Clean Live Production Mode?\n\nThis will purge all demo dishes so that you have a purely empty menu ready for adding your real food items and uploading your custom CSV.'
    );
    if (!confirmed) return;

    setModeSwitching(true);
    try {
      await apiFetch('/hotel/clear-demo', { method: 'POST' });
      setSystemMode('live');
      await loadMenu();
    } catch (err: any) {
      alert(err.message || 'Failed to switch to live mode');
    } finally {
      setModeSwitching(false);
    }
  };

  // Load Showcase Demo Menu
  const handleLoadDemoMenu = async () => {
    setModeSwitching(true);
    try {
      await apiFetch('/hotel/load-demo', { method: 'POST' });
      setSystemMode('demo');
      await loadMenu();
    } catch (err: any) {
      alert(err.message || 'Failed to load demo menu');
    } finally {
      setModeSwitching(false);
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
    setFormSpices([]);
    setCustomSpiceInput('');
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
    setFormSpices(item.spices || []);
    setCustomSpiceInput('');
    setItemModalOpen(true);
  };

  // Toggle spice tag
  const handleToggleSpice = (spice: string) => {
    if (formSpices.includes(spice)) {
      setFormSpices(formSpices.filter((s) => s !== spice));
    } else {
      setFormSpices([...formSpices, spice]);
    }
  };

  const handleAddCustomSpice = () => {
    const trimmed = customSpiceInput.trim();
    if (trimmed && !formSpices.includes(trimmed)) {
      setFormSpices([...formSpices, trimmed]);
      setCustomSpiceInput('');
    }
  };

  // Local Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Dish image must be smaller than 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
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
      spices: formSpices,
      is_demo: 0, // When user creates an item, it's a real live item
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
        const spicesIdx = headers.findIndex((h) => h.includes('spice') || h.includes('seasoning'));

        if (nameIdx === -1 || priceIdx === -1) {
          throw new Error('CSV must contain at least "Name" and "Price" columns.');
        }

        const parsedRows = [];
        for (let i = 1; i < lines.length; i++) {
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
          const spices = spicesIdx !== -1 ? cols[spicesIdx] : '';

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
              spices,
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
      }, 1500);
    } catch (err: any) {
      setCsvError(err.message || 'Failed to import CSV menu items.');
    } finally {
      setCsvImporting(false);
    }
  };

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const csvContent =
      'Name,Category,Price,Description,PrepTime,Station,IsSpecial,Spices\n' +
      'Prime Angus Ribeye Steak (350g),Prime Grill,4200,Flame-seared aged beef with truffle butter,22,station-grill,1,"Medium, Garlic Herb"\n' +
      'Tagliatelle al Tartufo,Mains,2650,Handmade pasta with wild morels and parmesan,15,station-main,0,"Garlic Herb"\n' +
      'Savannah Sunset Negroni,Cocktails,1350,Procera gin with sweet vermouth and flamed orange,5,station-bar,1,""\n' +
      'Highland Passion Honey Dawa,Cocktails,1200,Kenyan cane spirit with muddled lime and stingless bee honey,4,station-bar,0,""\n' +
      'Belgian Dark Chocolate Fondant,Desserts,1450,Warm molten center with Madagascar vanilla gelato,16,station-dessert,1,"Vanilla Bean"\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'menu_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Flatten all items across categories
  const allItems = categories.flatMap((c) => c.items || []);

  // Filter items
  const filteredItems = allItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category_id !== selectedCategory) return false;
    if (selectedStation !== 'all' && item.station_id !== selectedStation) return false;
    if (filterSpecialsOnly && item.is_special !== 1) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-5">
      {/* 1. TOP HEADER & SYSTEM MODE CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <MenuSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Menu & Dishes Manager</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    systemMode === 'live'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                  }`}
                >
                  {systemMode === 'live' ? 'Live Clean Mode' : 'Demo Showcase Mode'}
                </span>
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Manage menu dishes, live prices, spice levels, photo presentation, and bulk CSV uploads.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mode Switcher Buttons */}
          {systemMode === 'demo' ? (
            <button
              onClick={handleSwitchToLiveClean}
              disabled={modeSwitching}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-stone-800 border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition shadow-sm"
              title="Clear all demo items so the live menu is blank for your real food dishes"
            >
              {modeSwitching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Switch to Live Clean Mode</span>
            </button>
          ) : (
            <button
              onClick={handleLoadDemoMenu}
              disabled={modeSwitching}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-stone-800 border border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition shadow-sm"
              title="Load showcase demo food items for demonstration"
            >
              {modeSwitching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Load Demo Dishes</span>
            </button>
          )}

          {/* Import CSV Button */}
          <button
            onClick={() => setCsvModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upload CSV Menu</span>
          </button>

          {/* Add New Item Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-md transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* 2. MODE CONTEXT BANNER */}
      {systemMode === 'live' && allItems.length === 0 ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Utensils className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Your Live Menu is Clean & Ready
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
            All demo items have been cleared. You now have a clean production slate. Add your first dish with prices, spices, and photos, or import your entire menu from a CSV spreadsheet.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Dish</span>
            </button>
            <button
              onClick={() => setCsvModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 transition"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Import via CSV</span>
            </button>
            <button
              onClick={handleLoadDemoMenu}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Preview Demo Items</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* 3. SEARCH & CATEGORY FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes by name, spice, description..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none"
          />
        </div>

        {/* Category & Station Selectors */}
        <div className="flex items-center gap-2">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="all">All Categories ({allItems.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.items?.length || 0})
              </option>
            ))}
          </select>

          {/* Station */}
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="all">All Kitchen Stations</option>
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
                ? 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700'
            }`}
            title="Show Chef Specials Only"
          >
            <Flame size={14} className={filterSpecialsOnly ? 'text-amber-500 fill-amber-500' : ''} />
            <span className="hidden sm:inline">Specials</span>
          </button>
        </div>
      </div>

      {/* 4. DISHES TABLE */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs">
            <Utensils size={32} className="mx-auto mb-2 text-stone-300 dark:text-stone-700" />
            <p className="font-bold text-stone-700 dark:text-stone-300 text-sm">No menu items match your criteria</p>
            <p className="text-stone-500 mt-1">Try adjusting your filters, or click "Add Menu Item" to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Item & Presentation</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Spices / Seasonings</th>
                  <th className="py-2.5 px-3">Station</th>
                  <th className="py-2.5 px-3">Price (KES)</th>
                  <th className="py-2.5 px-3">Prep</th>
                  <th className="py-2.5 px-3">Stock</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
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
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-200 dark:border-stone-800 bg-stone-100"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
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

                      {/* Spices & Seasonings */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.spices && item.spices.length > 0 ? (
                            item.spices.map((s, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-stone-400 text-[10px] italic">Standard</span>
                          )}
                        </div>
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

                      {/* Status Toggle */}
                      <td className="py-2.5 px-3">
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
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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

      {/* 5. CSV BULK IMPORT MODAL */}
      <Modal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        title="Upload Menu Items via CSV Spreadsheet"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
            <span>Import food items, prices, stations, and spices in bulk.</span>
            <button
              onClick={handleDownloadSampleCsv}
              className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
            >
              <Download size={13} />
              <span>Download Template</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-stone-50/50 dark:bg-stone-900/50"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <FileSpreadsheet size={36} className="mx-auto text-amber-600 mb-2" />
            <span className="font-bold text-xs text-stone-800 dark:text-stone-200 block">
              Click to select .CSV file or drag & drop
            </span>
            <span className="text-[11px] text-stone-400 block mt-1">
              Columns: Name, Category, Price, Description, PrepTime, Station, IsSpecial, Spices
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
                  Ready to Import: {csvRows.length} Dishes Detected
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
                      <th className="p-2">Spices</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {csvRows.slice(0, 5).map((r, i) => (
                      <tr key={i} className="text-stone-700 dark:text-stone-300">
                        <td className="p-2 font-bold">{r.name}</td>
                        <td className="p-2">{r.category}</td>
                        <td className="p-2 font-extrabold text-amber-600">KES {r.price}</td>
                        <td className="p-2 text-stone-500">{r.spices || 'Standard'}</td>
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
                    <span>Importing into Live Menu...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Confirm & Import {csvRows.length} Live Dishes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* 6. ADD / EDIT DISH MODAL (With Spices & Image Preview) */}
      <Modal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItem ? `Edit Dish: ${editingItem.name}` : 'Add New Menu Item'}
      >
        <div className="space-y-3.5 text-xs">
          {/* Dish Name */}
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Dish Name *
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Flame Grilled Prime Angus Ribeye Steak"
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-none"
            />
          </div>

          {/* Pricing & Cost */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Selling Price (KES) *
              </label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="2500"
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Food Cost Price (KES)
              </label>
              <input
                type="number"
                value={formCost}
                onChange={(e) => setFormCost(e.target.value)}
                placeholder="800"
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Station */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Category *
              </label>
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
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Kitchen Station Routing
              </label>
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

          {/* Spices & Custom Seasonings */}
          <div className="border-t border-stone-200 dark:border-stone-800 pt-2.5">
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5 flex items-center gap-1.5">
              <Tag size={13} className="text-amber-500" />
              <span>Spices, Seasonings & Heat Levels</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_SPICES.map((sp) => {
                const selected = formSpices.includes(sp);
                return (
                  <button
                    type="button"
                    key={sp}
                    onClick={() => handleToggleSpice(sp)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition border ${
                      selected
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {selected ? `✓ ${sp}` : `+ ${sp}`}
                  </button>
                );
              })}
            </div>

            {/* Custom spice write-in */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customSpiceInput}
                onChange={(e) => setCustomSpiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSpice();
                  }
                }}
                placeholder="Type custom seasoning/spice and press Enter..."
                className="flex-1 p-1.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomSpice}
                className="px-3 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs hover:bg-stone-300"
              >
                Add Spice
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Description & Ingredients
            </label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Sensory description of flavors, ingredients, garnishes..."
              rows={2}
              className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none"
            />
          </div>

          {/* Image Upload & Live Preview */}
          <div className="border-t border-stone-200 dark:border-stone-800 pt-2.5">
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5 flex items-center gap-1.5">
              <Image size={13} className="text-amber-500" />
              <span>Dish Photograph</span>
            </label>

            <div className="flex items-center gap-3">
              {/* Preview Thumbnail */}
              <div className="w-16 h-16 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                {formImage ? (
                  <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Utensils className="w-6 h-6 text-stone-400" />
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="Paste image URL (https://...)"
                  className="w-full p-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-300 transition">
                    <Upload size={12} />
                    <span>Upload Local Photo</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <span className="text-[10px] text-stone-400">JPG, PNG, WebP up to 3MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Prep Time & Special Flag */}
          <div className="grid grid-cols-2 gap-2 items-center border-t border-stone-200 dark:border-stone-800 pt-2.5">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Estimated Prep Time (mins)
              </label>
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
                  <Flame size={13} className="text-amber-500 fill-amber-500" />
                  <span>Chef's Daily Special</span>
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-2">
            <button
              onClick={() => setItemModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveItem}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md"
            >
              {editingItem ? 'Save Dish Changes' : 'Create Live Dish'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
