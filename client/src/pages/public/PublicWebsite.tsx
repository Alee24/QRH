import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Tv,
  CreditCard,
  Package,
  ShieldCheck,
  Building2,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  Smartphone,
  Globe,
  Users,
  Check,
  TrendingUp,
  Sliders,
  DollarSign,
  UtensilsCrossed,
  ChefHat,
  Truck,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Layers,
  FileText,
  AlertCircle,
  HelpCircle,
  Send,
  Printer
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';

interface SubscriberHotel {
  tenant_id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  plan_name: string;
  brand_name: string | null;
  custom_logo: string | null;
  address: string | null;
  phone: string | null;
  currency: string;
  outlet_count: number;
  item_count: number;
  sample_table_token: string | null;
  hero_image: string;
  tagline: string;
  cuisine: string;
  subdomain: string;
  showcase_url: string;
}

interface PublicWebsiteProps {
  onNavigateToHotel: (slug: string) => void;
  onLaunchGuestDemo: (tableToken?: string) => void;
  onOpenStaffPortal: () => void;
}

export type PublicPage = 'home' | 'platform' | 'solutions' | 'features' | 'pricing' | 'contact';

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  onNavigateToHotel,
  onLaunchGuestDemo,
  onOpenStaffPortal,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [currentPage, setCurrentPage] = useState<PublicPage>('home');
  const [hotels, setHotels] = useState<SubscriberHotel[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Solution and Feature tab state
  const [activeSolution, setActiveSolution] = useState<'hotel_fnb' | 'fine_dining' | 'casual' | 'chains'>('hotel_fnb');
  const [activeFeature, setActiveFeature] = useState<'qr_order' | 'kds' | 'pos' | 'delivery' | 'catering'>('qr_order');

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    establishment: '',
    propertyType: 'restaurant',
    tableCount: '25',
    notes: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/showcase/hotels')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setHotels(data);
      })
      .catch((err) => console.error('Failed to load showcase hotels', err))
      .finally(() => setLoadingHotels(false));
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 flex flex-col font-sans transition-colors">
      {/* ========================================================= */}
      {/* 1. PUBLIC HEADER NAVIGATION                               */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b border-stone-200 dark:border-stone-800 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white font-black text-lg shadow-xs group-hover:bg-amber-700 transition-colors">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-stone-900 dark:text-white">
                  PlateIQ
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  Cloud
                </span>
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block -mt-0.5">
                Hospitality Management Platform
              </span>
            </div>
          </div>

          {/* Primary Public Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { id: 'home', label: 'Home' },
              { id: 'platform', label: 'Platform' },
              { id: 'solutions', label: 'Solutions' },
              { id: 'features', label: 'Capabilities' },
              { id: 'pricing', label: 'Pricing' },
              { id: 'contact', label: 'Contact & Demo' },
            ].map((nav) => {
              const active = currentPage === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => setCurrentPage(nav.id as PublicPage)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    active
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {nav.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onLaunchGuestDemo()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Live Guest Demo</span>
            </button>

            <button
              onClick={onOpenStaffPortal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs transition"
            >
              <span>Staff Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden border-t border-stone-200 dark:border-stone-800 px-3 py-2 flex items-center justify-between overflow-x-auto no-scrollbar gap-1 text-xs">
          {[
            { id: 'home', label: 'Home' },
            { id: 'platform', label: 'Platform' },
            { id: 'solutions', label: 'Solutions' },
            { id: 'features', label: 'Features' },
            { id: 'pricing', label: 'Pricing' },
            { id: 'contact', label: 'Contact' },
          ].map((nav) => (
            <button
              key={nav.id}
              onClick={() => setCurrentPage(nav.id as PublicPage)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium text-xs ${
                currentPage === nav.id
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {nav.label}
            </button>
          ))}
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. PAGE CONTENT BASED ON CURRENT PUBLIC ROUTE             */}
      {/* ========================================================= */}
      <main className="flex-1">
        {/* --------------------------------------------------------- */}
        {/* VIEW 1: HOME PAGE                                         */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'home' && (
          <div className="space-y-24 pb-24">
            {/* 1.1 Hero Section (Strictly answering the 3 core questions) */}
            <section className="pt-16 sm:pt-20 pb-16 px-4 sm:px-6 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60">
              <div className="max-w-6xl mx-auto space-y-8">
                {/* Product Definition & Segment Header */}
                <div className="max-w-3xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                    <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Hospitality Operations Infrastructure</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 dark:text-white leading-[1.15]">
                    Manage restaurant orders, kitchen operations, payments and deliveries from one platform.
                  </h1>

                  <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
                    PlateIQ is designed for hotels, independent restaurants, and multi-outlet dining groups. It eliminates order taking delays, routes tickets automatically to kitchen cook stations, and consolidates billing with instant Safaricom M-Pesa reconciliation.
                  </p>

                  {/* Primary & Secondary Calls to Action */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => onLaunchGuestDemo()}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-sm shadow-xs transition"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Experience Table QR Ordering</span>
                    </button>

                    <button
                      onClick={() => setCurrentPage('platform')}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 font-semibold text-sm transition"
                    >
                      <span>Explore Platform Architecture</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Practical Hospitality Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-stone-200 dark:border-stone-800">
                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">Customer Access</span>
                    <span className="text-xl font-bold text-stone-900 dark:text-white mt-0.5 block">Zero App Download</span>
                    <span className="text-[11px] text-stone-500 mt-1 block">Runs directly in mobile browser</span>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">Kitchen Routing</span>
                    <span className="text-xl font-bold text-stone-900 dark:text-white mt-0.5 block">Multi-Station KDS</span>
                    <span className="text-[11px] text-stone-500 mt-1 block">Hot, grill, bar & pastry split</span>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">Settlement Method</span>
                    <span className="text-xl font-bold text-stone-900 dark:text-white mt-0.5 block">Daraja M-Pesa STK</span>
                    <span className="text-[11px] text-stone-500 mt-1 block">Automatic phone push & receipting</span>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">Inventory Integration</span>
                    <span className="text-xl font-bold text-stone-900 dark:text-white mt-0.5 block">Recipe BOM Sync</span>
                    <span className="text-[11px] text-stone-500 mt-1 block">Automatic raw stock deduction</span>
                  </div>
                </div>

                {/* Genuine Product Preview (Realistic Interface Presentation) */}
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-md overflow-hidden">
                  <div className="px-4 py-3 bg-stone-100 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Live Operational Environment — PlateIQ Unified POS & KDS</span>
                    </div>
                    <span className="font-mono text-[11px] text-stone-500">Tenant: Grand Heritage Luxury Resort</span>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/50 space-y-3">
                      <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                        <span>1. Table 04 (Lawn Terrace)</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px]">
                          QR Active
                        </span>
                      </div>
                      <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                        Guest scanned standee QR, selected Swahili Snapper and Ribeye Steak, and initiated KES 5,950 settlement via M-Pesa.
                      </p>
                      <div className="pt-2 border-t border-stone-200 dark:border-stone-700 font-mono text-[10px] text-stone-500">
                        Order #ORD-20261104-0062 • Paid
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/50 space-y-3">
                      <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                        <span>2. Charcoal Grill Station</span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px]">
                          Preparing (12m)
                        </span>
                      </div>
                      <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                        Ticket automatically split to Grill cook touchscreen. Chef views Medium-Rare temperature modifier and garlic herb notes.
                      </p>
                      <div className="pt-2 border-t border-stone-200 dark:border-stone-700 font-mono text-[10px] text-stone-500">
                        KOT #KOT-0842 • 2 Items
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/50 space-y-3">
                      <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                        <span>3. Food Runner & Cashier</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px]">
                          Tray Dispatched
                        </span>
                      </div>
                      <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                        Runner notified to deliver tray to Terrace Table 04. Cashier POS updates table folio balance to KES 0.00 with printable receipt.
                      </p>
                      <div className="pt-2 border-t border-stone-200 dark:border-stone-700 font-mono text-[10px] text-stone-500">
                        Receipt #RK11378940 • Closed
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 1.2 The 4 Operational Problems PlateIQ Solves */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
              <div className="max-w-2xl space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Operational Challenges
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
                  Common friction points in restaurant and hotel dining
                </h2>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  How PlateIQ removes bottlenecks between customers, dining floors, and kitchens.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    Delayed order taking during rush hours
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    Waiters frequently get overwhelmed when multiple tables arrive simultaneously. Guests wait up to 20 minutes just to place their initial drink order. PlateIQ allows seated guests to scan and submit their order immediately.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    Handwritten tickets and kitchen miscommunication
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    Verbal special requests, meat temperatures, and allergy warnings get lost between servers and cook lines. PlateIQ routes structured preparation notes directly to the assigned station screen without handwriting errors.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    Manual M-Pesa till reconciliation and bill disputes
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    Cashiers spend hours manually cross-referencing SMS messages from phone numbers against table folios at the end of every shift. PlateIQ initiates Daraja STK pushes that match payments to bills automatically.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    4
                  </div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    Inventory shrinkage and untracked ingredient consumption
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    High-cost proteins and alcoholic beverages vanish without recipe-level visibility. PlateIQ ties every menu item to a Bill of Materials (BOM), deducting grams of meat and milliliters of spirits upon order confirmation.
                  </p>
                </div>
              </div>
            </section>

            {/* 1.3 Subscriber Hotels & Ambiance Showcase */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Hospitality Properties
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white mt-1">
                    Subscriber Hotels Operating on PlateIQ
                  </h2>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                    Each establishment manages isolated dining outlets, digital menus, staff rosters, and financial records.
                  </p>
                </div>

                <button
                  onClick={() => onOpenStaffPortal()}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>Onboard Your Establishment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {loadingHotels ? (
                <div className="p-12 text-center text-xs text-stone-500">Loading hotel network directory...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hotels.map((hotel) => (
                    <div
                      key={hotel.tenant_id}
                      className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden flex flex-col justify-between hover:border-stone-300 dark:hover:border-stone-700 transition"
                    >
                      <div>
                        <div className="h-44 relative bg-stone-100 dark:bg-stone-800 overflow-hidden">
                          <img
                            src={hotel.hero_image}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-black/75 text-amber-300 backdrop-blur">
                            {hotel.subdomain}
                          </div>
                          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/90 dark:bg-stone-900/90 text-stone-800 dark:text-stone-200">
                            {hotel.plan_name}
                          </div>
                        </div>

                        <div className="p-5 space-y-3">
                          <div>
                            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">{hotel.name}</h3>
                            <span className="text-xs text-stone-500 dark:text-stone-400 block mt-0.5">
                              {hotel.cuisine} • {hotel.outlet_count} Outlets
                            </span>
                          </div>

                          <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                            {hotel.tagline}
                          </p>

                          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
                            <span>{hotel.item_count} Menu Items</span>
                            <span>Currency: {hotel.currency}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0 flex gap-2">
                        <button
                          onClick={() => onNavigateToHotel(hotel.slug)}
                          className="flex-1 py-2 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-800 dark:hover:bg-stone-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <span>View Property & Menu</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        {hotel.sample_table_token && (
                          <button
                            onClick={() => onLaunchGuestDemo(hotel.sample_table_token!)}
                            title="Test QR code scan"
                            className="p-2 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
                          >
                            <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 2: PLATFORM ARCHITECTURE                             */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'platform' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-16">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                System Engineering
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white">
                Technical foundation and architecture
              </h1>
              <p className="text-base text-stone-600 dark:text-stone-300 leading-relaxed">
                PlateIQ is built around strict multi-tenancy, real-time WebSocket state machines, and hardware compatibility. Here is how the system functions under load.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">Multi-Tenant Data Isolation</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Every hotel operates in an isolated tenant scope (`tenant_id`). Database queries, WebSocket broadcast channels, file uploads, and session tokens are strictly bound to the authenticated establishment. A hotel administrator cannot view or alter another property's menu or sales figures.
                </p>
                <div className="font-mono text-[11px] p-3 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  SQL Tenant Scoping • Row-Level Security • Audit Logging
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Tv className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">Real-Time WebSocket State Engine</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  When a customer clicks Submit Order on their phone, the request creates database records within a single transaction. Socket.IO emits events (`order:created`, `kds:ticket`) that update KDS touchscreens, food runner queues, and cashier POS displays in under 200 milliseconds.
                </p>
                <div className="font-mono text-[11px] p-3 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  Socket.IO • Event-Driven State Transitions • Sub-second Bump
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">Safaricom Daraja M-Pesa Engine</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Native integration with Safaricom Daraja 2.0 API. Phone numbers entered at checkout receive instant USSD PIN prompts (STK Push). When the guest enters their PIN, Safaricom's webhook updates the table session to Paid, creates a receipt record, and notifies the cashier automatically.
                </p>
                <div className="font-mono text-[11px] p-3 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  Daraja 2.0 STK Push • Async Webhook Verification • 0 Manual SMS
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">POS Hardware & Printing Standards</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Supports standard 80mm and 58mm thermal receipt printers (ESC/POS), cash drawers via RJ11 interface, and bump bars for kitchen display units. Works reliably on touch tablets, Android POS terminals, and desktop browsers.
                </p>
                <div className="font-mono text-[11px] p-3 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  ESC/POS 80mm • Browser Print Layouts • Cash Drawer Triggers
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 3: INDUSTRY SOLUTIONS                                */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'solutions' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-12">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Tailored Configurations
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white">
                Solutions built around your operational model
              </h1>
              <p className="text-base text-stone-600 dark:text-stone-300 leading-relaxed">
                A beach resort operates differently from a high-turnover city bistro. Select your category to see how PlateIQ configures to your workflow.
              </p>
            </div>

            {/* Solution Category Tabs */}
            <div className="flex border-b border-stone-200 dark:border-stone-800 space-x-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'hotel_fnb', label: 'Hotel F&B & Resorts' },
                { id: 'fine_dining', label: 'Fine Dining & Full Service' },
                { id: 'casual', label: 'Casual Dining & Bistros' },
                { id: 'chains', label: 'Multi-Outlet Dining Groups' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSolution(tab.id as any)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                    activeSolution === tab.id
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Solution Detailed Presentation */}
            {activeSolution === 'hotel_fnb' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    Comprehensive Food & Beverage Management for Hotel Properties
                  </h2>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    Designed for hotels operating main dining rooms, terrace verandas, poolside cabanas, and banquet halls. Guests charge dining directly to their resident room folio or settle immediately with M-Pesa.
                  </p>
                  <ul className="space-y-2.5 text-xs text-stone-700 dark:text-stone-300">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Hotel Room Folio Integration:</strong> Validate resident guest room numbers and transfer meal totals to PMS.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Poolside & Cabana Standee QRs:</strong> High-resolution weather-resistant tent card labels with Wi-Fi credentials.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Banquet & Event Catering:</strong> Generate formal BEOs (Banquet Event Orders) with 50% deposit tracking.</span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Key Hotel Workflows</span>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800 flex justify-between items-center">
                      <span className="font-semibold">Terrace Table QR → Bar & Grill KDS</span>
                      <span className="text-emerald-600 font-bold">2.4 min prep</span>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800 flex justify-between items-center">
                      <span className="font-semibold">Room Service 304 Folio Settlement</span>
                      <span className="text-amber-600 font-bold">PMS Confirmed</span>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800 flex justify-between items-center">
                      <span className="font-semibold">Wedding Banquet 250 Pax BEO</span>
                      <span className="text-purple-600 font-bold">50% Paid</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSolution === 'fine_dining' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    Paced Service and Table Governance for Fine Dining
                  </h2>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    Maintains the delicate rhythm of multi-course dining. Split checks by seat number, route sommelier wine selections to the cellar, and notify servers when steaks are ready.
                  </p>
                  <ul className="space-y-2.5 text-xs text-stone-700 dark:text-stone-300">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Multi-Round Ordering:</strong> Add appetizers first, followed by main courses and dessert later under one table tab.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Sommelier Bar Tickets:</strong> Wine bottles and craft cocktails route to bar printers and service queues instantly.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Flexible Split Billing:</strong> Divide totals evenly across party members or split itemized bills accurately.</span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Service Pacing Dashboard</span>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800 flex justify-between items-center">
                      <span className="font-semibold">Table 08 • Round 1 (Appetizers)</span>
                      <span className="text-blue-600 font-bold">Served</span>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800 flex justify-between items-center">
                      <span className="font-semibold">Table 08 • Round 2 (Mains)</span>
                      <span className="text-amber-600 font-bold">Cooking (7m)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSolution === 'casual' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    High-Volume Speed for Casual Bistros and Cafes
                  </h2>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    Designed for fast table turns and counter service. Guests scan, select quick lunch combinations, and pay immediately with M-Pesa.
                  </p>
                  <ul className="space-y-2.5 text-xs text-stone-700 dark:text-stone-300">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Pre-Payment Checkout:</strong> Guests settle at order submission, freeing staff from bringing paper bills later.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Takeaway Packaging Fees:</strong> Automated packaging fee calculation for takeout and pickup orders.</span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Quick-Service Turnaround</span>
                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800 text-xs space-y-2">
                    <div className="flex justify-between font-bold">
                      <span>Order #ORD-0891</span>
                      <span className="text-emerald-600 font-bold">Paid STK</span>
                    </div>
                    <p className="text-stone-500">Chicken Tikka Wrap + Espresso Tonic (Takeaway)</p>
                  </div>
                </div>
              </div>
            )}

            {activeSolution === 'chains' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                    Multi-Branch Governance and Consolidated Reporting
                  </h2>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    Control menu pricing centrally while tracking individual branch performance. Compare kitchen prep speeds and revenue across multiple cities.
                  </p>
                  <ul className="space-y-2.5 text-xs text-stone-700 dark:text-stone-300">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Central Master Menu:</strong> Update prices across 10 locations with a single CSV import.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Branch Performance Benchmarking:</strong> Compare table turnover times and revenue per branch.</span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Multi-Branch Overview</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2.5 rounded bg-stone-50 dark:bg-stone-800">
                      <span>Nairobi CBD Branch</span>
                      <span className="font-bold">KES 342,000 Today</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded bg-stone-50 dark:bg-stone-800">
                      <span>Westlands Outpost</span>
                      <span className="font-bold">KES 489,500 Today</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 4: CAPABILITIES & FEATURE DEEP DIVE                  */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'features' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-12">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Core Capabilities
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white">
                Detailed platform operational features
              </h1>
              <p className="text-base text-stone-600 dark:text-stone-300 leading-relaxed">
                Explore the five integrated operational engines that power day-to-day hospitality service on PlateIQ.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">1. Table QR Ordering</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Cryptographic table tokens prevent URL tampering. Scheduled breakfast, lunch, and dinner menus display automatically. Guests customize portions, doneness, and side modifiers with preparation time indicators.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Tv className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">2. Kitchen Display (KDS)</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Touchscreen bump screen supporting multi-station splitting. Tickets route to Hot Kitchen, Charcoal Grill, Pastry, and Cocktail Bar. Prep timers flag overdue orders and notify food runners the instant plates are assembled.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">3. POS & Cashiering</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Consolidated table sessions support multiple ordering rounds. Split checks, apply promotional discounts, calculate 16% VAT and 2% Catering Levy, and trigger Daraja M-Pesa STK push settlements with thermal receipt printing.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">4. Delivery Dispatch</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Direct online delivery engine without third-party commission deductions. Configurable delivery zones, distance pricing, courier allocation board, and courier mobile portal with proof-of-delivery (POD) signature capture.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">5. Catering & Banquets</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Full lifecycle event management from corporate enquiry to quotation, 50% deposit tracking, and automated Banquet Event Order (BEO) generation with chafing dish and banquet equipment tracking.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-stone-500/10 text-stone-700 dark:text-stone-300 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">6. Inventory & Recipe BOM</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Tie menu items to raw ingredients. Transactional stock deductions decrease Angus beef and wine stocks upon order confirmation, providing accurate cost of goods sold (COGS) and automated reorder alerts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 5: TRANSPARENT PRICING                               */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'pricing' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-12">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Subscription Pricing
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white">
                Predictable monthly subscriptions with zero order commissions
              </h1>
              <p className="text-base text-stone-600 dark:text-stone-300 leading-relaxed">
                Unlike consumer food aggregators, PlateIQ charges a flat monthly fee. You retain 100% of your sales revenue.
              </p>

              {/* Monthly vs Annual Toggle */}
              <div className="inline-flex items-center p-1 rounded-xl bg-stone-200 dark:bg-stone-800 text-xs font-bold">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-1.5 rounded-lg transition ${
                    billingCycle === 'monthly'
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    billingCycle === 'annual'
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <span>Annual Billing</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-600 text-white font-extrabold">Save 15%</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Starter Tier */}
              <div className="p-8 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Starter Outlet</span>
                  <div className="mt-3 text-3xl font-extrabold text-stone-900 dark:text-white">
                    {billingCycle === 'monthly' ? 'KES 9,500' : 'KES 8,075'}
                    <span className="text-xs font-normal text-stone-500"> / month</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
                    Suitable for single-outlet cafes, bistros, and small dining verandas.
                  </p>

                  <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-800 space-y-2.5 text-xs text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Up to <strong>20 Restaurant Tables</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>1 Dining Outlet & 2 Kitchen Stations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Table QR Self-Ordering & KDS Bump Screen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Safaricom Daraja M-Pesa STK Integration</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentPage('contact')}
                  className="w-full py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs transition"
                >
                  Request Starter Setup
                </button>
              </div>

              {/* Growth Tier (Highlighted) */}
              <div className="p-8 rounded-2xl border-2 border-amber-600 dark:border-amber-500 bg-white dark:bg-stone-900 shadow-md relative flex flex-col justify-between space-y-6">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-600 text-white">
                  Most Popular for Restaurants
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Professional Growth</span>
                  <div className="mt-3 text-3xl font-extrabold text-stone-900 dark:text-white">
                    {billingCycle === 'monthly' ? 'KES 24,500' : 'KES 20,825'}
                    <span className="text-xs font-normal text-stone-500"> / month</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
                    For active restaurants needing full KDS station splitting and stock deduction.
                  </p>

                  <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-800 space-y-2.5 text-xs text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Up to <strong>50 Restaurant Tables</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Up to 3 Dining Outlets & 5 Stations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Recipe Bill of Materials (BOM) Depletion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Food Runner Dispatch Queue & Chimes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Delivery Dispatch Fleet Module</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentPage('contact')}
                  className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition"
                >
                  Request Professional Setup
                </button>
              </div>

              {/* Enterprise Tier */}
              <div className="p-8 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Enterprise Hotel & Resort</span>
                  <div className="mt-3 text-3xl font-extrabold text-stone-900 dark:text-white">
                    {billingCycle === 'monthly' ? 'KES 65,000' : 'KES 55,250'}
                    <span className="text-xs font-normal text-stone-500"> / month</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
                    For multi-property hotels requiring PMS room folios and banquet catering.
                  </p>

                  <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-800 space-y-2.5 text-xs text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Up to <strong>150 Tables & 10 Outlets</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Hotel Room PMS Folio Billing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Full Event Catering & BEO Workspace</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Custom Subdomain & White-Label Theming</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentPage('contact')}
                  className="w-full py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs transition"
                >
                  Contact Enterprise Sales
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 6: CONTACT & DEMO REQUEST                            */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'contact' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-10">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Onboarding & Demonstration
              </span>
              <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white">
                Request a dedicated demonstration or establishment onboarding
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Provide your establishment details below and our hospitality technical team will prepare a customized staging tenant for your property.
              </p>
            </div>

            {contactSubmitted ? (
              <div className="p-8 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                  Demonstration Request Received
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-200 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{contactForm.name}</strong>. We have logged your request for <strong>{contactForm.establishment || 'your establishment'}</strong>. Our hospitality deployment team will contact you at <strong>{contactForm.phone || contactForm.email}</strong> within one business day.
                </p>
                <div className="pt-3">
                  <button
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactForm({
                        name: '',
                        email: '',
                        phone: '',
                        establishment: '',
                        propertyType: 'restaurant',
                        tableCount: '25',
                        notes: '',
                      });
                    }}
                    className="btn-secondary text-xs"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="surface-card p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. David Mwangi"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="input-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. david@grandheritage.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="input-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                      Phone Number (Safaricom M-Pesa enabled) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0722 000 000"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="input-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                      Establishment Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mara Serena Safari Lodge"
                      value={contactForm.establishment}
                      onChange={(e) => setContactForm({ ...contactForm, establishment: e.target.value })}
                      className="input-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                      Property Category
                    </label>
                    <select
                      value={contactForm.propertyType}
                      onChange={(e) => setContactForm({ ...contactForm, propertyType: e.target.value })}
                      className="input-base"
                    >
                      <option value="hotel">Hotel, Resort & Lodge</option>
                      <option value="restaurant">Independent Restaurant / Bistro</option>
                      <option value="chain">Multi-Unit Restaurant Chain</option>
                      <option value="cafe">Cafe / Quick Service / Bakery</option>
                      <option value="catering">Catering & Banqueting Company</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                      Approximate Table Count
                    </label>
                    <select
                      value={contactForm.tableCount}
                      onChange={(e) => setContactForm({ ...contactForm, tableCount: e.target.value })}
                      className="input-base"
                    >
                      <option value="10">Under 15 Tables (1 Outlet)</option>
                      <option value="25">15 - 35 Tables (1-2 Outlets)</option>
                      <option value="50">35 - 75 Tables (2-3 Outlets)</option>
                      <option value="150">75+ Tables (Multi-Outlet Hotel)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                    Operational Requirements / Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your current POS, receipt printer requirements, or kitchen stations..."
                    value={contactForm.notes}
                    onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                    className="input-base"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-800">
                  <span className="text-[11px] text-stone-500">
                    Your details remain private and are only used for scheduling your onboarding session.
                  </span>
                  <button type="submit" className="btn-primary text-xs">
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Demonstration Request</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 3. CORPORATE PUBLIC FOOTER                                */}
      {/* ========================================================= */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-12 px-4 sm:px-6 text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-white">
                <div className="w-6 h-6 rounded-lg bg-amber-600 flex items-center justify-center text-white font-extrabold text-xs">
                  P
                </div>
                <span>PlateIQ Technologies Limited</span>
              </div>
              <p className="text-xs text-stone-500 max-w-sm leading-relaxed">
                Hospitality enterprise cloud platform engineered for hotel food & beverage, table self-service QR ordering, touchscreen kitchen routing, and automated Daraja M-Pesa billing.
              </p>
              <div className="text-[11px] text-stone-400 space-y-1">
                <div>HQ: The Mirage Tower, Chiromo Road, Westlands, Nairobi, Kenya</div>
                <div>Support: operations@plateiq.cloud • Tel: +254 700 123 456</div>
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-stone-900 dark:text-stone-200 uppercase tracking-wider text-[11px]">Platform</span>
              <ul className="space-y-1.5">
                <li><button onClick={() => setCurrentPage('platform')} className="hover:text-amber-600">Architecture</button></li>
                <li><button onClick={() => setCurrentPage('features')} className="hover:text-amber-600">Table QR Ordering</button></li>
                <li><button onClick={() => setCurrentPage('features')} className="hover:text-amber-600">Multi-Station KDS</button></li>
                <li><button onClick={() => setCurrentPage('features')} className="hover:text-amber-600">Cashier POS Terminal</button></li>
                <li><button onClick={() => setCurrentPage('features')} className="hover:text-amber-600">Recipe BOM Inventory</button></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-stone-900 dark:text-stone-200 uppercase tracking-wider text-[11px]">Solutions</span>
              <ul className="space-y-1.5">
                <li><button onClick={() => { setCurrentPage('solutions'); setActiveSolution('hotel_fnb'); }} className="hover:text-amber-600">Hotels & Resorts</button></li>
                <li><button onClick={() => { setCurrentPage('solutions'); setActiveSolution('fine_dining'); }} className="hover:text-amber-600">Fine Dining</button></li>
                <li><button onClick={() => { setCurrentPage('solutions'); setActiveSolution('casual'); }} className="hover:text-amber-600">Casual Bistros</button></li>
                <li><button onClick={() => { setCurrentPage('solutions'); setActiveSolution('chains'); }} className="hover:text-amber-600">Restaurant Chains</button></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-stone-900 dark:text-stone-200 uppercase tracking-wider text-[11px]">Access</span>
              <ul className="space-y-1.5">
                <li><button onClick={() => setCurrentPage('pricing')} className="hover:text-amber-600">Subscription Plans</button></li>
                <li><button onClick={() => setCurrentPage('contact')} className="hover:text-amber-600">Request Demo</button></li>
                <li><button onClick={onOpenStaffPortal} className="font-bold text-amber-600 hover:underline">Staff Terminal Sign In</button></li>
                <li><button onClick={() => onLaunchGuestDemo()} className="hover:text-amber-600">Test Table QR Scan</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <span>© 2026 PlateIQ Technologies Ltd. All rights reserved.</span>
            <div className="flex gap-4">
              <span>Safaricom Daraja 2.0 Certified</span>
              <span>PostgreSQL / SQLite Isolated WAL</span>
              <span>Data Protection Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
