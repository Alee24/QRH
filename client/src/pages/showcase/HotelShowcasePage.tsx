import React, { useState, useEffect } from 'react';
import {
  Utensils,
  MapPin,
  Phone,
  Clock,
  Star,
  Award,
  Sparkles,
  QrCode,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Search,
  ExternalLink,
  ChevronLeft,
  X,
  Share2,
  Heart,
  Info,
  Calendar,
  Layers,
  ArrowLeft
} from 'lucide-react';

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  estimated_prep_time: number;
  is_special: number;
  dietary_flags: string;
  allergens: string;
}

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  meal_type: string;
  icon: string;
  description: string;
  sort_order: number;
  items: MenuItem[];
}

interface Outlet {
  id: string;
  name: string;
  code: string;
  type: string;
  opening_time: string;
  closing_time: string;
}

interface HotelDetails {
  tenant_id: string;
  name: string;
  slug: string;
  display_name: string;
  hotel_name: string;
  custom_domain: string | null;
  subdomain: string;
  brand_name: string | null;
  custom_logo: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  receipt_header: string | null;
  receipt_footer: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  vat_rate: number;
  catering_levy_rate: number;
  service_charge_rate: number;
  plan_name: string;
  tagline: string;
  description: string;
  hero_image: string;
  rating: number;
  reviews_count: number;
  amenities: string[];
  current_meal_schedule: string;
  sample_table: {
    id: string;
    table_number: string;
    name: string;
    qr_token: string;
  } | null;
}

interface ShowcaseResponse {
  hotel: HotelDetails;
  outlets: Outlet[];
  today_specials: MenuItem[];
  categories: MenuCategory[];
  all_items: MenuItem[];
}

interface HotelShowcasePageProps {
  slug: string;
  onBackToDirectory?: () => void;
  onLaunchTableOrder: (tableToken?: string) => void;
  onSwitchHotel?: (slug: string) => void;
}

export const HotelShowcasePage: React.FC<HotelShowcasePageProps> = ({
  slug,
  onBackToDirectory,
  onLaunchTableOrder,
  onSwitchHotel,
}) => {
  const [data, setData] = useState<ShowcaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSpecialOnly, setFilterSpecialOnly] = useState<boolean>(false);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/showcase/hotel/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Hotel subscriber '${slug}' not found.`);
        return res.json();
      })
      .then((json: ShowcaseResponse) => {
        setData(json);
      })
      .catch((err) => {
        console.error('Failed to load hotel showcase:', err);
        setError(err.message || 'Failed to load hotel showcase data');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopySubdomain = () => {
    if (!data?.hotel.subdomain) return;
    const fullUrl = `https://${data.hotel.subdomain}`;
    navigator.clipboard.writeText(fullUrl).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-stone-200">
        <div className="w-12 h-12 rounded-2xl border-4 border-amber-500 border-t-transparent animate-spin mb-4" />
        <h3 className="text-lg font-bold tracking-tight">Preparing Hotel Showcase</h3>
        <p className="text-xs text-stone-400 mt-1">Retrieving verified subscriber menu & ambiance profiles...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-stone-200 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
          <Info size={32} />
        </div>
        <h3 className="text-xl font-bold">Showcase Unavailable</h3>
        <p className="text-sm text-stone-400 max-w-md mt-2">{error || 'Unable to retrieve subscriber details.'}</p>
        <div className="mt-6 flex items-center gap-3">
          {onBackToDirectory && (
            <button
              onClick={onBackToDirectory}
              className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold"
            >
              Back to SaaS Directory
            </button>
          )}
          {onSwitchHotel && (
            <button
              onClick={() => onSwitchHotel('grand-heritage')}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
            >
              View Grand Heritage Hotel
            </button>
          )}
        </div>
      </div>
    );
  }

  const { hotel, outlets, today_specials, categories, all_items } = data;

  // Filter items
  const filteredItems = all_items.filter((item) => {
    if (activeCategory !== 'all' && item.category_id !== activeCategory) {
      return false;
    }
    if (filterSpecialOnly && item.is_special !== 1) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchDietary = (item.dietary_flags || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchDietary) return false;
    }
    return true;
  });

  const isSerena = hotel.slug.includes('serena');
  const primaryThemeColor = isSerena ? '#059669' : (hotel.primary_color || '#ca8a04');

  return (
    <div className="min-h-screen bg-[#0d0c0a] text-stone-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* 1. SUBSCRIBER SUBDOMAIN HEADER BAR */}
      <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur border-b border-stone-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {onBackToDirectory && (
              <button
                onClick={onBackToDirectory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-semibold border border-stone-800 transition-colors"
                title="Return to Main SaaS Showcase"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Platform Directory</span>
              </button>
            )}

            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-base shadow-lg"
                style={{ backgroundColor: primaryThemeColor }}
              >
                {hotel.display_name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-sm sm:text-base text-stone-100 tracking-tight leading-none">
                    {hotel.display_name}
                  </h1>
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <ShieldCheck size={11} /> Verified Subscriber
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                    https://{hotel.subdomain}
                  </span>
                  <button
                    onClick={handleCopySubdomain}
                    className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium"
                  >
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Subscriber Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick switcher between Grand Heritage & Serena */}
            {onSwitchHotel && (
              <div className="hidden lg:flex items-center gap-1 bg-stone-900 border border-stone-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => onSwitchHotel('grand-heritage')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    slug === 'grand-heritage'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Grand Heritage
                </button>
                <button
                  onClick={() => onSwitchHotel('serena-safari')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    slug === 'serena-safari'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Serena Safari Lodge
                </button>
              </div>
            )}

            <button
              onClick={() => onLaunchTableOrder(hotel.sample_table?.qr_token)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-black shadow-lg transition-all transform active:scale-95"
              style={{ backgroundColor: primaryThemeColor, color: '#ffffff' }}
            >
              <QrCode size={15} />
              <span>Order at Table</span>
              <span className="hidden sm:inline opacity-80 font-mono text-[10px]">
                ({hotel.sample_table?.table_number || 'T-01'})
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. ATMOSPHERIC HERO SECTION */}
      <section className="relative overflow-hidden border-b border-stone-800">
        {/* Background Image with Dark Gradient Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src={hotel.hero_image}
            alt={hotel.display_name}
            className="w-full h-full object-cover object-center filter brightness-[0.38] scale-105 transform hover:scale-100 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c0a] via-[#0d0c0a]/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="max-w-3xl">
            {/* Live Service Indicator Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/90 border border-stone-700/80 backdrop-blur text-xs mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-stone-300 font-medium">Currently Serving:</span>
              <span className="font-extrabold text-amber-400 tracking-wide">
                {hotel.current_meal_schedule}
              </span>
            </div>

            {/* Hotel Display Name & Tagline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-serif">
              {hotel.display_name}
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-stone-300 font-light leading-relaxed">
              {hotel.tagline}
            </p>
            <p className="mt-3 text-xs sm:text-sm text-stone-400 leading-relaxed max-w-2xl">
              {hotel.description}
            </p>

            {/* Location & Rating Strip */}
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-stone-300 border-t border-stone-800/80 pt-6">
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-white">{hotel.rating}</span>
                <span className="text-stone-500">({hotel.reviews_count} verified guests)</span>
              </div>

              {hotel.address && (
                <div className="flex items-center gap-1.5 text-stone-400">
                  <MapPin size={14} className="text-amber-500 shrink-0" />
                  <span>{hotel.address}</span>
                </div>
              )}

              {hotel.phone && (
                <div className="flex items-center gap-1.5 text-stone-400">
                  <Phone size={14} className="text-amber-500 shrink-0" />
                  <span>{hotel.phone}</span>
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <a
                href="#days-menu"
                className="px-6 py-3 rounded-xl bg-white hover:bg-stone-200 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xl"
              >
                <span>View Today's Menu</span>
                <ChevronRight size={16} />
              </a>

              <button
                onClick={() => onLaunchTableOrder(hotel.sample_table?.qr_token)}
                className="px-6 py-3 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700/80 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all backdrop-blur"
              >
                <QrCode size={16} className="text-amber-400" />
                <span>Simulate Table QR Order ({hotel.sample_table?.table_number || 'T-01'})</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CHEF'S DAILY SPECIALS (IF AVAILABLE) */}
      {today_specials.length > 0 && (
        <section className="py-12 bg-stone-950 border-b border-stone-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Flame size={15} /> Chef's Signature Daily Specials
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white font-serif">
                  Curated for Today's Service
                </h2>
              </div>
              <span className="text-xs text-stone-400 hidden sm:inline">
                Limited daily allocations prepared fresh to order
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {today_specials.map((dish) => (
                <div
                  key={dish.id}
                  onClick={() => setSelectedDish(dish)}
                  className="group relative rounded-2xl bg-stone-900/70 border border-stone-800 hover:border-amber-500/50 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-amber-900/10 flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden bg-stone-950">
                    <img
                      src={dish.image_url}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-stone-950 text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                      <Flame size={12} /> Chef's Special
                    </div>
                    {dish.estimated_prep_time && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-950/80 backdrop-blur text-stone-200 text-[10px] font-semibold border border-stone-800">
                        <Clock size={11} className="text-amber-400" />
                        <span>~{dish.estimated_prep_time} mins</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                          {dish.name}
                        </h3>
                        <span className="font-extrabold text-amber-400 text-base shrink-0">
                          {hotel.currency} {dish.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                        {dish.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-stone-500 capitalize">
                        {dish.dietary_flags || 'Signature recipe'}
                      </span>
                      <span className="text-amber-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1 text-[11px]">
                        View Details <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. THE DAY'S SCHEDULED FULL MENU */}
      <section id="days-menu" className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              <Sparkles size={14} /> Artisanal Culinary Offerings
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
              The Day's Scheduled Menu
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-xl">
              All dishes are prepared freshly upon order in our dedicated station kitchens using locally-sourced ingredients.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder="Search dishes or ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              onClick={() => setFilterSpecialOnly((prev) => !prev)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                filterSpecialOnly
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              <Flame size={14} />
              <span>Specials Only</span>
            </button>
          </div>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none border-b border-stone-800/80 mb-8">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-white text-stone-950 shadow-md'
                : 'bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800'
            }`}
          >
            All Selections ({all_items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'bg-white text-stone-950 shadow-md'
                  : 'bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-800 text-stone-300">
                {cat.items.length}
              </span>
            </button>
          ))}
        </div>

        {/* Dish Grid */}
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center bg-stone-900/40 rounded-3xl border border-stone-800">
            <Utensils size={36} className="mx-auto text-stone-600 mb-3" />
            <h4 className="text-base font-bold text-stone-300">No dishes match your criteria</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Try adjusting your category filter, clearing your search keywords, or switching special filters.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
                setFilterSpecialOnly(false);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-white"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((dish) => (
              <div
                key={dish.id}
                onClick={() => setSelectedDish(dish)}
                className="group rounded-2xl bg-stone-900/50 border border-stone-800/90 hover:border-stone-700 overflow-hidden cursor-pointer transition-all duration-200 hover:bg-stone-900 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 overflow-hidden bg-stone-950">
                    <img
                      src={dish.image_url}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {dish.is_special === 1 && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-bold">
                        Special
                      </div>
                    )}
                    {dish.estimated_prep_time && (
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-stone-950/80 backdrop-blur text-stone-300 text-[10px] font-semibold border border-stone-800 flex items-center gap-1">
                        <Clock size={10} className="text-amber-400" />
                        <span>~{dish.estimated_prep_time} min</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-amber-400 transition-colors">
                        {dish.name}
                      </h3>
                      <span className="font-extrabold text-amber-400 text-base shrink-0">
                        {hotel.currency} {dish.price.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>

                    {dish.dietary_flags && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {dish.dietary_flags.split(',').map((flag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-800 text-stone-300"
                          >
                            {flag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-4 pt-1 flex items-center justify-between border-t border-stone-800/60 text-xs">
                  <span className="text-[11px] text-stone-500">Click to inspect recipe & allergens</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLaunchTableOrder(hotel.sample_table?.qr_token);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-amber-600 hover:text-white text-stone-300 font-semibold text-xs transition-colors flex items-center gap-1"
                  >
                    <QrCode size={13} />
                    <span>Order at Table</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. HOTEL OUTLETS & VENUES */}
      {outlets.length > 0 && (
        <section className="py-16 bg-stone-950 border-t border-b border-stone-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Dining Venues & Bars
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
                Experience Our On-Site Outlets
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-2">
                Every dining venue operates its own kitchen displays and inventory stations to ensure uninterrupted hospitality.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outlets.map((outlet) => (
                <div
                  key={outlet.id}
                  className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800 hover:border-stone-700 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wide">
                      {outlet.type}
                    </span>
                    <span className="text-[11px] font-mono text-stone-500">#{outlet.code}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{outlet.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <Clock size={13} className="text-amber-500" />
                    <span>
                      Open Daily: {outlet.opening_time || '06:00'} - {outlet.closing_time || '23:30'}
                    </span>
                  </div>

                  <div className="mt-6 pt-4 border-t border-stone-800/80 flex items-center justify-between">
                    <span className="text-xs text-stone-400">QR Self-Service Active</span>
                    <button
                      onClick={() => onLaunchTableOrder(hotel.sample_table?.qr_token)}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <span>Join Table</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. HOTEL AMBIANCE & GUEST AMENITIES */}
      {hotel.amenities && hotel.amenities.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2">
                Uncompromising Hospitality
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif leading-tight">
                Crafted for Discerning Guests & Connoisseurs
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-4 leading-relaxed">
                Whether dining inside our intimate private rooms or enjoying fireside grills on the terrace, every detail is orchestrated to deliver unforgettable culinary memories.
              </p>

              <div className="mt-8 space-y-3">
                {hotel.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-stone-300">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={13} />
                    </div>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-stone-800/80">
                <button
                  onClick={() => onLaunchTableOrder(hotel.sample_table?.qr_token)}
                  className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all"
                >
                  <QrCode size={16} />
                  <span>Start Table QR Order Now</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden h-64 border border-stone-800">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
                  alt="Restaurant interior"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="rounded-2xl overflow-hidden h-64 border border-stone-800 mt-8">
                <img
                  src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80"
                  alt="Fine dining table"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. DISH DETAIL & ALLERGEN MODAL */}
      {selectedDish && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleUp">
            <div className="relative h-56 bg-stone-950">
              <img
                src={selectedDish.image_url}
                alt={selectedDish.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedDish(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-950/80 text-white flex items-center justify-center hover:bg-stone-800 transition-colors"
              >
                <X size={18} />
              </button>
              {selectedDish.is_special === 1 && (
                <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-amber-500 text-stone-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md">
                  <Flame size={13} /> Chef's Signature Daily Special
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-bold text-white font-serif">{selectedDish.name}</h3>
                <span className="text-xl font-extrabold text-amber-400 shrink-0">
                  {hotel.currency} {selectedDish.price.toLocaleString()}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-stone-300 mt-3 leading-relaxed">
                {selectedDish.description}
              </p>

              <div className="mt-6 space-y-3 bg-stone-950/60 p-4 rounded-2xl border border-stone-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Estimated Station Cook Time:</span>
                  <span className="text-white font-bold flex items-center gap-1">
                    <Clock size={12} className="text-amber-400" />
                    ~{selectedDish.estimated_prep_time || 15} minutes
                  </span>
                </div>

                {selectedDish.allergens && (
                  <div className="flex items-start justify-between text-xs pt-2 border-t border-stone-800/80">
                    <span className="text-stone-400">Allergen Notice:</span>
                    <span className="text-amber-400/90 font-medium text-right max-w-[200px]">
                      {selectedDish.allergens}
                    </span>
                  </div>
                )}

                {selectedDish.dietary_flags && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-800/80">
                    <span className="text-stone-400">Dietary Compatibility:</span>
                    <span className="text-emerald-400 font-semibold">
                      {selectedDish.dietary_flags}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setSelectedDish(null)}
                  className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedDish(null);
                    onLaunchTableOrder(hotel.sample_table?.qr_token);
                  }}
                  className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <QrCode size={15} />
                  <span>Order at Table</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. WHITE-LABEL FOOTER & TAX COMPLIANCE */}
      <footer className="bg-stone-950 border-t border-stone-800/80 py-12 text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-stone-800/80">
            <div>
              <span className="font-extrabold text-base text-white tracking-tight block">
                {hotel.display_name}
              </span>
              <p className="text-xs text-stone-500 mt-1">
                {hotel.receipt_footer || 'Thank you for dining with us. We look forward to welcoming you back.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-500">
              <span>VAT: {hotel.vat_rate}% Included</span>
              <span>•</span>
              <span>Catering Levy: {hotel.catering_levy_rate}%</span>
              <span>•</span>
              <span>Service Charge: {hotel.service_charge_rate}%</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
            <span>
              &copy; {new Date().getFullYear()} {hotel.display_name}. All rights reserved.
            </span>
            <div className="flex items-center gap-2">
              <span>Powered by</span>
              <span className="font-bold text-stone-400">Sironi Restaurants Cloud</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono">
                Multi-Tenant SaaS
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

