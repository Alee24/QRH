import React, { useState } from 'react';
import {
  QrCode,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Clock,
  Smartphone,
  UtensilsCrossed,
  Truck,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Flame,
  Check,
} from 'lucide-react';

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
      description: 'Aged in Himalayan salt chambers, seared over acacia charcoal, served with roasted bone marrow butter.',
      tags: ['Dry-Aged', 'Charcoal Grill'],
      prepTime: '25 min',
    },
    {
      id: 'dish-2',
      name: 'Swahili Coconut Snapper Fillet',
      category: 'seafood',
      price: 2450,
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
      description: 'Wild Indian Ocean snapper in coastal coconut cream, crushed turmeric, garlic, and lemongrass with fragrant rice.',
      tags: ['Fresh Catch', 'Coastal'],
      prepTime: '20 min',
    },
    {
      id: 'dish-3',
      name: 'Flame-Seared Mara Lamb Cutlets',
      category: 'steaks',
      price: 2800,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      description: 'Rosemary-marinated lamb chops flame-grilled over open coals with fresh mint and coriander chimichurri.',
      tags: ['Grass-Fed', 'Woodfire'],
      prepTime: '22 min',
    },
    {
      id: 'dish-4',
      name: 'Black Truffle Tagliatelle',
      category: 'pasta',
      price: 2150,
      image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
      description: 'Fresh egg pasta, winter black truffle butter, sautéed porcini mushrooms, 24-month Parmigiano-Reggiano.',
      tags: ['Fresh Pasta', 'Vegetarian'],
      prepTime: '15 min',
    },
    {
      id: 'dish-5',
      name: 'Sironi House Smash Burger',
      category: 'burgers',
      price: 1950,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      description: 'Double Angus patties, sweet caramelized onions, vintage cheddar, truffle aioli on toasted brioche.',
      tags: ['Angus Beef', 'Hand-Cut Fries'],
      prepTime: '15 min',
    },
    {
      id: 'dish-6',
      name: 'Passion & Mango Panna Cotta',
      category: 'desserts',
      price: 950,
      image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
      description: 'Madagascar vanilla cream, tart Naivasha passionfruit coulis, diced fresh mango, toasted coconut shavings.',
      tags: ['House Pastry', 'Gluten-Free'],
      prepTime: '8 min',
    },
  ];

  const filteredDishes = selectedCategory === 'all'
    ? signatureDishes
    : signatureDishes.filter((d) => d.category === selectedCategory);

  const navLinks: { id: PublicPage; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Menu' },
    { id: 'qr_dining', label: 'Table QR' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'events', label: 'Private Events' },
    { id: 'contact', label: 'Reservations' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 flex flex-col font-sans transition-colors">
      {/* ========================================================= */}
      {/* 1. RESTAURANT BRAND HEADER                                */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b border-stone-200 dark:border-stone-800 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Sironi Emblem & Title */}
          <div
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-base tracking-tight text-stone-900 dark:text-white uppercase">
                  Sironi
                </span>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Restaurants
                </span>
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5 font-medium">
                Contemporary Dining • Nairobi
              </span>
            </div>
          </div>

          {/* Primary Navigation - Strictly Single Line */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((nav) => {
              const active = currentPage === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => setCurrentPage(nav.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                    active
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 font-semibold'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 font-medium'
                  }`}
                >
                  {nav.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onLaunchGuestDemo()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition active:scale-95 whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Order Online</span>
            </button>

            <button
              onClick={onOpenStaffPortal}
              className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition whitespace-nowrap"
            >
              Staff Portal
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden border-t border-stone-200 dark:border-stone-800 px-3 py-2 flex items-center justify-between overflow-x-auto no-scrollbar gap-1 text-xs">
          {navLinks.map((nav) => (
            <button
              key={nav.id}
              onClick={() => setCurrentPage(nav.id)}
              className={`px-3 py-1 rounded-md whitespace-nowrap text-xs transition ${
                currentPage === nav.id
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {nav.label}
            </button>
          ))}
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. BODY CONTENT                                           */}
      {/* ========================================================= */}
      <main className="flex-1">
        {/* --------------------------------------------------------- */}
        {/* VIEW 1: HOME PAGE                                         */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'home' && (
          <div className="space-y-20 pb-20">
            {/* HERO BANNER - Human-Designed, Understated, Elegant */}
            <section className="relative overflow-hidden bg-stone-900 text-white py-20 sm:py-28 px-4 sm:px-6">
              <div
                className="absolute inset-0 z-0 opacity-30 bg-cover bg-center"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1920&q=80')` }}
              />
              <div className="absolute inset-0 bg-stone-950/70 z-0" />

              <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5">
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                  Charcoal Grill, Coastal Seafood & Craft Bar
                </h1>

                <p className="max-w-xl mx-auto text-sm sm:text-base text-stone-300 font-normal leading-relaxed">
                  Sironi brings 45-day dry-aged steaks, fresh Indian Ocean seafood, and handcrafted cocktails to Westlands Rooftop and Kilimani Garden Bistro.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => onLaunchGuestDemo()}
                    className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition shadow-xs active:scale-95"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Order Food</span>
                  </button>

                  <button
                    onClick={() => setCurrentPage('menu')}
                    className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm border border-white/20 backdrop-blur transition flex items-center gap-2"
                  >
                    <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                    <span>View Menu</span>
                  </button>

                  <button
                    onClick={() => setCurrentPage('contact')}
                    className="px-5 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs sm:text-sm border border-stone-700 transition flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Book a Table</span>
                  </button>
                </div>

                {/* Highlights Strip */}
                <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-3 text-left border-t border-stone-800">
                  <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                    <div className="text-amber-400 font-bold text-sm">45-Day Dry Aging</div>
                    <div className="text-xs text-stone-400 mt-0.5">In-house Himalayan salt chambers</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                    <div className="text-amber-400 font-bold text-sm">Kenyan Provenance</div>
                    <div className="text-xs text-stone-400 mt-0.5">Single-origin grass-fed beef</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                    <div className="text-amber-400 font-bold text-sm">Table QR Service</div>
                    <div className="text-xs text-stone-400 mt-0.5">Order and pay with M-Pesa</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                    <div className="text-amber-400 font-bold text-sm">Express Delivery</div>
                    <div className="text-xs text-stone-400 mt-0.5">Insulated thermal transport</div>
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURED DISHES */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">
                    Signature Dishes
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                    Prepared fresh over open coals and served daily across our dining rooms.
                  </p>
                </div>

                <button
                  onClick={() => setCurrentPage('menu')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <span>View All Categories</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {signatureDishes.slice(0, 6).map((dish) => (
                  <div
                    key={dish.id}
                    className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 right-2.5 bg-stone-900/90 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
                          KES {dish.price.toLocaleString()}
                        </div>
                        <div className="absolute bottom-2.5 left-2.5 flex gap-1 flex-wrap">
                          {dish.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-medium px-2 py-0.5 rounded bg-stone-900/80 text-amber-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-5 space-y-1.5">
                        <h3 className="font-bold text-base text-stone-900 dark:text-white">
                          {dish.name}
                        </h3>
                        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                          {dish.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between mt-3">
                      <span className="text-[11px] text-stone-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {dish.prepTime}
                      </span>

                      <button
                        onClick={() => onLaunchGuestDemo()}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Order</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* TABLE QR ORDERING FLOW */}
            <section className="bg-stone-100 dark:bg-stone-900/40 py-16 px-4 sm:px-6 border-y border-stone-200 dark:border-stone-800">
              <div className="max-w-7xl mx-auto space-y-10">
                <div className="max-w-xl text-center mx-auto space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">
                    Table QR Ordering
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                    Scan the code at your table to view our full menu, submit orders directly to the kitchen, and pay with M-Pesa.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <h3 className="font-semibold text-sm text-stone-900 dark:text-white">Scan Table QR</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Point your phone camera at the table QR code. Opens the digital menu instantly with no app download.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <h3 className="font-semibold text-sm text-stone-900 dark:text-white">Select & Customize</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Choose meat temperatures, sides, sauces, and spice levels directly on your screen.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <h3 className="font-semibold text-sm text-stone-900 dark:text-white">Straight to Kitchen</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Steaks route directly to the Charcoal station, seafood to hot lines, and drinks to the mixologist display.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                      4
                    </div>
                    <h3 className="font-semibold text-sm text-stone-900 dark:text-white">M-Pesa STK Checkout</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Review your bill and authorize payment via Safaricom M-Pesa push prompt without waiting for card machines.
                    </p>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => onLaunchGuestDemo()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-semibold text-xs hover:bg-stone-800 dark:hover:bg-stone-100 transition shadow-xs"
                  >
                    <Smartphone className="w-4 h-4 text-amber-500" />
                    <span>Launch Table 01 Demo</span>
                  </button>
                </div>
              </div>
            </section>

            {/* LOCATIONS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">
                  Our Locations
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  Open daily in Westlands and Kilimani for lunch, dinner, and late-night dining.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location 1: Westlands */}
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
                        alt="Sironi Rooftop"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-stone-950/40" />
                      <div className="absolute bottom-3 left-4 text-white">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 block">
                          Westlands Flagship
                        </span>
                        <h3 className="text-lg font-bold">Sironi Rooftop & Sky Lounge</h3>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                        Panoramic skyline views, Himalayan salt dry-aging display, open-flame charcoal grill, and signature cocktail terrace.
                      </p>
                      <div className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Sironi Plaza, 9th Floor, Chiromo Lane, Westlands</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Open Daily: 11:00 AM – 01:00 AM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>+254 700 123 456</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <button
                      onClick={() => setCurrentPage('contact')}
                      className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shadow-xs"
                    >
                      Book Westlands Rooftop
                    </button>
                  </div>
                </div>

                {/* Location 2: Kilimani */}
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
                        alt="Sironi Garden Bistro"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-stone-950/40" />
                      <div className="absolute bottom-3 left-4 text-white">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 block">
                          Garden & Woodfire
                        </span>
                        <h3 className="text-lg font-bold">Sironi Garden Bistro & Pizzeria</h3>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                        Serene botanical terrace, woodfired stone pizza ovens, shaded pergolas, family brunch, and handcrafted gelato.
                      </p>
                      <div className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Argwings Kodhek Road, Kilimani, Nairobi</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Open Daily: 07:00 AM – 11:00 PM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>+254 711 222 333</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <button
                      onClick={() => setCurrentPage('contact')}
                      className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shadow-xs"
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                Menu
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                Dry-aged steaks, coastal catch, fresh pasta, artisan burgers, and desserts.
              </p>

              {/* Category Filters */}
              <div className="flex flex-wrap justify-center gap-1.5 pt-3">
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'steaks', label: 'Steaks & Chops' },
                  { id: 'seafood', label: 'Seafood' },
                  { id: 'pasta', label: 'Pastas' },
                  { id: 'burgers', label: 'Burgers' },
                  { id: 'desserts', label: 'Desserts' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition ${
                      selectedCategory === cat.id
                        ? 'bg-amber-600 text-white font-semibold shadow-xs'
                        : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-sm transition flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-stone-900/90 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
                        KES {dish.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-5 space-y-1.5">
                      <h3 className="font-bold text-base text-stone-900 dark:text-white">
                        {dish.name}
                      </h3>
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                        {dish.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between mt-3">
                    <span className="text-[11px] text-stone-400">
                      Approx. {dish.prepTime}
                    </span>
                    <button
                      onClick={() => onLaunchGuestDemo()}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Order</span>
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                Contactless Table Ordering
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
                Scan the QR standee at your table to order at your own pace without waiting for paper menus.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-amber-600 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Try the Table 01 Demo</h3>
                <p className="text-xs text-amber-100 max-w-md leading-relaxed">
                  Experience guest ordering from a customer perspective. Add dishes, customize options, and test M-Pesa push prompts.
                </p>
              </div>
              <button
                onClick={() => onLaunchGuestDemo('T01')}
                className="px-5 py-2.5 rounded-lg bg-white text-stone-900 hover:bg-stone-100 font-semibold text-xs shadow-xs transition active:scale-95 whitespace-nowrap flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4 text-amber-600" />
                <span>Launch Table 01 Simulator</span>
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 4: ONLINE DELIVERY                                   */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'delivery' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                Online Delivery
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
                Charcoal steaks, burgers, and seafood delivered across Nairobi in insulated thermal packaging.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm">Direct Fleet Delivery</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Delivered by Sironi trained couriers with real-time route updates.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm">Thermal Packaging</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Insulated carriers keep food hot and crusts crisp during transit.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm">M-Pesa STK Push</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Instant, safe checkout prompt sent straight to your phone.
                </p>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => onLaunchGuestDemo()}
                className="px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition active:scale-95 inline-flex items-center gap-2"
              >
                <Truck className="w-4 h-4" />
                <span>Place Delivery Order</span>
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 5: PRIVATE DINING & EVENTS                           */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'events' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                Private Events
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
                Dedicated spaces for corporate dinners, wedding receptions, and family celebrations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                <h3 className="text-base font-bold">Executive Rooftop Suite</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Accommodates 15 to 50 seated guests with private bar, sommelier, and skyline terrace view.
                </p>
                <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 font-medium">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Private mixology cocktail station</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Custom physical and digital menus</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Built-in presentation audio-visual system</li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                <h3 className="text-base font-bold">Garden Pavilion & Lawn</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Accommodates 50 to 300 guests for outdoor banquets, cocktail galas, and family milestones in Kilimani.
                </p>
                <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 font-medium">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Live charcoal spit and carvery setups</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Covered pergolas with garden lighting</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600" /> Dedicated event director and staff</li>
                </ul>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setCurrentPage('contact')}
                className="px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shadow-xs"
              >
                Inquire for Private Events
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 6: TABLE RESERVATIONS                                */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'contact' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                Table Reservations
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
                Reserve your table at Westlands Rooftop or Kilimani Garden Bistro.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form */}
              <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
                {reservationSuccess ? (
                  <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h3 className="font-semibold text-sm">Reservation Received</h3>
                    <p className="text-xs leading-relaxed">
                      Thank you, {reservationForm.name}. Your booking for {reservationForm.guests} guests on {reservationForm.date} at {reservationForm.time} has been recorded.
                    </p>
                    <button
                      onClick={() => setReservationSuccess(false)}
                      className="mt-2 text-xs font-semibold text-amber-600 underline"
                    >
                      Make Another Booking
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReservationSubmit} className="space-y-3.5 text-xs font-medium">
                    <div>
                      <label className="block mb-1 text-stone-700 dark:text-stone-300">Full Name</label>
                      <input
                        type="text"
                        required
                        value={reservationForm.name}
                        onChange={(e) => setReservationForm({ ...reservationForm, name: e.target.value })}
                        placeholder="e.g. David Kimani"
                        className="w-full px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 text-stone-700 dark:text-stone-300">Phone</label>
                        <input
                          type="tel"
                          required
                          value={reservationForm.phone}
                          onChange={(e) => setReservationForm({ ...reservationForm, phone: e.target.value })}
                          placeholder="0722 000 000"
                          className="w-full px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-stone-700 dark:text-stone-300">Email (Optional)</label>
                        <input
                          type="email"
                          value={reservationForm.email}
                          onChange={(e) => setReservationForm({ ...reservationForm, email: e.target.value })}
                          placeholder="david@example.com"
                          className="w-full px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-stone-700 dark:text-stone-300">Location</label>
                      <select
                        value={reservationForm.location}
                        onChange={(e) => setReservationForm({ ...reservationForm, location: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                      >
                        <option>Sironi Rooftop & Sky Lounge (Westlands)</option>
                        <option>Sironi Garden Bistro & Pizzeria (Kilimani)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block mb-1 text-stone-700 dark:text-stone-300">Guests</label>
                        <select
                          value={reservationForm.guests}
                          onChange={(e) => setReservationForm({ ...reservationForm, guests: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-1 focus:ring-amber-500"
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
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-stone-700 dark:text-stone-300">Time</label>
                        <input
                          type="time"
                          required
                          value={reservationForm.time}
                          onChange={(e) => setReservationForm({ ...reservationForm, time: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-stone-700 dark:text-stone-300">Special Notes</label>
                      <textarea
                        rows={2}
                        value={reservationForm.specialRequests}
                        onChange={(e) => setReservationForm({ ...reservationForm, specialRequests: e.target.value })}
                        placeholder="Window table, birthday, dietary preference..."
                        className="w-full px-3.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition active:scale-95"
                    >
                      Confirm Reservation
                    </button>
                  </form>
                )}
              </div>

              {/* Direct Info */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                  <h3 className="font-semibold text-sm">Direct Contact</h3>
                  <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-stone-900 dark:text-white font-medium">+254 700 123 456 (Westlands) • +254 711 222 333 (Kilimani)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-amber-600" />
                      <span>reservations@sironi.kkdes.co.ke</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Lunch: 11:30 AM – 3:30 PM • Dinner: 6:00 PM – Midnight</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-2">
                  <div className="font-semibold text-xs text-amber-800 dark:text-amber-300">
                    Seated at a Table Right Now?
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    No reservation is needed if you are already seated. Simply scan the QR code located on your table to view our full menu and submit orders.
                  </p>
                  <button
                    onClick={() => onLaunchGuestDemo()}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline pt-1"
                  >
                    <span>Open Table QR Menu</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 3. FOOTER                                                 */}
      {/* ========================================================= */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-10 px-4 sm:px-6 text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-xs">
                  S
                </div>
                <span className="font-bold text-stone-900 dark:text-white">Sironi Restaurants</span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                Charcoal steaks, fresh coastal seafood, woodfired pizzas, and craft cocktails in Nairobi.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-stone-900 dark:text-stone-200 text-xs">Locations</span>
              <ul className="space-y-1 text-xs">
                <li>Westlands: Sironi Plaza, 9th Floor</li>
                <li>Kilimani: Argwings Kodhek Road</li>
                <li>Reservations: +254 700 123 456</li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-stone-900 dark:text-stone-200 text-xs">Guest Services</span>
              <ul className="space-y-1 text-xs">
                <li><button onClick={() => setCurrentPage('menu')} className="hover:text-amber-600">Dining Menu</button></li>
                <li><button onClick={() => setCurrentPage('delivery')} className="hover:text-amber-600">Online Delivery</button></li>
                <li><button onClick={() => setCurrentPage('contact')} className="hover:text-amber-600">Table Reservations</button></li>
                <li><button onClick={() => setCurrentPage('events')} className="hover:text-amber-600">Private Events</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-stone-900 dark:text-stone-200 text-xs">Staff</span>
              <ul className="space-y-1 text-xs">
                <li><button onClick={onOpenStaffPortal} className="text-amber-600 font-medium hover:underline">Staff Terminal Sign In</button></li>
                <li><button onClick={() => onLaunchGuestDemo('T01')} className="hover:text-amber-600">Table 01 Simulator</button></li>
                <li><span className="text-stone-400">sironi.kkdes.co.ke</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
            <span>© {new Date().getFullYear()} Sironi Restaurants. All rights reserved.</span>
            <span>Westlands & Kilimani, Nairobi • Safaricom M-Pesa Integrated</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
