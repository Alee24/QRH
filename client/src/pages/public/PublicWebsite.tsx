import React, { useState } from 'react';
import {
  QrCode,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Clock,
  Smartphone,
  UtensilsCrossed,
  ChefHat,
  Truck,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Flame,
  Wine,
  Star,
  Users,
  Check,
  Send,
  Coffee,
  Heart
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';

interface PublicWebsiteProps {
  onNavigateToHotel?: (slug: string) => void;
  onLaunchGuestDemo: (tableToken?: string) => void;
  onOpenStaffPortal: () => void;
}

export type PublicPage = 'home' | 'menu' | 'qr_dining' | 'delivery' | 'events' | 'contact';

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  onLaunchGuestDemo,
  onOpenStaffPortal,
}) => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState<PublicPage>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Reservation form state
  const [reservationForm, setReservationForm] = useState({
    name: '',
    phone: '',
    email: '',
    guests: '2',
    date: new Date().toISOString().split('T')[0],
    time: '19:30',
    location: 'Sironi Rooftop & Sky Lounge (Westlands)',
    specialRequests: '',
  });
  const [reservationSuccess, setReservationSuccess] = useState(false);

  const handleReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReservationSuccess(true);
  };

  const signatureDishes = [
    {
      id: 'dish-1',
      name: '45-Day Dry Aged Prime Tomahawk',
      category: 'steaks',
      price: 4500,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      description: 'Aged in Himalayan salt chambers, seared over acacia charcoal coals, finished with roasted bone marrow butter and smoked Maldon salt.',
      tags: ['Chef Signature', 'Grass-Fed', 'Charcoal Grill'],
      prepTime: '25 min',
    },
    {
      id: 'dish-2',
      name: 'Swahili Coconut Snapper Fillet',
      category: 'seafood',
      price: 2450,
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
      description: 'Fresh wild Indian Ocean snapper simmered in rich coastal coconut cream, crushed turmeric, garlic, lemongrass, served with basmati rice.',
      tags: ['Coastal Provenance', 'Gluten-Free', 'Mild Spices'],
      prepTime: '20 min',
    },
    {
      id: 'dish-3',
      name: 'Flame-Seared Mara Lamb Cutlets',
      category: 'steaks',
      price: 2800,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      description: 'Tender lamb cutlets marinated in rosemary, crushed black peppercorns and garlic, flame-kissed with mint and coriander chimichurri.',
      tags: ['Local Farmed', 'High Protein'],
      prepTime: '22 min',
    },
    {
      id: 'dish-4',
      name: 'Black Truffle Tagliatelle',
      category: 'pasta',
      price: 2150,
      image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
      description: 'Handmade fresh egg pasta, winter black truffle butter, sautéed porcini mushrooms, aged 24-month Parmigiano-Reggiano.',
      tags: ['Artisanal Pasta', 'Vegetarian'],
      prepTime: '15 min',
    },
    {
      id: 'dish-5',
      name: 'The Sironi Monster Smash Burger',
      category: 'burgers',
      price: 1950,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      description: 'Double Angus beef patties smashed with sweet onions, molten vintage cheddar, crispy bacon, house truffle aioli on toasted brioche.',
      tags: ['Bestseller', 'Hand-Cut Fries'],
      prepTime: '15 min',
    },
    {
      id: 'dish-6',
      name: 'Passion & Mango Panna Cotta',
      category: 'desserts',
      price: 950,
      image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
      description: 'Madagascar vanilla bean cream, tart Naivasha passionfruit coulis, diced fresh mango, toasted coconut flakes.',
      tags: ['House Pastry', 'Gluten-Free'],
      prepTime: '8 min',
    },
  ];

  const filteredDishes = selectedCategory === 'all'
    ? signatureDishes
    : signatureDishes.filter((d) => d.category === selectedCategory);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 flex flex-col font-sans transition-colors">
      {/* ========================================================= */}
      {/* 1. RESTAURANT BRAND HEADER                                */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b border-stone-200 dark:border-stone-800 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Sironi Emblem & Logo */}
          <div
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-amber-600/25 group-hover:bg-amber-700 transition">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-stone-900 dark:text-white uppercase">
                  Sironi
                </span>
                <span className="text-xs font-bold tracking-widest text-amber-600 dark:text-amber-400 uppercase">
                  Restaurants
                </span>
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block -mt-0.5 font-medium">
                Contemporary Grill & Artisanal Dining • Nairobi
              </span>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {[
              { id: 'home', label: 'Welcome' },
              { id: 'menu', label: 'Dining Menu' },
              { id: 'qr_dining', label: 'Table QR Ordering' },
              { id: 'delivery', label: 'Online Delivery' },
              { id: 'events', label: 'Private Dining & Events' },
              { id: 'contact', label: 'Reservations & Locations' },
            ].map((nav) => {
              const active = currentPage === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => setCurrentPage(nav.id as PublicPage)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    active
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {nav.label}
                </button>
              );
            })}
          </nav>

          {/* Top CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onLaunchGuestDemo()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/30 transition active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Order Food Now</span>
            </button>

            <button
              onClick={onOpenStaffPortal}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              title="Staff Terminal"
            >
              <span>Staff Portal</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="lg:hidden border-t border-stone-200 dark:border-stone-800 px-3 py-2 flex items-center justify-between overflow-x-auto no-scrollbar gap-1 text-xs">
          {[
            { id: 'home', label: 'Home' },
            { id: 'menu', label: 'Menu' },
            { id: 'qr_dining', label: 'Table QR' },
            { id: 'delivery', label: 'Delivery' },
            { id: 'events', label: 'Events' },
            { id: 'contact', label: 'Book Table' },
          ].map((nav) => (
            <button
              key={nav.id}
              onClick={() => setCurrentPage(nav.id as PublicPage)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold text-xs transition ${
                currentPage === nav.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {nav.label}
            </button>
          ))}
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. BODY CONTENT ROUTED BY TAB                             */}
      {/* ========================================================= */}
      <main className="flex-1">
        {/* --------------------------------------------------------- */}
        {/* VIEW 1: HOME PAGE                                         */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'home' && (
          <div className="space-y-24 pb-24">
            {/* 1.1 HERO BANNER */}
            <section className="relative overflow-hidden bg-stone-900 text-white py-24 sm:py-32 px-4 sm:px-6">
              <div className="absolute inset-0 z-0 opacity-35 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1920&q=80')` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/80 to-transparent z-0" />

              <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Woodfired Grills • Fresh Coastal Catch • Master Mixology</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                  Where Open Fire Meets <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                    Artisanal Culinary Craft
                  </span>
                </h1>

                <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-300 leading-relaxed font-normal">
                  Welcome to Sironi Restaurants. Savor 45-day dry aged charcoal steaks, wild ocean snapper, hand-rolled pasta, and rare botanical cocktails in the heart of Nairobi.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => onLaunchGuestDemo()}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-extrabold text-sm shadow-xl shadow-amber-600/30 flex items-center justify-center gap-2.5 transition active:scale-95"
                  >
                    <QrCode className="w-5 h-5" />
                    <span>Order Online / Table QR</span>
                  </button>

                  <button
                    onClick={() => setCurrentPage('menu')}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur transition flex items-center justify-center gap-2"
                  >
                    <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                    <span>Explore Food & Drink Menu</span>
                  </button>

                  <button
                    onClick={() => setCurrentPage('contact')}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-sm border border-stone-700 transition flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Book a Table</span>
                  </button>
                </div>

                {/* Highlights bar */}
                <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left border-t border-stone-800/80">
                  <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800">
                    <div className="text-amber-400 font-black text-xl">45 Days</div>
                    <div className="text-xs text-stone-300 font-medium">Himalayan Salt Dry Aging</div>
                  </div>
                  <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800">
                    <div className="text-amber-400 font-black text-xl">100% Kenyan</div>
                    <div className="text-xs text-stone-300 font-medium">Single-Origin Grass-Fed Beef</div>
                  </div>
                  <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800">
                    <div className="text-amber-400 font-black text-xl">0 Delay</div>
                    <div className="text-xs text-stone-300 font-medium">Contactless Table QR Ordering</div>
                  </div>
                  <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800">
                    <div className="text-amber-400 font-black text-xl">35 Mins</div>
                    <div className="text-xs text-stone-300 font-medium">Fast Express Nairobi Delivery</div>
                  </div>
                </div>
              </div>
            </section>

            {/* 1.2 SIGNATURE CULINARY HIGHLIGHTS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    The Kitchen Showcase
                  </span>
                  <h2 className="text-3xl font-black text-stone-900 dark:text-white">
                    Signature Dishes from the Woodfire & Charcoal Line
                  </h2>
                  <p className="text-sm text-stone-600 dark:text-stone-400 max-w-xl">
                    Every plate is prepared to order using local provenance, seasonal farm produce, and time-honored open-flame techniques.
                  </p>
                </div>

                <button
                  onClick={() => setCurrentPage('menu')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <span>View All Categories & Drinks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {signatureDishes.slice(0, 6).map((dish) => (
                  <div
                    key={dish.id}
                    className="group rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3 bg-stone-900/85 backdrop-blur text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                          KES {dish.price.toLocaleString()}
                        </div>
                        <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
                          {dish.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur text-amber-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 space-y-2">
                        <h3 className="font-bold text-lg text-stone-900 dark:text-white group-hover:text-amber-600 transition-colors">
                          {dish.name}
                        </h3>
                        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                          {dish.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 pt-0 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between mt-4">
                      <span className="text-[11px] font-semibold text-stone-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {dish.prepTime} prep
                      </span>

                      <button
                        onClick={() => onLaunchGuestDemo()}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Order Dish</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 1.3 THE SEAMLESS TABLE QR DINING EXPERIENCE */}
            <section className="bg-stone-100 dark:bg-stone-900/50 py-20 px-4 sm:px-6 border-y border-stone-200 dark:border-stone-800">
              <div className="max-w-7xl mx-auto space-y-12">
                <div className="max-w-2xl space-y-2 text-center mx-auto">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Effortless Dining Floor
                  </span>
                  <h2 className="text-3xl font-black text-stone-900 dark:text-white">
                    Scan. Order. Savor. Settle.
                  </h2>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    Enjoy relaxed dining with zero delays. Every table at Sironi features an interactive QR standee connected directly to our culinary line.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
                      1
                    </div>
                    <h3 className="font-bold text-base text-stone-900 dark:text-white">Scan Table QR Standee</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Simply point your phone camera at the standee on your table. Opens our instant digital menu in your mobile browser with zero app installation.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
                      2
                    </div>
                    <h3 className="font-bold text-base text-stone-900 dark:text-white">Customize Your Cuts</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Select meat temperatures (Medium Rare, Medium), customized side dishes, mild or spicy sauces, and dietary preferences directly on screen.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
                      3
                    </div>
                    <h3 className="font-bold text-base text-stone-900 dark:text-white">Direct Kitchen Routing</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Steaks route straight to the Charcoal Pitmaster, seafood to the Hot Kitchen, and signature mocktails to the Cocktail Bar bump screen with zero handwriting errors.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
                      4
                    </div>
                    <h3 className="font-bold text-base text-stone-900 dark:text-white">M-Pesa STK Settlement</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Add additional drinks anytime. When ready, request your bill or settle instantly via Safaricom M-Pesa STK push prompt without waiting for a credit card machine.
                    </p>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => onLaunchGuestDemo()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-bold text-xs hover:bg-stone-800 dark:hover:bg-stone-100 transition shadow-md"
                  >
                    <Smartphone className="w-4 h-4 text-amber-500" />
                    <span>Try Table 01 Guest Simulator</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 1.4 TWO ICONIC NAIROBI LOCATIONS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Where to Find Us
                </span>
                <h2 className="text-3xl font-black text-stone-900 dark:text-white">
                  Two Distinct Ambiance Settings in Nairobi
                </h2>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  Whether you seek panoramic rooftop sunset views or lush botanical garden terraces, Sironi provides unforgettable hospitality.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Location 1: Westlands Rooftop */}
                <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
                        alt="Sironi Rooftop"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                          Flagship Dining
                        </span>
                        <h3 className="text-2xl font-black">Sironi Rooftop & Sky Lounge</h3>
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                        Perched high above Westlands with sweeping skyline views. Features our Himalayan salt dry-aging display, open-flame charcoal pit, live jazz evenings, and signature mixology terrace.
                      </p>
                      <div className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-600" />
                          <span>Sironi Plaza, 9th Floor, Chiromo Lane, Westlands</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Open Daily: 11:00 AM – 01:00 AM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-amber-600" />
                          <span>Reservations: +254 700 123 456</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <button
                      onClick={() => setCurrentPage('contact')}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                    >
                      Book Westlands Rooftop
                    </button>
                  </div>
                </div>

                {/* Location 2: Kilimani Garden Bistro */}
                <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
                        alt="Sironi Garden Bistro"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                          Garden & Woodfire
                        </span>
                        <h3 className="text-2xl font-black">Sironi Garden Bistro & Pizzeria</h3>
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                        Nestled in serene botanical gardens in Kilimani. Features outdoor woodfired stone pizza ovens, shaded pergolas, artisanal family weekend brunch, and handcrafted gelato.
                      </p>
                      <div className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-600" />
                          <span>Argwings Kodhek Road, Kilimani, Nairobi</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Open Daily: 07:00 AM – 11:00 PM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-amber-600" />
                          <span>Reservations: +254 711 222 333</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <button
                      onClick={() => setCurrentPage('contact')}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                    >
                      Book Kilimani Garden
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 2: FULL DINING MENU                                  */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'menu' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Culinary Portfolio
              </span>
              <h1 className="text-4xl font-black text-stone-900 dark:text-white">
                Sironi Food & Beverage Menu
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Explore our dry-aged steaks, coastal seafood, artisanal pasta, woodfired pizzas, craft cocktails, and patisserie creations.
              </p>

              {/* Category Pills */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {[
                  { id: 'all', label: 'All Creations' },
                  { id: 'steaks', label: 'Charcoal Steaks & Chops' },
                  { id: 'seafood', label: 'Coastal Seafood' },
                  { id: 'pasta', label: 'Fresh Pastas' },
                  { id: 'burgers', label: 'Artisan Burgers' },
                  { id: 'desserts', label: 'Desserts & Pastry' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      selectedCategory === cat.id
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-lg transition flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-56">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-stone-900/85 backdrop-blur text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                        KES {dish.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-6 space-y-2">
                      <h3 className="font-bold text-lg text-stone-900 dark:text-white">
                        {dish.name}
                      </h3>
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                        {dish.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between mt-4">
                    <span className="text-[11px] font-semibold text-stone-400">
                      Approx. {dish.prepTime}
                    </span>
                    <button
                      onClick={() => onLaunchGuestDemo()}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Order Now</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 3: TABLE QR ORDERING EXPERIENCE                      */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'qr_dining' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Self-Service Innovation
              </span>
              <h1 className="text-4xl font-black text-stone-900 dark:text-white">
                Contactless Table QR Ordering at Sironi
              </h1>
              <p className="text-base text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
                Enjoy your dining conversation without waving down servers. Control your dining pace with our instant table ordering engine.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-amber-600 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-2">
                <h3 className="text-2xl font-black">Experience It Right Now</h3>
                <p className="text-xs text-amber-100 max-w-md leading-relaxed">
                  Test our live table ordering simulator for Table 01. Add meals, customize spices, view KDS routing, and trigger test M-Pesa STK settlements.
                </p>
              </div>
              <button
                onClick={() => onLaunchGuestDemo('T01')}
                className="px-6 py-3.5 rounded-2xl bg-white text-stone-900 hover:bg-stone-100 font-extrabold text-xs shadow-lg transition active:scale-95 whitespace-nowrap flex items-center gap-2"
              >
                <QrCode className="w-4 h-4 text-amber-600" />
                <span>Launch Table 01 Ordering</span>
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 4: ONLINE DELIVERY                                   */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'delivery' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Direct From Our Kitchens
              </span>
              <h1 className="text-4xl font-black text-stone-900 dark:text-white">
                Sironi Express Nairobi Delivery
              </h1>
              <p className="text-base text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
                Piping-hot charcoal steaks, gourmet burgers, and fresh seafood delivered straight to your home or office in insulated thermal carriers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Direct Fleet Delivery</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Delivered by Sironi trained couriers. Zero third-party markups on food prices.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Thermal Lock Guarantee</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Insulated thermal packaging keeps steaks sizzling and crusts crisp during transit.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Instant M-Pesa Checkout</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Seamless payment authorization via Daraja 2.0 STK push directly to your mobile phone.
                </p>
              </div>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => onLaunchGuestDemo()}
                className="px-8 py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-xl shadow-amber-600/30 transition active:scale-95 inline-flex items-center gap-2"
              >
                <Truck className="w-5 h-5" />
                <span>Place Delivery Order Now</span>
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 5: PRIVATE DINING & EVENTS                           */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'events' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Special Occasions & Banquets
              </span>
              <h1 className="text-4xl font-black text-stone-900 dark:text-white">
                Private Dining & Corporate Celebrations
              </h1>
              <p className="text-base text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
                Host unforgettable wedding receptions, diplomatic sundowners, corporate board dinners, and family milestones at Sironi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4">
                <h3 className="text-xl font-black">Executive Rooftop Suite</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Accommodates 15–50 seated guests with private bar, sommelier service, dedicated terrace viewing deck, and tailored 5-course tasting menus.
                </p>
                <ul className="space-y-2 text-xs font-medium text-stone-700 dark:text-stone-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-600" /> Private mixology cocktail station</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-600" /> Custom printed physical & digital menus</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-600" /> State-of-the-art audiovisual & sound system</li>
                </ul>
              </div>

              <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4">
                <h3 className="text-xl font-black">Garden Pavilion & Lawn</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Accommodates 50–350 guests for wedding banquets, cocktail galas, and live carving buffets in Kilimani's lush botanical gardens.
                </p>
                <ul className="space-y-2 text-xs font-medium text-stone-700 dark:text-stone-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-600" /> Live acacia charcoal spit & carvery stations</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-600" /> Chafing dish sets and luxury crystal stemware</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-600" /> Dedicated event director and service brigade</li>
                </ul>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setCurrentPage('contact')}
                className="px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
              >
                Inquire for Private Events
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 6: TABLE RESERVATIONS & LOCATIONS                    */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'contact' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Plan Your Visit
              </span>
              <h1 className="text-4xl font-black text-stone-900 dark:text-white">
                Reserve a Table at Sironi Restaurants
              </h1>
              <p className="text-base text-stone-600 dark:text-stone-300 max-w-xl mx-auto">
                Secure your preferred dining area at Westlands Rooftop or Kilimani Garden Bistro. We confirm reservations promptly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Form */}
              <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
                {reservationSuccess ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h3 className="font-bold text-base">Reservation Request Received</h3>
                    <p className="text-xs leading-relaxed">
                      Thank you, {reservationForm.name}! Our host team has recorded your booking for {reservationForm.guests} guests on {reservationForm.date} at {reservationForm.time}. We will send a confirmation SMS shortly.
                    </p>
                    <button
                      onClick={() => setReservationSuccess(false)}
                      className="mt-3 text-xs font-bold text-amber-600 underline"
                    >
                      Make Another Booking
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReservationSubmit} className="space-y-4 text-xs font-bold">
                    <div>
                      <label className="block mb-1 text-stone-700 dark:text-stone-300">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={reservationForm.name}
                        onChange={(e) => setReservationForm({ ...reservationForm, name: e.target.value })}
                        placeholder="e.g. David Kimani"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-stone-700 dark:text-stone-300">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={reservationForm.phone}
                          onChange={(e) => setReservationForm({ ...reservationForm, phone: e.target.value })}
                          placeholder="e.g. 0722 000 000"
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-stone-700 dark:text-stone-300">Email (Optional)</label>
                        <input
                          type="email"
                          value={reservationForm.email}
                          onChange={(e) => setReservationForm({ ...reservationForm, email: e.target.value })}
                          placeholder="david@example.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-stone-700 dark:text-stone-300">Location</label>
                      <select
                        value={reservationForm.location}
                        onChange={(e) => setReservationForm({ ...reservationForm, location: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-medium"
                      >
                        <option>Sironi Rooftop & Sky Lounge (Westlands)</option>
                        <option>Sironi Garden Bistro & Pizzeria (Kilimani)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block mb-1 text-stone-700 dark:text-stone-300">Guests</label>
                        <select
                          value={reservationForm.guests}
                          onChange={(e) => setReservationForm({ ...reservationForm, guests: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-medium"
                        >
                          <option>1 Person</option>
                          <option>2 Guests</option>
                          <option>4 Guests</option>
                          <option>6 Guests</option>
                          <option>8+ Group</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 text-stone-700 dark:text-stone-300">Date</label>
                        <input
                          type="date"
                          required
                          value={reservationForm.date}
                          onChange={(e) => setReservationForm({ ...reservationForm, date: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-stone-700 dark:text-stone-300">Time</label>
                        <input
                          type="time"
                          required
                          value={reservationForm.time}
                          onChange={(e) => setReservationForm({ ...reservationForm, time: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-stone-700 dark:text-stone-300">Special Notes / Seating Preference</label>
                      <textarea
                        rows={3}
                        value={reservationForm.specialRequests}
                        onChange={(e) => setReservationForm({ ...reservationForm, specialRequests: e.target.value })}
                        placeholder="e.g. Window table, anniversary celebration, birthday dessert..."
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/30 transition active:scale-95"
                    >
                      Confirm Table Reservation
                    </button>
                  </form>
                )}
              </div>

              {/* Direct Info */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                  <h3 className="font-bold text-base">Direct Inquiries & Private Hire</h3>
                  <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-stone-900 dark:text-white">+254 700 123 456 (Westlands) • +254 711 222 333 (Kilimani)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-600" />
                      <span>reservations@sironi.kkdes.co.ke</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Lunch: 11:30 AM – 3:30 PM • Dinner: 6:00 PM – Midnight</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-2">
                  <div className="font-bold text-xs text-amber-800 dark:text-amber-300">
                    Dining at Our Tables Right Now?
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    You do not need to make a reservation if you are already seated. Simply scan the QR code located in the center of your table to view our full menu and submit your orders directly.
                  </p>
                  <button
                    onClick={() => onLaunchGuestDemo()}
                    className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
                  >
                    <span>Launch Table QR Ordering</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
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
              <div className="flex items-center gap-2.5 font-bold text-stone-900 dark:text-white">
                <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white font-black text-sm">
                  S
                </div>
                <div>
                  <span className="font-black text-sm block tracking-tight">Sironi Restaurants</span>
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 -mt-0.5 block">Nairobi Premier Dining</span>
                </div>
              </div>
              <p className="text-xs text-stone-500 max-w-sm leading-relaxed">
                Contemporary artisanal restaurant group specializing in 45-day dry aged charcoal steaks, fresh coastal seafood, woodfired pizzas, and handcrafted cocktails.
              </p>
              <div className="text-[11px] text-stone-400 space-y-1">
                <div>Locations: Westlands Rooftop • Kilimani Garden Bistro</div>
                <div>Reservations: +254 700 123 456 • reservations@sironi.kkdes.co.ke</div>
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-stone-900 dark:text-stone-200 uppercase tracking-wider text-[11px]">Dining</span>
              <ul className="space-y-1.5">
                <li><button onClick={() => setCurrentPage('menu')} className="hover:text-amber-600">Woodfire Steaks</button></li>
                <li><button onClick={() => setCurrentPage('menu')} className="hover:text-amber-600">Coastal Seafood</button></li>
                <li><button onClick={() => setCurrentPage('menu')} className="hover:text-amber-600">Handmade Pasta</button></li>
                <li><button onClick={() => setCurrentPage('menu')} className="hover:text-amber-600">Artisan Cocktails</button></li>
                <li><button onClick={() => setCurrentPage('menu')} className="hover:text-amber-600">Patisserie Desserts</button></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-stone-900 dark:text-stone-200 uppercase tracking-wider text-[11px]">Guest Services</span>
              <ul className="space-y-1.5">
                <li><button onClick={() => onLaunchGuestDemo()} className="hover:text-amber-600 font-semibold text-amber-600 dark:text-amber-400">Scan Table QR Menu</button></li>
                <li><button onClick={() => setCurrentPage('delivery')} className="hover:text-amber-600">Online Express Delivery</button></li>
                <li><button onClick={() => setCurrentPage('contact')} className="hover:text-amber-600">Table Reservations</button></li>
                <li><button onClick={() => setCurrentPage('events')} className="hover:text-amber-600">Private Dining & Banquets</button></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-stone-900 dark:text-stone-200 uppercase tracking-wider text-[11px]">Staff Access</span>
              <ul className="space-y-1.5">
                <li><button onClick={onOpenStaffPortal} className="font-bold text-amber-600 hover:underline">Kitchen KDS & POS Sign In</button></li>
                <li><button onClick={() => onLaunchGuestDemo('T01')} className="hover:text-amber-600">Table 01 Simulator</button></li>
                <li><span className="text-[10px] text-stone-400">sironi.kkdes.co.ke</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <span>© {new Date().getFullYear()} Sironi Restaurants Ltd. All rights reserved.</span>
            <div className="flex gap-4">
              <span>Safaricom M-Pesa Integrated</span>
              <span>Westlands & Kilimani, Nairobi</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
