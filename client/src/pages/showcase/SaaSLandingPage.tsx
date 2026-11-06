import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Tv,
  CreditCard,
  Package,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  Star,
  ExternalLink,
  Smartphone,
  Flame,
  Award,
  Globe,
  Users,
  Check,
  TrendingUp,
  Sliders,
  DollarSign,
  UtensilsCrossed,
} from 'lucide-react';

interface SubscriberHotel {
  tenant_id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  plan_name: string;
  brand_name: string | null;
  custom_logo: string | null;
  primary_color: string | null;
  accent_color: string | null;
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

interface SaaSLandingPageProps {
  onNavigateToHotel: (slug: string) => void;
  onLaunchGuestDemo: (tableToken?: string) => void;
  onOpenStaffPortal: () => void;
}

export const SaaSLandingPage: React.FC<SaaSLandingPageProps> = ({
  onNavigateToHotel,
  onLaunchGuestDemo,
  onOpenStaffPortal,
}) => {
  const [hotels, setHotels] = useState<SubscriberHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlanTab, setActivePlanTab] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    fetch('/api/showcase/hotels')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHotels(data);
        }
      })
      .catch((err) => console.error('Failed to load showcase hotels', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0e0d] text-stone-100 selection:bg-amber-500 selection:text-black font-sans">
      {/* 1. TOP ANNOUNCEMENT & GLOBAL BRAND NAVIGATION */}
      <div className="border-b border-stone-800/80 bg-stone-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-amber-600/20">
              S
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                Sironi Restaurants Cloud
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Hospitality SaaS
                </span>
              </span>
              <span className="text-[11px] text-stone-400 block -mt-0.5">
                Restaurant & Hotel Multi-Tenant POS Platform
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-stone-300">
            <a href="#subscribers" className="hover:text-amber-400 transition-colors">
              Featured Subscriber Hotels
            </a>
            <a href="#pillars" className="hover:text-amber-400 transition-colors">
              Pillars of Operation
            </a>
            <a href="#kds-demo" className="hover:text-amber-400 transition-colors">
              Multi-Station KDS
            </a>
            <a href="#pricing" className="hover:text-amber-400 transition-colors">
              SaaS Plans
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onLaunchGuestDemo()}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-stone-700 hover:border-amber-500/60 bg-stone-900/60 hover:bg-stone-800 text-stone-200 transition-all"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              Live QR Demo
            </button>
            <button
              onClick={onOpenStaffPortal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-700/20 transition-all"
            >
              Staff Sign In
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. ATMOSPHERIC EDITORIAL HERO */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 overflow-hidden border-b border-stone-800/60">
        {/* Ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-amber-600/10 blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10 space-y-6">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Hotel & Restaurant Operating System
            <span className="block text-amber-400 mt-2">
              For Contactless Table Ordering & Station Dispatch
            </span>
          </h1>

          <p className="text-base sm:text-lg text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Guests sit, scan unique table QR codes, explore scheduled menus, and submit orders directly to kitchen stations. Consolidated billing, Daraja M-Pesa push, and inventory BOM deductions in one unified cloud.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onLaunchGuestDemo()}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <QrCode className="w-4 h-4" />
              Scan Table 01 & Order Food
            </button>
            <a
              href="#subscribers"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-stone-500 text-stone-200 font-bold text-sm transition-all"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              Explore Subscriber Hotels
            </a>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-14 border-t border-stone-800/80 text-left">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">0s</div>
              <div className="text-xs text-stone-400 font-medium">App Installation Required</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">&lt; 30s</div>
              <div className="text-xs text-stone-400 font-medium">Scan to Kitchen Ticket</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">100%</div>
              <div className="text-xs text-stone-400 font-medium">BOM Recipe Stock Accuracy</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">Multi-Tenant</div>
              <div className="text-xs text-stone-400 font-medium">Isolated Subscriber Clouds</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SUBSCRIBER HOTELS DIRECTORY SHOWCASE */}
      <section id="subscribers" className="py-24 px-4 sm:px-6 bg-stone-950">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-stone-800 pb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">
                <Globe className="w-4 h-4" />
                Hospitality Subscriber Network
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Each Subscriber Hotel Commands Its Own Landing Page & Day's Menu
              </h2>
              <p className="text-sm text-stone-400 mt-2 max-w-2xl">
                Every independent property operates under their bespoke subdomain, showcasing their architectural ambiance, chef's scheduled daily menu, and instant table QR ordering.
              </p>
            </div>

            <div className="text-xs text-stone-400 bg-stone-900 border border-stone-800 px-4 py-2.5 rounded-xl shrink-0">
              <span className="font-bold text-emerald-400">● 100% Isolated Data:</span> Tables, Menus, Outlets, & Cashier
            </div>
          </div>

          {/* Subscriber Hotel Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <div
                key={hotel.tenant_id}
                className="group rounded-3xl border border-stone-800/80 bg-stone-900/60 hover:bg-stone-900 overflow-hidden transition-all duration-300 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-950/20 flex flex-col justify-between"
              >
                <div>
                  {/* Hotel Hero Image */}
                  <div className="relative h-56 overflow-hidden bg-stone-800">
                    <img
                      src={hotel.hero_image}
                      alt={hotel.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

                    {/* Subdomain Badge */}
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-mono font-bold bg-black/70 backdrop-blur border border-white/10 text-amber-300 flex items-center gap-1.5 shadow-lg">
                      <Globe className="w-3 h-3 text-amber-400" />
                      {hotel.subdomain}
                    </div>

                    {/* Plan Badge */}
                    <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur">
                      {hotel.plan_name}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                        {hotel.brand_name || hotel.name}
                      </h3>
                      <div className="text-xs text-stone-300 flex items-center gap-1.5 mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-white">4.9</span>
                        <span className="text-stone-400">• {hotel.cuisine}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 space-y-4 text-xs">
                    <p className="text-stone-400 line-clamp-2 leading-relaxed">
                      {hotel.tagline}
                    </p>

                    <div className="pt-3 border-t border-stone-800/80 grid grid-cols-2 gap-3 text-stone-300">
                      <div>
                        <span className="text-stone-500 block text-[11px]">Dining Outlets:</span>
                        <span className="font-semibold text-white">{hotel.outlet_count} Active Outlets</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[11px]">Menu Selections:</span>
                        <span className="font-semibold text-white">{hotel.item_count} Dishes & Drinks</span>
                      </div>
                    </div>

                    {hotel.address && (
                      <div className="text-[11px] text-stone-400 truncate">
                        📍 {hotel.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Link & Action */}
                <div className="p-6 pt-0">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onNavigateToHotel(hotel.slug)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors"
                    >
                      <span>Showcase & Day's Menu</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {hotel.sample_table_token && (
                      <button
                        onClick={() => onLaunchGuestDemo(hotel.sample_table_token!)}
                        title="Scan Table QR directly"
                        className="p-2.5 rounded-xl border border-stone-700 hover:border-amber-500/60 text-stone-300 hover:text-white bg-stone-800 transition-colors"
                      >
                        <QrCode className="w-4 h-4 text-amber-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. THE 5 PILLARS OF OPERATION */}
      <section id="pillars" className="py-24 px-4 sm:px-6 bg-[#131210] border-t border-stone-800">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
              End-to-End Operational Flywheel
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              A Unified Operating Mesh Replacing Disjointed Software
            </h2>
            <p className="text-sm text-stone-400">
              From the instant a guest sits at a dining table to ticket dispatch, food runner delivery, and M-Pesa settlement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-xl bg-stone-900 border border-stone-800 space-y-3">
              <h3 className="text-base font-bold text-white">1. Instant QR Self-Ordering</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Table-attached QR codes resolve cryptographically without exposing database IDs. Guests browse photo-rich digital menus, configure portion sizes, select doneness and side modifiers, and submit orders with idempotency protection.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-xl bg-stone-900 border border-stone-800 space-y-3">
              <h3 className="text-base font-bold text-white">2. Multi-Station KDS Router</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Orders split automatically into station tickets (Hot Kitchen, Charcoal Grill, Cocktail Bar, Pastry). Touchscreen bump screens track elapsed prep timers, rush priority flags, and notify Food Runners the instant dishes are ready.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-xl bg-stone-900 border border-stone-800 space-y-3">
              <h3 className="text-base font-bold text-white">3. M-Pesa STK & Cashier POS</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Consolidated billing combines multiple ordering rounds per table session. Full Daraja M-Pesa STK push integration triggers customer phone prompts with automated webhook confirmation. Split billing and room folio charges supported.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-xl bg-stone-900 border border-stone-800 space-y-3">
              <h3 className="text-base font-bold text-white">4. Recipe Bill of Materials (BOM)</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Every steak, pasta, and cocktail connects to raw ingredients. Transactional stock deduction reduces Angus beef and alcohol by grams and milliliters the moment orders are confirmed, with low-stock reorder thresholds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING & SUBSCRIPTION TIERS */}
      <section id="pricing" className="py-24 px-4 sm:px-6 bg-stone-950 border-t border-stone-800">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Transparent Hospitality Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Predictable Monthly Subscriptions
            </h2>
            <p className="text-sm text-stone-400">
              All plans include QR self-ordering, multi-station KDS, POS, and automatic Daraja M-Pesa integration with zero hidden commissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Standard Operations */}
            <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs font-semibold text-amber-400">Single Venue Operations</span>
                <div className="mt-3 text-2xl font-bold text-white">
                  KES 24,500 <span className="text-xs font-normal text-stone-400">/ month</span>
                </div>
                <p className="text-xs text-stone-400 mt-2">
                  Complete table QR ordering, kitchen display bump screens, M-Pesa push settlement, and inventory deduction.
                </p>

                <div className="mt-6 pt-6 border-t border-stone-800 space-y-2.5 text-xs text-stone-300">
                  <div>Up to 50 dining tables</div>
                  <div>Up to 3 kitchen & bar display stations</div>
                  <div>Safaricom Daraja M-Pesa integration</div>
                  <div>Recipe bill of materials inventory tracking</div>
                  <div>Daily audit logs and sales analytics</div>
                </div>
              </div>

              <button
                onClick={onOpenStaffPortal}
                className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition"
              >
                Launch Single Venue Terminal
              </button>
            </div>

            {/* Multi-Property Enterprise */}
            <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs font-semibold text-stone-300">Multi-Property Group</span>
                <div className="mt-3 text-2xl font-bold text-white">
                  KES 65,000 <span className="text-xs font-normal text-stone-400">/ month</span>
                </div>
                <p className="text-xs text-stone-400 mt-2">
                  Enterprise deployment for multi-outlet hotel brands with room folio billing and custom domain routing.
                </p>

                <div className="mt-6 pt-6 border-t border-stone-800 space-y-2.5 text-xs text-stone-300">
                  <div>Unlimited tables across multiple venues</div>
                  <div>Hotel PMS room folio billing integration</div>
                  <div>Centralized chef recipe & menu pricing sync</div>
                  <div>Custom domain and white-label branding</div>
                  <div>Dedicated account and kitchen onboarding support</div>
                </div>
              </div>

              <button
                onClick={onOpenStaffPortal}
                className="w-full py-2.5 rounded-lg border border-stone-700 hover:border-amber-500 text-stone-200 font-semibold text-xs transition"
              >
                Inquire for Multi-Property
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PLATFORM FOOTER */}
      <footer className="border-t border-stone-800/80 bg-black py-12 px-4 sm:px-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <span className="font-bold text-stone-300">Sironi Restaurants Ltd</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Safaricom Daraja Certified</span>
            <span>PostgreSQL / SQLite Isolated WAL</span>
            <span>Nairobi, Kenya</span>
          </div>
          <div>
            © 2026 Sironi Restaurants. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

