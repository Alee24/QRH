import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { useTheme, THEME_PRESETS } from '../../context/ThemeContext.js';
import { MasterQrModal } from '../../components/MasterQrModal.js';
import {
  Building2,
  CreditCard,
  Mail,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  Upload,
  Coins,
  Percent,
  Check,
  Zap,
  Globe,
  Sliders,
  HelpCircle,
  FileText,
  QrCode,
  Printer,
  Palette
} from 'lucide-react';

interface HotelSettingsData {
  id: string;
  tenant_id: string;
  name: string;
  legal_name: string;
  tax_pin: string;
  currency: string;
  phone: string;
  email: string;
  address: string;
  logo_url: string;
  vat_rate: number;
  catering_levy_rate: number;
  service_charge_rate: number;
  system_mode: 'live' | 'demo';

  // M-Pesa
  mpesa_consumer_key: string;
  mpesa_consumer_secret: string;
  mpesa_shortcode: string;
  mpesa_passkey: string;
  mpesa_callback_url: string;
  mpesa_environment: 'sandbox' | 'production';
  mpesa_enabled: boolean;

  // SMTP
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_from_address: string;
  smtp_enabled: boolean;

  // Payment methods
  payment_methods: string[];
}

export const HotelSettings: React.FC = () => {
  const { currentPreset, setThemePreset, refreshBranding } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'mpesa' | 'email' | 'payments' | 'themes'>('general');
  const [masterQrModalOpen, setMasterQrModalOpen] = useState(false);
  const [showMpesaSecret, setShowMpesaSecret] = useState(false);
  const [showMpesaPasskey, setShowMpesaPasskey] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<HotelSettingsData>({
    id: '',
    tenant_id: '',
    name: '',
    legal_name: '',
    tax_pin: '',
    currency: 'KES',
    phone: '',
    email: '',
    address: '',
    logo_url: '',
    vat_rate: 16.0,
    catering_levy_rate: 2.0,
    service_charge_rate: 0.0,
    system_mode: 'live',

    mpesa_consumer_key: '',
    mpesa_consumer_secret: '',
    mpesa_shortcode: '',
    mpesa_passkey: '',
    mpesa_callback_url: '',
    mpesa_environment: 'sandbox',
    mpesa_enabled: true,

    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_from_address: '',
    smtp_enabled: false,

    payment_methods: ['mpesa', 'cash', 'card', 'bank_transfer', 'room_charge'],
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<HotelSettingsData>('/hotel/settings');
      setFormData(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load hotel configuration.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/hotel/settings', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      setFeedback({ type: 'success', message: res.message || 'Hotel settings updated successfully!' });
      // Reload updated settings and trigger global branding refresh
      fetchSettings();
      refreshBranding().catch(() => {});
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update hotel settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePaymentMethod = (method: string) => {
    setFormData((prev) => {
      const exists = prev.payment_methods.includes(method);
      const nextMethods = exists
        ? prev.payment_methods.filter((m) => m !== method)
        : [...prev.payment_methods, method];
      return { ...prev, payment_methods: nextMethods };
    });
  };

  const handleSwitchToLiveClean = async () => {
    const confirm = window.confirm(
      'Switch to Live Clean Mode?\n\nThis will purge all demo dishes and leave your system clean and blank, ready for adding your real menu items, staff, and pricing.'
    );
    if (!confirm) return;

    setSaving(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/hotel/clear-demo', {
        method: 'POST',
      });
      setFormData((prev) => ({ ...prev, system_mode: 'live' }));
      setFeedback({ type: 'success', message: res.message });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to switch to live mode.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLoadDemoMenu = async () => {
    const confirm = window.confirm(
      'Load Demo Menu Items?\n\nThis will populate 6 gourmet showcase dishes (Ribeye Steak, Tagliatelle, Negroni, Dawa, Chocolate Fondant, English Breakfast) for preview and testing.'
    );
    if (!confirm) return;

    setSaving(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/hotel/load-demo', {
        method: 'POST',
      });
      setFormData((prev) => ({ ...prev, system_mode: 'demo' }));
      setFeedback({ type: 'success', message: res.message });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load demo menu.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image must be smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, logo_url: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="font-semibold text-lg">Loading Hotel Settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Hotel Details & System Credentials
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Manage your establishment profile, M-Pesa Daraja keys, email SMTP, taxes, and system mode.
              </p>
            </div>
          </div>
        </div>

        {/* Live vs Demo Pill & Quick Action */}
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 border shadow-sm ${
              formData.system_mode === 'live'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                formData.system_mode === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="uppercase tracking-wider">
              {formData.system_mode === 'live' ? 'Live Production Mode' : 'Demo Showcase Mode'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMasterQrModalOpen(true)}
            className="flex items-center space-x-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <QrCode className="w-4 h-4 text-amber-500" />
            <span>Print Master Hotel QR</span>
          </button>

          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* System Mode Switcher Quick Card */}
      <div className="bg-stone-100/80 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                System Mode Control: Live Production vs. Demo Showcase
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
              When switched to <strong>Live Production Mode</strong>, all demo food items are cleared so you can add your
              own genuine restaurant dishes, upload your menu CSV, configure custom prices, and onboard your real staff.
              You can toggle back to <strong>Demo Showcase Mode</strong> anytime to show stakeholders the pre-configured
              food presentation.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleSwitchToLiveClean}
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border shadow-sm ${
                formData.system_mode === 'live'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Switch to Live Clean Mode (Purge Demo)</span>
            </button>

            <button
              type="button"
              onClick={handleLoadDemoMenu}
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border shadow-sm ${
                formData.system_mode === 'demo'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-amber-500/20'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Demo Showcase Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-2 border-b border-stone-200 dark:border-stone-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition border-b-2 whitespace-nowrap ${
            activeTab === 'general'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Hotel Profile & Taxes</span>
        </button>

        <button
          onClick={() => setActiveTab('mpesa')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition border-b-2 whitespace-nowrap ${
            activeTab === 'mpesa'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>Safaricom Daraja M-Pesa</span>
        </button>

        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition border-b-2 whitespace-nowrap ${
            activeTab === 'email'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email & SMTP Credentials</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition border-b-2 whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Supported Payment Methods</span>
        </button>

        <button
          onClick={() => setActiveTab('themes')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition border-b-2 whitespace-nowrap ${
            activeTab === 'themes'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Palette className="w-4 h-4 text-amber-500" />
          <span>App Themes (10 Presets)</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: GENERAL & HOTEL PROFILE */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="space-y-4 md:col-span-2">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <span>Establishment Identity</span>
              </h2>
              <p className="text-xs text-stone-500">
                This legal and branding information appears on thermal receipts, customer QR menu headers, and KRA tax invoices.
              </p>
            </div>

            {/* Hotel Display Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Hotel / Restaurant Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Grand Heritage Hotel & Resort"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Legal Entity Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Legal Entity / Company Name
              </label>
              <input
                type="text"
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                placeholder="e.g. Grand Heritage Hospitality Ltd"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* KRA PIN */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Tax Identification / KRA PIN
              </label>
              <input
                type="text"
                value={formData.tax_pin}
                onChange={(e) => setFormData({ ...formData, tax_pin: e.target.value })}
                placeholder="e.g. P051239842M"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none font-mono"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Billing Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
              >
                <option value="KES">KES - Kenyan Shilling (KSh)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="TZS">TZS - Tanzanian Shilling (TSh)</option>
                <option value="UGX">UGX - Ugandan Shilling (USh)</option>
              </select>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Official Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+254 700 123 456"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Official Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="reservations@yourhotel.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Physical Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Physical Street Address & Location
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Argwings Kodhek Rd, Kilimani, Nairobi"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Logo Image Upload / Preview */}
            <div className="md:col-span-2 border-t border-stone-200 dark:border-stone-800 pt-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                Hotel Logo Image
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {formData.logo_url ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-stone-100 dark:bg-stone-800 p-2 flex items-center justify-center flex-shrink-0">
                    <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 flex items-center justify-center text-stone-400 flex-shrink-0">
                    <Building2 className="w-8 h-8" />
                  </div>
                )}

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="Paste image URL or browse local file below..."
                      className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="cursor-pointer inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Local File</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    <span className="text-xs text-stone-400">PNG, JPG, SVG or WebP up to 2MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Taxes & Levies Section */}
            <div className="md:col-span-2 border-t border-stone-200 dark:border-stone-800 pt-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-3 flex items-center space-x-2">
                <Percent className="w-4 h-4 text-amber-600" />
                <span>Statutory Taxes & Restaurant Levies</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Value Added Tax (VAT %)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.vat_rate}
                    onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold"
                  />
                  <span className="text-[11px] text-stone-400">Standard Kenya VAT is 16.0%</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Catering Levy (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.catering_levy_rate}
                    onChange={(e) => setFormData({ ...formData, catering_levy_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold"
                  />
                  <span className="text-[11px] text-stone-400">Tourism Fund Levy is 2.0%</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Service Charge (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.service_charge_rate}
                    onChange={(e) => setFormData({ ...formData, service_charge_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold"
                  />
                  <span className="text-[11px] text-stone-400">Optional staff service charge (e.g. 5-10%)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SAFARICOM DARAJA M-PESA */}
        {activeTab === 'mpesa' && (
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    M
                  </span>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    Safaricom Daraja 2.0 M-Pesa Gateway
                  </h2>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Enables instant STK Push prompts directly to guest smartphones upon checkout at tables and cashier POS.
                </p>
              </div>

              {/* M-Pesa Active Toggle */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  {formData.mpesa_enabled ? 'M-Pesa STK Active' : 'M-Pesa Disabled'}
                </span>
                <input
                  type="checkbox"
                  checked={formData.mpesa_enabled}
                  onChange={(e) => setFormData({ ...formData, mpesa_enabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Environment Toggle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Gateway Environment
                </label>
                <select
                  value={formData.mpesa_environment}
                  onChange={(e) => setFormData({ ...formData, mpesa_environment: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold"
                >
                  <option value="sandbox">Sandbox Test Simulator (Test Credentials)</option>
                  <option value="production">Production Live (Real Money Transactions)</option>
                </select>
              </div>

              {/* Shortcode / Till */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Business Shortcode / Till Number / Paybill *
                </label>
                <input
                  type="text"
                  value={formData.mpesa_shortcode}
                  onChange={(e) => setFormData({ ...formData, mpesa_shortcode: e.target.value })}
                  placeholder="e.g. 174379 or 600999"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono"
                />
              </div>

              {/* Consumer Key */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Daraja Consumer Key
                </label>
                <input
                  type="text"
                  value={formData.mpesa_consumer_key}
                  onChange={(e) => setFormData({ ...formData, mpesa_consumer_key: e.target.value })}
                  placeholder="Paste Consumer Key from Safaricom Developer Portal"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-xs"
                />
              </div>

              {/* Consumer Secret */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Daraja Consumer Secret
                </label>
                <div className="relative">
                  <input
                    type={showMpesaSecret ? 'text' : 'password'}
                    value={formData.mpesa_consumer_secret}
                    onChange={(e) => setFormData({ ...formData, mpesa_consumer_secret: e.target.value })}
                    placeholder="Enter or replace Consumer Secret"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMpesaSecret(!showMpesaSecret)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                  >
                    {showMpesaSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Passkey */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Lipa Na M-Pesa Online Passkey
                </label>
                <div className="relative">
                  <input
                    type={showMpesaPasskey ? 'text' : 'password'}
                    value={formData.mpesa_passkey}
                    onChange={(e) => setFormData({ ...formData, mpesa_passkey: e.target.value })}
                    placeholder="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMpesaPasskey(!showMpesaPasskey)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                  >
                    {showMpesaPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Callback URL */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  M-Pesa Webhook Callback URL
                </label>
                <input
                  type="url"
                  value={formData.mpesa_callback_url}
                  onChange={(e) => setFormData({ ...formData, mpesa_callback_url: e.target.value })}
                  placeholder="https://pos.yourhotel.com/api/payment/mpesa/callback"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-xs"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Safaricom sends the cryptographic transaction payload and confirmation status to this endpoint.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EMAIL & SMTP CREDENTIALS */}
        {activeTab === 'email' && (
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-amber-600" />
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    SMTP Email Server Configuration
                  </h2>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Used for dispatching digital customer receipts, catering proposals, and staff notifications.
                </p>
              </div>

              <label className="flex items-center space-x-3 cursor-pointer">
                <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  {formData.smtp_enabled ? 'SMTP Enabled' : 'SMTP Disabled'}
                </span>
                <input
                  type="checkbox"
                  checked={formData.smtp_enabled}
                  onChange={(e) => setFormData({ ...formData, smtp_enabled: e.target.checked })}
                  className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Host */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  SMTP Host Server
                </label>
                <input
                  type="text"
                  value={formData.smtp_host}
                  onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                  placeholder="e.g. smtp.gmail.com or mail.yourhotel.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-xs"
                />
              </div>

              {/* Port */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  SMTP Port
                </label>
                <select
                  value={formData.smtp_port}
                  onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value, 10) || 587 })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold"
                >
                  <option value={587}>Port 587 (TLS / STARTTLS - Recommended)</option>
                  <option value={465}>Port 465 (SSL Encrypted)</option>
                  <option value={25}>Port 25 (Standard Unencrypted)</option>
                </select>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  SMTP Username / Auth Account
                </label>
                <input
                  type="text"
                  value={formData.smtp_username}
                  onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
                  placeholder="e.g. notifications@yourhotel.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-xs"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  SMTP Password / App Password
                </label>
                <div className="relative">
                  <input
                    type={showSmtpPassword ? 'text' : 'password'}
                    value={formData.smtp_password}
                    onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                    placeholder="Enter or update SMTP Password"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                  >
                    {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sender Email Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Sender From Address (Header)
                </label>
                <input
                  type="email"
                  value={formData.smtp_from_address}
                  onChange={(e) => setFormData({ ...formData, smtp_from_address: e.target.value })}
                  placeholder="Grand Heritage Receipts <billing@yourhotel.com>"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SUPPORTED PAYMENT METHODS */}
        {activeTab === 'payments' && (
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <span>Supported Customer & Cashier Payment Options</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Select which payment tenders are accepted across the customer self-checkout and cashier POS terminals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  id: 'mpesa',
                  title: 'Safaricom M-Pesa',
                  desc: 'Mobile STK Push & Till Number with automatic instant reconciliation',
                  badge: 'Instant STK',
                  color: 'emerald',
                },
                {
                  id: 'cash',
                  title: 'Cash at Till',
                  desc: 'Traditional physical cash drawer settlement with change calculation',
                  badge: 'POS Drawer',
                  color: 'amber',
                },
                {
                  id: 'card',
                  title: 'Credit / Debit Cards',
                  desc: 'Visa, MasterCard, and American Express terminal settlement',
                  badge: 'Terminal',
                  color: 'blue',
                },
                {
                  id: 'bank_transfer',
                  title: 'Direct Bank Transfer / Wire',
                  desc: 'Direct RTGS/EFT settlement with bank transaction reference capture',
                  badge: 'B2B / Events',
                  color: 'indigo',
                },
                {
                  id: 'room_charge',
                  title: 'Hotel Room Charge (PMS)',
                  desc: 'Transfer dining bill to resident guest hotel room folio',
                  badge: 'Resident Guest',
                  color: 'purple',
                },
              ].map((m) => {
                const active = formData.payment_methods.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => handleTogglePaymentMethod(m.id)}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      active
                        ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20'
                        : 'border-stone-200 dark:border-stone-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100">{m.title}</span>
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => {}}
                        className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 mb-3">{m.desc}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 w-fit">
                      {m.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: APP THEMES (10 PRESETS) */}
        {activeTab === 'themes' && (
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                  <Palette className="w-5 h-5 text-amber-600" />
                  <span>Select Application Color Theme (10 Designer Palettes)</span>
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Customizes the entire application styling in real time, including the customer QR ordering menu, KDS kitchen tickets, Cashier POS terminal, and back-office management dashboards.
                </p>
              </div>
              <div className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero Reload Instant Switch</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {THEME_PRESETS.map((preset) => {
                const isActive = currentPreset.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setThemePreset(preset.id)}
                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all transform hover:-translate-y-1 relative flex flex-col justify-between ${
                      isActive
                        ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-lg ring-2 ring-amber-500/30'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50'
                    }`}
                  >
                    <div>
                      {/* Gradient Bar */}
                      <div className={`h-2.5 w-full rounded-full bg-gradient-to-r ${preset.previewGradient} mb-4 shadow-xs`} />

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">{preset.name}</h3>
                          <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">{preset.tagline}</p>
                        </div>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-4 h-4 rounded-full border border-white dark:border-stone-900 shadow-xs"
                          style={{ backgroundColor: preset.primaryColor }}
                          title={`Primary: ${preset.primaryColor}`}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white dark:border-stone-900 shadow-xs"
                          style={{ backgroundColor: preset.accentColor }}
                          title={`Accent: ${preset.accentColor}`}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white dark:border-stone-900 shadow-xs"
                          style={{ backgroundColor: preset.secondaryColor }}
                          title={`Secondary: ${preset.secondaryColor}`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setThemePreset(preset.id);
                        }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                          isActive
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600'
                        }`}
                      >
                        {isActive ? 'Current Theme' : 'Activate Theme'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-200 dark:border-stone-800">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Hotel Settings & Credentials</span>
          </button>
        </div>
      </form>

      {/* Printable Master QR Standee Modal */}
      <MasterQrModal isOpen={masterQrModalOpen} onClose={() => setMasterQrModalOpen(false)} />
    </div>
  );
};
