import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sliders,
  Type,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  Building,
  FileText,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useTheme, PlatformBranding } from '../../context/ThemeContext';

interface TenantSummary {
  id: string;
  name: string;
  slug: string;
}

export const BrandingCenter: React.FC = () => {
  const { branding, refreshBranding, setCustomBranding } = useTheme();

  const [activeTab, setActiveTab] = useState<'global' | 'tenants'>('global');
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  // Global Settings Form
  const [globalForm, setGlobalForm] = useState<PlatformBranding>({ ...branding });
  const [tenantForm, setTenantForm] = useState({
    brand_name: '',
    logo_url: '',
    primary_color: '#059669',
    secondary_color: '#064e3b',
    accent_color: '#d97706',
    receipt_header: '',
    receipt_footer: '',
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Load list of tenants
    const token = localStorage.getItem('auth_token');
    fetch('/api/saas/tenants', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTenants(data);
          if (data.length > 0) {
            setSelectedTenantId(data[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load tenants for branding', err));
  }, []);

  useEffect(() => {
    setGlobalForm({ ...branding });
  }, [branding]);

  // When selected tenant changes, load their branding
  useEffect(() => {
    if (!selectedTenantId) return;
    fetch(`/api/branding/tenant/${selectedTenantId}`)
      .then((res) => res.json())
      .then((data) => {
        setTenantForm({
          brand_name: data.brand_name || '',
          logo_url: data.logo_url || '',
          primary_color: data.primary_color || '#ca8a26',
          secondary_color: data.secondary_color || '#1c1917',
          accent_color: data.accent_color || '#2563eb',
          receipt_header: data.receipt_header || '',
          receipt_footer: data.receipt_footer || '',
        });
      })
      .catch((err) => console.error('Failed to load tenant branding', err));
  }, [selectedTenantId]);

  // Real-time live preview update
  const handleColorChange = (field: keyof PlatformBranding, value: string) => {
    const updated = { ...globalForm, [field]: value };
    setGlobalForm(updated);
    setCustomBranding({ [field]: value });
  };

  const handleGlobalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/branding/platform', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(globalForm),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await refreshBranding();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save appearance settings');
      }
    } catch (err) {
      console.error('Failed to save appearance', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTenantSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/branding/tenant/${selectedTenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tenantForm),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save tenant branding');
      }
    } catch (err) {
      console.error('Failed to save tenant branding', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              White-Label Engine
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Zero-Recompile Runtime CSS Injection
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
            Branding & Appearance Studio
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Configure global SaaS identity, client-facing themes, and hotel tenant white-label overrides with instant live preview.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'global'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Global SaaS Platform Theme
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'tenants'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Tenant White-Label Overrides
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-2 text-sm font-medium animate-fade-in">
          <CheckCircle2 className="w-5 h-5" />
          Appearance settings saved successfully! Runtime CSS variables and theme properties updated.
        </div>
      )}

      {/* Main Studio Layout: Form on Left, Live Interactive Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Form Column */}
        <div className="lg:col-span-7 space-y-6">
          {activeTab === 'global' ? (
            <form onSubmit={handleGlobalSave} className="space-y-6">
              {/* Identity & Naming Card */}
              <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <Building className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">Platform Identity</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Platform Brand Name
                    </label>
                    <input
                      type="text"
                      value={globalForm.platform_name}
                      onChange={(e) => setGlobalForm({ ...globalForm, platform_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Parent Company Name
                    </label>
                    <input
                      type="text"
                      value={globalForm.company_name}
                      onChange={(e) => setGlobalForm({ ...globalForm, company_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={globalForm.support_email}
                      onChange={(e) => setGlobalForm({ ...globalForm, support_email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Support Phone Hotline
                    </label>
                    <input
                      type="text"
                      value={globalForm.support_phone}
                      onChange={(e) => setGlobalForm({ ...globalForm, support_phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Platform Logo URL
                  </label>
                  <input
                    type="url"
                    value={globalForm.logo_url || ''}
                    onChange={(e) => setGlobalForm({ ...globalForm, logo_url: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Theme Styling & Color Palette Card */}
              <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <Palette className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">Color System & Geometry</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Primary Brand Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={globalForm.primary_color}
                        onChange={(e) => handleColorChange('primary_color', e.target.value)}
                        className="w-9 h-9 rounded-lg border border-stone-300 dark:border-stone-700 cursor-pointer p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        value={globalForm.primary_color}
                        onChange={(e) => handleColorChange('primary_color', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white uppercase"
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Secondary Tone
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={globalForm.secondary_color}
                        onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                        className="w-9 h-9 rounded-lg border border-stone-300 dark:border-stone-700 cursor-pointer p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        value={globalForm.secondary_color}
                        onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white uppercase"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={globalForm.accent_color}
                        onChange={(e) => handleColorChange('accent_color', e.target.value)}
                        className="w-9 h-9 rounded-lg border border-stone-300 dark:border-stone-700 cursor-pointer p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        value={globalForm.accent_color}
                        onChange={(e) => handleColorChange('accent_color', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Global Corner Radius
                    </label>
                    <select
                      value={globalForm.border_radius}
                      onChange={(e) => handleColorChange('border_radius', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none"
                    >
                      <option value="6px">Subtle (6px)</option>
                      <option value="12px">Modern (12px)</option>
                      <option value="16px">Smooth Rounded (16px - Default)</option>
                      <option value="24px">Curved Pill (24px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Typography Scale
                    </label>
                    <select
                      value={globalForm.font_family}
                      onChange={(e) => setGlobalForm({ ...globalForm, font_family: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none"
                    >
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Clean)</option>
                      <option value="Inter">Inter (High Legibility)</option>
                      <option value="Outfit">Outfit (Contemporary)</option>
                      <option value="Playfair Display">Playfair Display (Luxury Hotel Serif)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Publishing Changes...' : 'Publish Global Platform Appearance'}
                </button>
              </div>
            </form>
          ) : (
            /* Tenant Overrides Form */
            <form onSubmit={handleTenantSave} className="space-y-6">
              <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                      Target Hotel Tenant
                    </h3>
                  </div>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white font-semibold"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Hotel Custom Display Brand
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Serena Safari Lodge"
                      value={tenantForm.brand_name}
                      onChange={(e) => setTenantForm({ ...tenantForm, brand_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Custom Logo URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={tenantForm.logo_url}
                      onChange={(e) => setTenantForm({ ...tenantForm, logo_url: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Hotel Brand Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={tenantForm.primary_color}
                        onChange={(e) => setTenantForm({ ...tenantForm, primary_color: e.target.value })}
                        className="w-9 h-9 rounded-lg border border-stone-300 dark:border-stone-700 cursor-pointer p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        value={tenantForm.primary_color}
                        onChange={(e) => setTenantForm({ ...tenantForm, primary_color: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Accent Highlight
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={tenantForm.accent_color}
                        onChange={(e) => setTenantForm({ ...tenantForm, accent_color: e.target.value })}
                        className="w-9 h-9 rounded-lg border border-stone-300 dark:border-stone-700 cursor-pointer p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        value={tenantForm.accent_color}
                        onChange={(e) => setTenantForm({ ...tenantForm, accent_color: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Thermal Receipt Header
                  </label>
                  <textarea
                    rows={2}
                    value={tenantForm.receipt_header}
                    onChange={(e) => setTenantForm({ ...tenantForm, receipt_header: e.target.value })}
                    placeholder="Serena Safari Lodge & Savanna Grill&#10;Maasai Mara Game Reserve"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-stone-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Thermal Receipt Footer
                  </label>
                  <input
                    type="text"
                    value={tenantForm.receipt_footer}
                    onChange={(e) => setTenantForm({ ...tenantForm, receipt_footer: e.target.value })}
                    placeholder="Experience wild luxury with Serena"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-stone-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Tenant White-Label Overrides'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Live Interactive Preview Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <Eye className="w-4 h-4 text-amber-500" />
                Live Theme Preview
              </span>
              <span className="text-[11px] text-stone-400">Updates dynamically</span>
            </div>

            {/* Interactive Preview Canvas */}
            <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-lg space-y-6">
              {/* Mock Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-sm"
                    style={{ backgroundColor: activeTab === 'global' ? globalForm.primary_color : tenantForm.primary_color }}
                  >
                    {activeTab === 'global' ? 'PIQ' : (tenantForm.brand_name.slice(0, 2).toUpperCase() || 'HT')}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-stone-900 dark:text-white">
                      {activeTab === 'global' ? globalForm.platform_name : (tenantForm.brand_name || 'Hotel Name')}
                    </div>
                    <div className="text-[10px] text-stone-400">Digital Menu & Ordering</div>
                  </div>
                </div>
                <div
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: activeTab === 'global' ? globalForm.accent_color : tenantForm.accent_color }}
                >
                  Table 04
                </div>
              </div>

              {/* Sample UI Elements */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Interactive Components
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    style={{
                      backgroundColor: activeTab === 'global' ? globalForm.primary_color : tenantForm.primary_color,
                      borderRadius: globalForm.border_radius,
                    }}
                    className="px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                  >
                    Primary Action
                  </button>
                  <button
                    type="button"
                    style={{
                      borderRadius: globalForm.border_radius,
                      borderColor: activeTab === 'global' ? globalForm.primary_color : tenantForm.primary_color,
                      color: activeTab === 'global' ? globalForm.primary_color : tenantForm.primary_color,
                    }}
                    className="px-4 py-2 text-xs font-bold border hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                  >
                    Secondary Outline
                  </button>
                </div>
              </div>

              {/* Sample Receipt Component */}
              <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/30 font-mono text-[11px] space-y-2">
                <div className="text-center font-bold text-stone-900 dark:text-white whitespace-pre-line">
                  {activeTab === 'tenants' && tenantForm.receipt_header
                    ? tenantForm.receipt_header
                    : 'Grand Heritage Hotel & Resort\nArgwings Kodhek Rd, Kilimani'}
                </div>
                <div className="border-b border-dashed border-stone-300 dark:border-stone-700 pb-2">
                  <div className="flex justify-between">
                    <span>1x Angus Prime Ribeye</span>
                    <span>3,600.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1x Savannah Sunset</span>
                    <span>1,350.00</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-stone-900 dark:text-white">
                  <span>TOTAL (KES):</span>
                  <span>4,950.00</span>
                </div>
                <div className="text-center text-[10px] text-stone-400 pt-1">
                  {activeTab === 'tenants' && tenantForm.receipt_footer
                    ? tenantForm.receipt_footer
                    : 'Thank you for fine dining with Grand Heritage'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
