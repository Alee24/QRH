import React, { useState, useEffect } from 'react';
import {
  QrCode,
  CreditCard,
  Clock,
  Smartphone,
  UtensilsCrossed,
  Truck,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  Navigation,
  ChevronRight,
  Info,
  ShieldCheck,
  Wine,
  Coffee,
  Cake,
  Egg,
  Users,
  Compass,
  RefreshCw,
  X,
} from 'lucide-react';
import { apiFetch } from '../../api/client.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Modal } from '../../components/Modal.js';
import { soundEffects } from '../../utils/audioChime.js';

interface PublicWebsiteProps {
  onNavigateToHotel?: (slug: string) => void;
  onLaunchGuestDemo: (tableToken?: string) => void;
  onOpenStaffPortal: () => void;
}

export type PublicPage = 'home' | 'menu' | 'qr_dining' | 'delivery' | 'events' | 'contact';

interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  portionName?: string;
  modifiers?: { name: string; price: number }[];
  image_url: string;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  onLaunchGuestDemo,
  onOpenStaffPortal,
}) => {
  const { branding } = useTheme();
  const [hotelProfile, setHotelProfile] = useState<{ name: string; logo_url: string | null } | null>(null);

  // Fetch genuine hotel name and uploaded logo from settings API
  useEffect(() => {
    fetch('/api/hotel/public-info')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d && d.name) {
          setHotelProfile({ name: d.name, logo_url: d.logo_url });
        }
      })
      .catch(() => {});
  }, []);

  const hotelName = hotelProfile?.name || branding?.platform_name || 'Sironi Restaurants';
  const logoUrl = hotelProfile?.logo_url || branding?.logo_url;

  const [currentPage, setCurrentPage] = useState<PublicPage>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Global Dining Basket / Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [selectedDishForModal, setSelectedDishForModal] = useState<any | null>(null);
  const [modalPortion, setModalPortion] = useState<any | null>(null);
  const [modalModifiers, setModalModifiers] = useState<Record<string, any>>({});
  const [modalQuantity, setModalQuantity] = useState(1);

  // M-Pesa Checkout Modal State (Cart Payout)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState('0712345678');
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<any | null>(null);

  // -------------------------------------------------------------
  // ONLINE DELIVERY STATE WITH GPS PINPOINT & DETAILED ADDRESS
  // -------------------------------------------------------------
  const [deliveryAddress, setDeliveryAddress] = useState({
    recipient_name: '',
    recipient_phone: '0712345678',
    estate: 'Westlands',
    street: 'Ring Road Parklands',
    building_name: '',
    house_number: '',
    delivery_notes: '',
    latitude: '',
    longitude: '',
    gps_accuracy: '',
  });
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);
  const [deliverySuccessOrder, setDeliverySuccessOrder] = useState<any | null>(null);

  // -------------------------------------------------------------
  // CATERING SERVICES & PRIVATE EVENTS STATE
  // -------------------------------------------------------------
  const [cateringForm, setCateringForm] = useState({
    customer_name: '',
    organization: '',
    customer_phone: '0712345678',
    customer_email: '',
    event_type: 'Corporate Banquet',
    guest_count: 50,
    event_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    event_time: '18:30',
    venue: 'Sironi Rooftop Executive Suites (Westlands)',
    package_name: 'Executive Corporate Banquet',
    budget_per_guest: 2800,
    special_requirements: '',
    include_chef: true,
    include_bartender: true,
    include_waitstaff: true,
    include_cutlery: true,
  });
  const [cateringSubmitting, setCateringSubmitting] = useState(false);
  const [cateringSuccess, setCateringSuccess] = useState<any | null>(null);

  // -------------------------------------------------------------
  // TABLE RESERVATION STATE WITH DEDUCTIBLE DEPOSIT (KES 500)
  // -------------------------------------------------------------
  const [reservationForm, setReservationForm] = useState({
    name: '',
    phone: '0712345678',
    email: '',
    guests: '2',
    date: new Date().toISOString().split('T')[0],
    time: '19:30',
    location: 'Sironi Rooftop & Sky Lounge (Westlands)',
    seatingPreference: 'Terrace Skyline Table',
    specialRequests: '',
    bookingFee: 500,
  });
  const [reservationSubmitting, setReservationSubmitting] = useState(false);
  const [reservationVoucher, setReservationVoucher] = useState<any | null>(null);

  // Fetch full live categorized dishes from API
  useEffect(() => {
    const loadMenu = async () => {
      setLoadingMenu(true);
      try {
        const res = await apiFetch<any>('/menu');
        if (res && res.categories && res.categories.length > 0) {
          setCategories(res.categories);
        }
      } catch (e) {
        console.error('Menu load error:', e);
      } finally {
        setLoadingMenu(false);
      }
    };
    loadMenu();
  }, []);

  // Compute all dishes across categories
  const allDishes = categories.flatMap((c) => (c.items || []).map((itm: any) => ({ ...itm, categoryName: c.name })));
  const displayedDishes = selectedCategory === 'all'
    ? allDishes
    : allDishes.filter((d: any) => d.category_id === selectedCategory || d.categoryName === selectedCategory);

  // Cart calculations
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Open Dish Customizer Modal
  const handleOpenDishModal = (dish: any) => {
    setSelectedDishForModal(dish);
    setModalQuantity(1);
    if (dish.portions && dish.portions.length > 0) {
      const def = dish.portions.find((p: any) => p.is_default) || dish.portions[0];
      setModalPortion(def);
    } else {
      setModalPortion(null);
    }
    const initialMods: Record<string, any> = {};
    if (dish.modifier_groups) {
      for (const mg of dish.modifier_groups) {
        if (mg.options?.length > 0) {
          initialMods[mg.id] = [mg.options[0]];
        }
      }
    }
    setModalModifiers(initialMods);
  };

  // Add Item to Basket
  const handleAddToCart = () => {
    if (!selectedDishForModal) return;

    let finalPrice = modalPortion ? modalPortion.price : selectedDishForModal.price;
    const selectedMods: { name: string; price: number }[] = [];

    Object.values(modalModifiers).forEach((opts: any) => {
      if (Array.isArray(opts)) {
        opts.forEach((o) => {
          finalPrice += o.price || 0;
          selectedMods.push({ name: o.name, price: o.price });
        });
      }
    });

    const itemKey = `${selectedDishForModal.id}_${modalPortion?.id || 'std'}_${selectedMods.map((m) => m.name).join('_')}`;

    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === itemKey);
      if (existing) {
        return prev.map((i) => (i.id === itemKey ? { ...i, quantity: i.quantity + modalQuantity } : i));
      }
      return [
        ...prev,
        {
          id: itemKey,
          menuItemId: selectedDishForModal.id,
          name: selectedDishForModal.name,
          price: finalPrice,
          quantity: modalQuantity,
          portionName: modalPortion?.name,
          modifiers: selectedMods,
          image_url: selectedDishForModal.image_url,
        },
      ];
    });

    soundEffects.playOrderPlaced();
    setSelectedDishForModal(null);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // -------------------------------------------------------------
  // GPS PINPOINT HANDLER
  // -------------------------------------------------------------
  const handlePinpointGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please enter your street and house number manually.');
      return;
    }

    setGpsDetecting(true);
    setGpsSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        const acc = Math.round(pos.coords.accuracy);

        setDeliveryAddress((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
          gps_accuracy: `±${acc}m accuracy`,
        }));

        setGpsDetecting(false);
        setGpsSuccess(true);
        soundEffects.playReadyChime();
      },
      (err) => {
        setGpsDetecting(false);
        alert(`GPS location error: ${err.message}. You can still enter your delivery address manually below.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // -------------------------------------------------------------
  // SUBMIT ONLINE DELIVERY ORDER
  // -------------------------------------------------------------
  const handlePlaceDeliveryOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Your basket is empty. Please add at least one dish for delivery.');
      return;
    }
    if (!deliveryAddress.recipient_name || !deliveryAddress.recipient_phone) {
      alert('Please enter your name and Safaricom phone number for delivery.');
      return;
    }
    if (!deliveryAddress.house_number) {
      alert('Please enter your House/Apartment/Door Number so our driver can locate your doorstep.');
      return;
    }

    setDeliverySubmitting(true);
    try {
      let phone = deliveryAddress.recipient_phone.replace(/\s+/g, '').replace(/^\+/, '');
      if (phone.startsWith('0') && phone.length === 10) phone = '254' + phone.substring(1);

      const deliveryPayload = {
        source: 'delivery',
        customerName: deliveryAddress.recipient_name,
        customerPhone: phone,
        delivery: {
          recipient_name: deliveryAddress.recipient_name,
          recipient_phone: phone,
          estate: deliveryAddress.estate,
          street: deliveryAddress.street,
          building_name: deliveryAddress.building_name,
          house_number: deliveryAddress.house_number,
          latitude: deliveryAddress.latitude,
          longitude: deliveryAddress.longitude,
          delivery_notes: deliveryAddress.delivery_notes,
          delivery_fee: 250,
        },
        items: cartItems.map((i) => ({
          menuItemId: i.menuItemId,
          portionName: i.portionName,
          portionPrice: i.price,
          quantity: i.quantity,
          modifiers: i.modifiers,
        })),
        idempotencyKey: `del_${Date.now()}_${Math.random().toString(36).slice(5)}`,
      };

      const order = await apiFetch<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(deliveryPayload),
      });

      // Trigger M-Pesa STK push simulation for delivery
      const stkRes = await apiFetch<any>('/payments/mpesa/stk-push', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: phone,
          amount: order.total_amount,
        }),
      });

      // Auto verify after 3.2s
      setTimeout(async () => {
        try {
          await apiFetch('/payments/mpesa/verify', {
            method: 'POST',
            body: JSON.stringify({
              orderId: order.id,
              checkoutRequestId: stkRes.checkoutRequestId,
            }),
          });
          soundEffects.playPaymentSuccess();
        } catch (e) {}
      }, 3200);

      soundEffects.playOrderPlaced();
      setDeliverySuccessOrder(order);
      setCartItems([]);
    } catch (err: any) {
      alert(`Delivery order error: ${err.message}`);
    } finally {
      setDeliverySubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // SUBMIT CATERING INQUIRY
  // -------------------------------------------------------------
  const handleCateringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cateringForm.customer_name || !cateringForm.customer_phone || !cateringForm.event_date) {
      alert('Please fill out your name, contact phone, and event date.');
      return;
    }

    setCateringSubmitting(true);
    try {
      const estimatedTotal = cateringForm.guest_count * cateringForm.budget_per_guest;
      const depositRequired = estimatedTotal * 0.2;

      const payload = {
        customer_name: cateringForm.customer_name,
        organization: cateringForm.organization,
        customer_phone: cateringForm.customer_phone,
        customer_email: cateringForm.customer_email,
        event_name: `${cateringForm.customer_name} ${cateringForm.event_type}`,
        event_type: cateringForm.event_type.toLowerCase().replace(/\s+/g, '_'),
        event_date: cateringForm.event_date,
        event_time: cateringForm.event_time,
        venue: cateringForm.venue,
        guest_count: cateringForm.guest_count,
        budget: estimatedTotal,
        package_id: cateringForm.package_name,
        special_instructions: [
          cateringForm.special_requirements,
          cateringForm.include_chef ? 'On-site Chef' : '',
          cateringForm.include_bartender ? 'Mobile Bar & Mixologists' : '',
          cateringForm.include_waitstaff ? 'Uniformed Service Crew' : '',
          cateringForm.include_cutlery ? 'Fine China & Cutlery' : '',
        ].filter(Boolean).join(' • '),
      };

      const res = await apiFetch<any>('/catering/public/enquiry', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      soundEffects.playReadyChime();
      setCateringSuccess({
        enquiry_number: res.enquiry_number || `SIRONI-CAT-${Math.floor(1000 + Math.random() * 9000)}`,
        estimatedTotal,
        depositRequired,
        ...cateringForm,
      });
    } catch (err: any) {
      alert(`Catering inquiry error: ${err.message}`);
    } finally {
      setCateringSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // SUBMIT TABLE RESERVATION WITH DEDUCTIBLE DEPOSIT (KES 500)
  // -------------------------------------------------------------
  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationForm.name || !reservationForm.phone || !reservationForm.date || !reservationForm.time) {
      alert('Please fill out your name, phone number, reservation date, and time.');
      return;
    }

    setReservationSubmitting(true);
    try {
      const payload = {
        customer_name: reservationForm.name,
        customer_phone: reservationForm.phone,
        customer_email: reservationForm.email,
        guest_count: parseInt(reservationForm.guests, 10) || 2,
        reservation_date: reservationForm.date,
        reservation_time: reservationForm.time,
        dining_location: reservationForm.location,
        special_requests: [reservationForm.seatingPreference, reservationForm.specialRequests].filter(Boolean).join(' • '),
        booking_fee: reservationForm.bookingFee,
      };

      const res = await apiFetch<any>('/tables/reservations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      soundEffects.playPaymentSuccess();
      setReservationVoucher(res.voucher || {
        booking_code: `SIRONI-RES-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_name: reservationForm.name,
        deposit_paid: 500,
        deductible_amount: 500,
        message: 'Advance table deposit of KES 500 received. 100% credited towards your food & drinks bill on arrival.',
      });
    } catch (err: any) {
      alert(`Reservation error: ${err.message}`);
    } finally {
      setReservationSubmitting(false);
    }
  };

  const navLinks: { id: PublicPage; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Dining Menu' },
    { id: 'delivery', label: 'Doorstep Delivery' },
    { id: 'events', label: 'Catering & Events' },
    { id: 'contact', label: 'Table Reservations' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans transition-colors pb-20">
      {/* ========================================================= */}
      {/* 1. RESTAURANT & HOTEL BRAND HEADER                        */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Hotel Emblem & Title from Settings */}
          <div
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={hotelName}
                className="w-10 h-10 rounded-xl object-contain bg-white border border-stone-200/80 shadow-xs"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {hotelName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex items-center">
              <span className="font-bold text-base sm:text-lg tracking-tight text-stone-900 leading-none">
                {hotelName}
              </span>
            </div>
          </div>

          {/* Primary Navigation - Clean, Single Line */}
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
            {/* Basket Button with Badge */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative p-2 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition"
              title="View Basket"
            >
              <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px] font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Quick Table Scan / Order CTA */}
            <button
              onClick={() => onLaunchGuestDemo()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition active:scale-95 whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan Table QR</span>
            </button>

            <button
              onClick={onOpenStaffPortal}
              className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition whitespace-nowrap"
            >
              Staff Portal
            </button>
          </div>
        </div>

        {/* Mobile Navigation Scrollbar */}
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
      {/* 2. BODY CONTENT ROUTER                                     */}
      {/* ========================================================= */}
      <main className="flex-1">
        {/* --------------------------------------------------------- */}
        {/* VIEW 1: HOME PAGE                                         */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'home' && (
          <div className="space-y-16 pb-16">
            {/* HERO BANNER - Sironi Hotel Nairobi & Multiple Restaurants */}
            <section className="relative overflow-hidden bg-stone-900 text-white py-20 sm:py-28 px-4 sm:px-6">
              <div
                className="absolute inset-0 z-0 opacity-25 bg-cover bg-center"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1920&q=80')` }}
              />
              <div className="absolute inset-0 bg-stone-950/75 z-0" />

              <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Boutique Hotel & Premier Restaurants Across Nairobi</span>
                </div>

                {/* Clear, Human-Crafted Hotel Headline */}
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  {hotelName}
                </h1>

                <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-300 font-normal leading-relaxed">
                  A premier hospitality destination based in Nairobi, featuring an acclaimed family of artisanal restaurants, rooftop sky lounges, and garden bistros across Westlands, Kilimani, Upper Hill, and Nairobi CBD.
                </p>

                {/* 4 Primary Action Buttons - Clear, Functional, Production-Ready */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => onLaunchGuestDemo()}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition shadow-sm active:scale-95"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Table QR Ordering</span>
                  </button>

                  <button
                    onClick={() => setCurrentPage('delivery')}
                    className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-medium text-xs sm:text-sm border border-stone-700 transition flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4 text-amber-400" />
                    <span>Order for Delivery</span>
                  </button>

                  <button
                    onClick={() => setCurrentPage('events')}
                    className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-medium text-xs sm:text-sm border border-stone-700 transition flex items-center gap-2"
                  >
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Catering & Private Events</span>
                  </button>

                  <button
                    onClick={() => setCurrentPage('contact')}
                    className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs sm:text-sm border border-stone-700 transition flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Book a Table (KES 500 Deductible)</span>
                  </button>
                </div>

                {/* 4 Feature Badges */}
                <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-left border-t border-stone-800/80">
                  <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                    <div className="text-amber-400 font-bold text-sm">Multiple Nairobi Outlets</div>
                    <div className="text-xs text-stone-400 mt-0.5">Westlands, Kilimani, Upper Hill & CBD</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                    <div className="text-amber-400 font-bold text-sm">Instant Table QR</div>
                    <div className="text-xs text-stone-400 mt-0.5">Scan, customize dish & pay with M-Pesa</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                    <div className="text-amber-400 font-bold text-sm">GPS Doorstep Delivery</div>
                    <div className="text-xs text-stone-400 mt-0.5">Pinpoint exact GPS location & house number</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
                    <div className="text-amber-400 font-bold text-sm">Bespoke Catering</div>
                    <div className="text-xs text-stone-400 mt-0.5">Banquets, galas & private event dining</div>
                  </div>
                </div>
              </div>
            </section>

            {/* RESTAURANTS & HOTEL LOCATIONS ACROSS NAIROBI */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">
                    Our Nairobi Hotel & Dining Locations
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                    Experience world-class culinary craft across Nairobi’s premier destinations.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentPage('contact')}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Reserve at Any Location →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Location 1: Westlands Rooftop */}
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
                        alt="Sironi Rooftop"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-stone-950/40" />
                      <div className="absolute bottom-3 left-4 text-white">
                        <span className="text-[10px] font-semibold text-amber-400 block uppercase tracking-wider">
                          Rooftop & Sky Lounge
                        </span>
                        <h3 className="text-base font-bold">Sironi Westlands Rooftop</h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                        45-day dry-aged steaks, artisan robata grill, sunset cocktail mixology, and panoramic Nairobi skyline views.
                      </p>
                      <div className="text-xs text-stone-500 space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>The Oval, 9th Floor, Ring Road Parklands, Westlands</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>11:30 AM – Midnight Daily</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => {
                        setReservationForm((prev) => ({ ...prev, location: 'Sironi Rooftop & Sky Lounge (Westlands)' }));
                        setCurrentPage('contact');
                      }}
                      className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition"
                    >
                      Book Westlands Table
                    </button>
                  </div>
                </div>

                {/* Location 2: Kilimani Garden Bistro */}
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
                        alt="Sironi Kilimani"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-stone-950/40" />
                      <div className="absolute bottom-3 left-4 text-white">
                        <span className="text-[10px] font-semibold text-amber-400 block uppercase tracking-wider">
                          Garden & Woodfire
                        </span>
                        <h3 className="text-base font-bold">Sironi Kilimani Garden Bistro</h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                        Lush botanical patio dining, woodfired stone pizza oven, fresh handmade pasta, and tranquil shaded pergolas.
                      </p>
                      <div className="text-xs text-stone-500 space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Argwings Kodhek Road, Kilimani, Nairobi</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>07:00 AM – 11:00 PM Daily</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => {
                        setReservationForm((prev) => ({ ...prev, location: 'Sironi Garden Bistro & Pizzeria (Kilimani)' }));
                        setCurrentPage('contact');
                      }}
                      className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition"
                    >
                      Book Kilimani Garden
                    </button>
                  </div>
                </div>

                {/* Location 3: Upper Hill Executive Club */}
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
                        alt="Sironi Upper Hill"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-stone-950/40" />
                      <div className="absolute bottom-3 left-4 text-white">
                        <span className="text-[10px] font-semibold text-amber-400 block uppercase tracking-wider">
                          Executive Dining & Suites
                        </span>
                        <h3 className="text-base font-bold">Sironi Upper Hill Club</h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                        Discreet corporate dining suites, sommelier wine vault, business power lunches, and diplomat board meetings.
                      </p>
                      <div className="text-xs text-stone-500 space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Hospital Road, Upper Hill Financial District</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>06:30 AM – 11:00 PM Daily</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => setCurrentPage('events')}
                      className="w-full py-2 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-xs transition"
                    >
                      Inquire for Executive Suites
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURED SIGNATURE DISHES WITH DIRECT "ADD TO BASKET" */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">
                    Culinary Signatures
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                    Click any dish to customize portions, sides, doneness, and add directly to your order basket.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentPage('menu')}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  View Full Menu ({allDishes.length} Dishes) →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {allDishes.slice(0, 8).map((dish: any) => (
                  <div
                    key={dish.id}
                    onClick={() => handleOpenDishModal(dish)}
                    className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-md hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative h-44 overflow-hidden bg-stone-100 dark:bg-stone-800">
                        <img
                          src={dish.image_url}
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                          KES {dish.price?.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3.5 space-y-1">
                        <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider block">
                          {dish.categoryName || 'Chef Selection'}
                        </span>
                        <h3 className="font-bold text-sm text-stone-900 dark:text-white group-hover:text-amber-600 transition line-clamp-1">
                          {dish.name}
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                          {dish.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 pt-0 flex items-center justify-between border-t border-stone-100 dark:border-stone-800/60 mt-2">
                      <span className="text-[11px] text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dish.estimated_prep_time || 15} mins
                      </span>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Order</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 2: DINING MENU WITH INTERACTIVE BASKET ORDERING      */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'menu' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
                Sironi Hotel Dining Menu
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                Aged charcoal steaks, wild coastal catch, artisanal pastas, and signature cocktails. Click any dish to customize options and build your dining basket.
              </p>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedCategory === 'all'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                  }`}
                >
                  All Dishes ({allDishes.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedCategory === c.id
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {c.name} ({c.items?.length || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Dishes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedDishes.map((dish: any) => (
                <div
                  key={dish.id}
                  onClick={() => handleOpenDishModal(dish)}
                  className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-md hover:border-amber-500/50 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-48 bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <img
                        src={dish.image_url}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                        KES {dish.price?.toLocaleString()}
                      </div>
                      {dish.dietary_flags && dish.dietary_flags.length > 0 && (
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                          {dish.dietary_flags.slice(0, 2).map((fl: string) => (
                            <span key={fl} className="px-2 py-0.5 rounded-md bg-amber-600/90 text-white text-[10px] font-bold">
                              {fl}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-1.5">
                      <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white group-hover:text-amber-600 transition">
                        {dish.name}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {dish.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between mt-3">
                    <span className="text-[11px] text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dish.estimated_prep_time || 15} mins
                    </span>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Basket</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 3: TABLE QR ORDERING PAGE                            */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'qr_dining' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
                Contactless Table QR Ordering
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
                Every table at Sironi features an individual wooden QR standee. Scan with any camera to instantly load our menu, customize portion sizes, add multiple dishes to your basket, and settle with M-Pesa.
              </p>
            </div>

            {/* Table QR Simulator Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-amber-600 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Live Dining Simulator</span>
                </div>
                <h3 className="text-xl font-bold">Simulate Table 01 Guest Experience</h3>
                <p className="text-xs text-amber-100 max-w-md leading-relaxed">
                  Experience full ordering from a guest table perspective. Browse categories, select portions/sides, build a basket of multiple items, submit orders to kitchen KDS, and test Safaricom M-Pesa STK payment.
                </p>
              </div>
              <button
                onClick={() => onLaunchGuestDemo('01')}
                className="px-6 py-3.5 rounded-2xl bg-white text-stone-900 hover:bg-stone-100 font-bold text-xs sm:text-sm shadow-md transition active:scale-95 whitespace-nowrap flex items-center gap-2"
              >
                <QrCode className="w-5 h-5 text-amber-600" />
                <span>Launch Table 01 Simulator</span>
              </button>
            </div>

            {/* How It Works 3-Step Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h4 className="font-bold text-sm">Scan Table QR Standee</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  No mobile app download needed. Your phone camera instantly opens the live dining menu synchronized to your specific table number.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h4 className="font-bold text-sm">Build Your Order Basket</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Select several dishes across steaks, seafood, pastas, drinks, and desserts. Customize temperatures, sauces, and allergy notes.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h4 className="font-bold text-sm">Instant M-Pesa Settlement</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Submit orders directly to kitchen KDS screens. Pay with M-Pesa STK PIN prompt and download your branded Sironi dining PDF receipt.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 4: DOORSTEP DELIVERY WITH GPS PINPOINT & HOUSE NO    */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'delivery' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
                Sironi Doorstep Delivery
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                Fresh kitchen dispatch packed in insulated thermal carriers. Pinpoint your exact GPS location or enter your street and apartment details.
              </p>
            </div>

            {deliverySuccessOrder ? (
              <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-4 max-w-lg mx-auto shadow-md">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-white">Delivery Order Confirmed!</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Thank you, <span className="font-bold">{deliveryAddress.recipient_name}</span>. Your delivery order <span className="font-mono font-bold text-amber-600">{deliverySuccessOrder.order_number}</span> has been dispatched to our kitchen dispatch team.
                </p>
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 text-xs text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Destination:</span>
                    <span className="font-bold">{deliveryAddress.estate}, House {deliveryAddress.house_number}</span>
                  </div>
                  {deliveryAddress.latitude && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">GPS Pinpoint:</span>
                      <span className="font-mono text-emerald-600">{deliveryAddress.latitude}, {deliveryAddress.longitude}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-500">Estimated Transit:</span>
                    <span className="font-bold text-amber-600">30–40 Minutes</span>
                  </div>
                  <div className="flex justify-between border-t border-stone-200 dark:border-stone-700 pt-2 font-bold">
                    <span>Total Paid:</span>
                    <span className="text-amber-600">KES {(deliverySuccessOrder.total_amount + 250).toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => setDeliverySuccessOrder(null)}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                >
                  Place Another Delivery Order
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Delivery Form with GPS Pinpointing */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-600" />
                        <h2 className="text-sm font-bold text-stone-900 dark:text-white">
                          Delivery Address & GPS Pinpoint
                        </h2>
                      </div>
                      <span className="text-[11px] text-stone-400">Step 1 of 2</span>
                    </div>

                    {/* GPS Pinpoint Button */}
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                            Pinpoint Exact GPS Location
                          </span>
                        </div>
                        {gpsSuccess && (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>GPS Locked</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                        Tap below to automatically detect your current GPS latitude and longitude coordinates for precision rider dispatch.
                      </p>
                      <button
                        type="button"
                        onClick={handlePinpointGPS}
                        disabled={gpsDetecting}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs active:scale-95 disabled:opacity-50"
                      >
                        {gpsDetecting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Detecting GPS Location...</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4" />
                            <span>📍 Pinpoint My Current Location</span>
                          </>
                        )}
                      </button>
                      {gpsSuccess && (
                        <div className="text-[10px] text-stone-500 font-mono pt-1">
                          Coordinates: {deliveryAddress.latitude}, {deliveryAddress.longitude} ({deliveryAddress.gps_accuracy})
                        </div>
                      )}
                    </div>

                    <form onSubmit={handlePlaceDeliveryOrder} className="space-y-4 text-xs">
                      {/* Name & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                            Recipient Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. David Mwangi"
                            value={deliveryAddress.recipient_name}
                            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, recipient_name: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-stone-700 dark:text-stone-300">
                              M-Pesa Phone Number *
                            </label>
                            <button
                              type="button"
                              onClick={() => setDeliveryAddress({ ...deliveryAddress, recipient_phone: '0712345678' })}
                              className="text-[10px] text-amber-600 hover:underline font-semibold"
                            >
                              ⚡ Demo Phone
                            </button>
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-stone-400 font-bold font-mono">+254</span>
                            <input
                              type="tel"
                              required
                              placeholder="0712345678"
                              value={deliveryAddress.recipient_phone}
                              onChange={(e) => setDeliveryAddress({ ...deliveryAddress, recipient_phone: e.target.value })}
                              className="w-full pl-14 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Estate & Street */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                            Estate / Neighborhood in Nairobi *
                          </label>
                          <select
                            value={deliveryAddress.estate}
                            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, estate: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                          >
                            <option>Westlands</option>
                            <option>Kilimani</option>
                            <option>Lavington</option>
                            <option>Parklands</option>
                            <option>Kileleshwa</option>
                            <option>Riverside Drive</option>
                            <option>Upper Hill</option>
                            <option>Nairobi CBD</option>
                            <option>South C / South B</option>
                            <option>Karen</option>
                            <option>Other Nairobi Area</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                            Road / Street Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Ring Road Parklands"
                            value={deliveryAddress.street}
                            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {/* Building & Mandatory House / Door Number */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                            Building / Apartment / Court Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Mirage Heights / Valley Court"
                            value={deliveryAddress.building_name}
                            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, building_name: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1 text-amber-600 dark:text-amber-400 font-bold">
                            House / Apartment / Door Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Apt 4B, 3rd Floor, House 12"
                            value={deliveryAddress.house_number}
                            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, house_number: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/50 dark:border-amber-500 bg-amber-50/20 dark:bg-stone-800 text-stone-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {/* Delivery Instructions */}
                      <div>
                        <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                          Rider Instructions (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Gate 2, call upon arrival, leave with concierge"
                          value={deliveryAddress.delivery_notes}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, delivery_notes: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={deliverySubmitting || cartItems.length === 0}
                          className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                          {deliverySubmitting ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Sending M-Pesa STK Prompt...</span>
                            </>
                          ) : (
                            <>
                              <Truck className="w-4 h-4" />
                              <span>Confirm Delivery & Pay KES {(cartSubtotal + 250).toLocaleString()} via M-Pesa</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right Column: Basket Summary & Dish Additions */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                      <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-amber-600" />
                        <span>Delivery Basket ({cartItemCount} items)</span>
                      </h2>
                      {cartItems.length > 0 && (
                        <button
                          onClick={() => setCartItems([])}
                          className="text-[11px] text-stone-400 hover:text-rose-600"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {cartItems.length === 0 ? (
                      <div className="py-8 text-center space-y-3">
                        <p className="text-xs text-stone-500">Your delivery basket is currently empty.</p>
                        <button
                          onClick={() => setCurrentPage('menu')}
                          className="px-4 py-2 rounded-xl bg-amber-600/10 text-amber-600 font-semibold text-xs hover:bg-amber-600/20 transition"
                        >
                          + Add Dishes from Menu
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {cartItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                              <div className="min-w-0">
                                <h4 className="font-bold text-stone-900 dark:text-stone-100 truncate">{item.name}</h4>
                                <span className="text-[11px] text-amber-600 font-semibold">
                                  KES {item.price.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                className="w-6 h-6 rounded bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="font-bold w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className="w-6 h-6 rounded bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Cost Breakdown */}
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-1.5 text-xs">
                      <div className="flex justify-between text-stone-500">
                        <span>Dishes Subtotal:</span>
                        <span className="font-mono">KES {cartSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-stone-500">
                        <span>Nairobi Rider Dispatch:</span>
                        <span className="font-mono">KES 250</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-stone-900 dark:text-white pt-1 border-t border-stone-200 dark:border-stone-700">
                        <span>Total Payable:</span>
                        <span className="font-mono text-amber-600">KES {(cartSubtotal + (cartItems.length > 0 ? 250 : 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 5: CATERING SERVICES & PRIVATE EVENTS STUDIO         */}
        {/* --------------------------------------------------------- */}
        {currentPage === 'events' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
            <div className="space-y-2 text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>Bespoke Hospitality & Banqueting</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
                Sironi Catering & Private Events
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                From executive corporate galas at our Westlands rooftop suites to outdoor wedding banquets in Kilimani or private residences across Nairobi. Complete with mobile bars, on-site chefs, and fine table settings.
              </p>
            </div>

            {cateringSuccess ? (
              <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-4 max-w-lg mx-auto shadow-md">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-white">Catering Request Received!</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Reference: <span className="font-mono font-bold text-amber-600">{cateringSuccess.enquiry_number}</span>. Our Executive Chef and Event Coordinator will review your banquet parameters and contact you within 2 hours.
                </p>
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 text-xs text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Package:</span>
                    <span className="font-bold">{cateringSuccess.package_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Guests & Date:</span>
                    <span className="font-bold">{cateringSuccess.guest_count} Guests • {cateringSuccess.event_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Estimated Total:</span>
                    <span className="font-bold">KES {cateringSuccess.estimatedTotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-stone-200 dark:border-stone-700 pt-2 font-bold text-amber-600">
                    <span>20% Commitment Deposit:</span>
                    <span>KES {cateringSuccess.depositRequired?.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => setCateringSuccess(null)}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                >
                  Create Another Catering Inquiry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 4 Catering Packages Cards */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">Curated Banqueting Packages</h3>
                  {[
                    {
                      name: 'Executive Corporate Banquet',
                      rate: 2800,
                      desc: '45-day roast carvery, fresh Indian ocean snapper, hot chafers, salads, and dark chocolate fondants.',
                      ideal: 'Conferences & Board Galas',
                    },
                    {
                      name: 'Swahili & Coast Wedding Feast',
                      rate: 3200,
                      desc: 'Whole spit-roasted seasoned goat, aromatic pilau, Samaki wa Kupaka, coconut rice, and coastal kachumbari.',
                      ideal: 'Traditional & Modern Weddings',
                    },
                    {
                      name: 'Cocktail Canapés & Mobile Bar',
                      rate: 2200,
                      desc: 'Artisanal sliders, charred tiger prawn skewers, arancini, mixologist craft bar, and botanical mocktails.',
                      ideal: 'Networking & Brand Launches',
                    },
                    {
                      name: 'VIP Ambassadorial 5-Course Plated',
                      rate: 4500,
                      desc: 'Individual 5-course chef tasting menu, Procera pairings, sommelier service, and bespoke fine china.',
                      ideal: 'High-Level Diplomatic Milestones',
                    },
                  ].map((pkg) => (
                    <div
                      key={pkg.name}
                      onClick={() => setCateringForm({ ...cateringForm, package_name: pkg.name, budget_per_guest: pkg.rate })}
                      className={`p-4 rounded-2xl border transition cursor-pointer ${
                        cateringForm.package_name === pkg.name
                          ? 'border-amber-600 bg-amber-500/10 shadow-xs'
                          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">{pkg.name}</h4>
                        <span className="font-mono font-bold text-xs text-amber-600">KES {pkg.rate.toLocaleString()}/pax</span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">{pkg.desc}</p>
                      <span className="text-[10px] text-stone-400 font-semibold mt-2 block">Ideal for: {pkg.ideal}</span>
                    </div>
                  ))}
                </div>

                {/* Catering Form */}
                <div className="lg:col-span-7">
                  <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
                    <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
                      <h3 className="text-sm font-bold text-stone-900 dark:text-white">Catering Requirements Form</h3>
                      <p className="text-xs text-stone-500">Provide details for your upcoming corporate dinner or private celebration.</p>
                    </div>

                    <form onSubmit={handleCateringSubmit} className="space-y-4 text-xs font-medium">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-1 text-stone-700 dark:text-stone-300">Contact Person Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Grace Wanjiku"
                            value={cateringForm.customer_name}
                            onChange={(e) => setCateringForm({ ...cateringForm, customer_name: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block mb-1 text-stone-700 dark:text-stone-300">Company / Organization</label>
                          <input
                            type="text"
                            placeholder="e.g. Nairobi Tech Hub / Private"
                            value={cateringForm.organization}
                            onChange={(e) => setCateringForm({ ...cateringForm, organization: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-1 text-stone-700 dark:text-stone-300">Contact Phone Number *</label>
                          <input
                            type="tel"
                            required
                            placeholder="0722 000 000"
                            value={cateringForm.customer_phone}
                            onChange={(e) => setCateringForm({ ...cateringForm, customer_phone: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block mb-1 text-stone-700 dark:text-stone-300">Work Email (Optional)</label>
                          <input
                            type="email"
                            placeholder="grace@company.co.ke"
                            value={cateringForm.customer_email}
                            onChange={(e) => setCateringForm({ ...cateringForm, customer_email: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block mb-1 text-stone-700 dark:text-stone-300">Number of Guests *</label>
                          <input
                            type="number"
                            min="15"
                            max="1000"
                            required
                            value={cateringForm.guest_count}
                            onChange={(e) => setCateringForm({ ...cateringForm, guest_count: parseInt(e.target.value, 10) || 15 })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block mb-1 text-stone-700 dark:text-stone-300">Event Date *</label>
                          <input
                            type="date"
                            required
                            value={cateringForm.event_date}
                            onChange={(e) => setCateringForm({ ...cateringForm, event_date: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block mb-1 text-stone-700 dark:text-stone-300">Serving Time</label>
                          <input
                            type="time"
                            value={cateringForm.event_time}
                            onChange={(e) => setCateringForm({ ...cateringForm, event_time: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block mb-1 text-stone-700 dark:text-stone-300">Venue / Location *</label>
                        <select
                          value={cateringForm.venue}
                          onChange={(e) => setCateringForm({ ...cateringForm, venue: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        >
                          <option>Sironi Rooftop Executive Suites (Westlands)</option>
                          <option>Sironi Botanical Garden Pavilion (Kilimani)</option>
                          <option>Client Private Residence / Corporate Headquarters (Nairobi)</option>
                          <option>Other Nairobi Venue</option>
                        </select>
                      </div>

                      {/* Equipment and Staff Options */}
                      <div className="pt-1">
                        <label className="block mb-1.5 font-bold text-stone-800 dark:text-stone-200">
                          Included Hospitality Services
                        </label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 dark:bg-stone-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cateringForm.include_chef}
                              onChange={(e) => setCateringForm({ ...cateringForm, include_chef: e.target.checked })}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span>On-Site Head Chef</span>
                          </label>

                          <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 dark:bg-stone-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cateringForm.include_bartender}
                              onChange={(e) => setCateringForm({ ...cateringForm, include_bartender: e.target.checked })}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span>Mobile Bar & Mixologists</span>
                          </label>

                          <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 dark:bg-stone-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cateringForm.include_waitstaff}
                              onChange={(e) => setCateringForm({ ...cateringForm, include_waitstaff: e.target.checked })}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span>Uniformed Service Crew</span>
                          </label>

                          <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 dark:bg-stone-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cateringForm.include_cutlery}
                              onChange={(e) => setCateringForm({ ...cateringForm, include_cutlery: e.target.checked })}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span>Chafing Dishes & Cutlery</span>
                          </label>
                        </div>
                      </div>

                      {/* Dynamic Estimate & 20% Deposit Box */}
                      <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[11px] text-stone-500 block">
                            Estimated Quotation ({cateringForm.guest_count} guests @ KES {cateringForm.budget_per_guest.toLocaleString()}/pax)
                          </span>
                          <span className="text-base font-extrabold text-stone-900 dark:text-white">
                            KES {(cateringForm.guest_count * cateringForm.budget_per_guest).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-amber-600 font-bold block">20% Booking Commitment Deposit:</span>
                          <span className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100">
                            KES {(cateringForm.guest_count * cateringForm.budget_per_guest * 0.2).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={cateringSubmitting}
                        className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                      >
                        {cateringSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Submitting Catering Inquiry...</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4" />
                            <span>Submit Catering Order & Request Formal Quotation</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 6: TABLE RESERVATION WITH DEDUCTIBLE DEPOSIT (KES 500)*/}
        {/* --------------------------------------------------------- */}
        {currentPage === 'contact' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
            <div className="space-y-2 text-center max-w-xl mx-auto">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
                Reserve Your Table
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Book a table at our Westlands Rooftop or Kilimani Garden Bistro. A modest commitment deposit of KES 500 secures your reservation and is 100% credited directly towards your food and beverage order.
              </p>
            </div>

            {reservationVoucher ? (
              <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-4 max-w-lg mx-auto shadow-md">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-white">Reservation Confirmed!</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Thank you, <span className="font-bold">{reservationForm.name}</span>. Your table is reserved for <span className="font-bold">{reservationForm.guests} guests</span> on <span className="font-bold">{reservationForm.date} at {reservationForm.time}</span>.
                </p>

                {/* Digital Voucher Card */}
                <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-dashed border-amber-500/30 text-left space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      Sironi Dining Credit Voucher
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono font-bold text-[10px]">
                      PAID & VERIFIED
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-stone-500 block">Booking Reference Code:</span>
                      <span className="font-mono text-base font-extrabold text-amber-600">
                        {reservationVoucher.booking_code}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-stone-500 block">Deductible Dining Credit:</span>
                      <span className="font-mono text-base font-extrabold text-emerald-600">
                        KES {reservationVoucher.deductible_amount?.toLocaleString() || 500}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
                    Present this voucher code to your waiter or cashier upon seating. Your KES 500 commitment fee will be deducted directly from your final dining bill.
                  </p>
                </div>

                <button
                  onClick={() => setReservationVoucher(null)}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                >
                  Make Another Reservation
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Form */}
                <div className="md:col-span-7 p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white border-b border-stone-100 dark:border-stone-800 pb-2">
                    Table Booking Details
                  </h3>

                  <form onSubmit={handleReservationSubmit} className="space-y-3.5 text-xs font-medium">
                    <div>
                      <label className="block mb-1 text-stone-700 dark:text-stone-300">Guest Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. David Mwangi"
                        value={reservationForm.name}
                        onChange={(e) => setReservationForm({ ...reservationForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-stone-700 dark:text-stone-300">M-Pesa Phone *</label>
                          <button
                            type="button"
                            onClick={() => setReservationForm({ ...reservationForm, phone: '0712345678' })}
                            className="text-[10px] text-amber-600 hover:underline font-semibold"
                          >
                            ⚡ Demo
                          </button>
                        </div>
                        <input
                          type="tel"
                          required
                          placeholder="0722 000 000"
                          value={reservationForm.phone}
                          onChange={(e) => setReservationForm({ ...reservationForm, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-stone-700 dark:text-stone-300">Email (Optional)</label>
                        <input
                          type="email"
                          placeholder="david@example.com"
                          value={reservationForm.email}
                          onChange={(e) => setReservationForm({ ...reservationForm, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-stone-700 dark:text-stone-300">Dining Location *</label>
                      <select
                        value={reservationForm.location}
                        onChange={(e) => setReservationForm({ ...reservationForm, location: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      >
                        <option>Sironi Rooftop & Sky Lounge (Westlands)</option>
                        <option>Sironi Garden Bistro & Pizzeria (Kilimani)</option>
                        <option>Sironi Upper Hill Executive Club</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block mb-1 text-stone-700 dark:text-stone-300">Party Size *</label>
                        <select
                          value={reservationForm.guests}
                          onChange={(e) => setReservationForm({ ...reservationForm, guests: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="1">1 Guest</option>
                          <option value="2">2 Guests</option>
                          <option value="4">4 Guests</option>
                          <option value="6">6 Guests</option>
                          <option value="8">8 Guests</option>
                          <option value="12">12+ Guests</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 text-stone-700 dark:text-stone-300">Date *</label>
                        <input
                          type="date"
                          required
                          value={reservationForm.date}
                          onChange={(e) => setReservationForm({ ...reservationForm, date: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-stone-700 dark:text-stone-300">Time *</label>
                        <input
                          type="time"
                          required
                          value={reservationForm.time}
                          onChange={(e) => setReservationForm({ ...reservationForm, time: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-stone-700 dark:text-stone-300">Special Celebration Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Wedding anniversary, birthday cake, window seating..."
                        value={reservationForm.specialRequests}
                        onChange={(e) => setReservationForm({ ...reservationForm, specialRequests: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={reservationSubmitting}
                        className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                      >
                        {reservationSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing KES 500 M-Pesa STK...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            <span>Pay KES 500 Deductible Booking Fee & Confirm</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Info Box: Deductible Deposit Guarantee */}
                <div className="md:col-span-5 space-y-4">
                  <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4 shadow-xs">
                    <div className="flex items-center gap-2 text-amber-600">
                      <ShieldCheck className="w-5 h-5" />
                      <h4 className="font-bold text-sm text-stone-900 dark:text-white">100% Deductible Booking Fee</h4>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      To ensure seamless table allocation and prevent no-shows during peak dining service, a modest commitment fee of <span className="font-bold text-stone-900 dark:text-white">KES 500</span> is charged at booking.
                    </p>

                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                      <span className="font-bold block">✓ Fully Credited to Your Food Bill:</span>
                      <p className="text-[11px] text-stone-600 dark:text-stone-300">
                        When your dining bill is presented at your table, the KES 500 deposit is subtracted directly from the total amount.
                      </p>
                    </div>

                    <div className="pt-2 space-y-2 text-xs text-stone-500">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Instant SMS & WhatsApp voucher confirmation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Complimentary table holding for 20 minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Free cancellation up to 3 hours before seating</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 3. FLOATING ORDER BASKET BAR (Visible when items in cart) */}
      {/* ========================================================= */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40 animate-slideUp">
          <div className="p-3.5 rounded-2xl bg-stone-900/95 dark:bg-stone-100/95 backdrop-blur text-white dark:text-stone-900 shadow-2xl flex items-center justify-between border border-stone-800 dark:border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold text-sm">
                {cartItemCount}
              </div>
              <div>
                <span className="text-[11px] text-stone-300 dark:text-stone-600 block">Current Basket</span>
                <span className="font-extrabold text-sm sm:text-base font-mono">
                  KES {cartSubtotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setCartDrawerOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
            >
              <span>Review Order & Checkout</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. BASKET & CHECKOUT DRAWER MODAL                         */}
      {/* ========================================================= */}
      <Modal
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        title={`Your Dining Basket (${cartItemCount} items)`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {cartItems.length === 0 ? (
            <div className="py-8 text-center text-stone-400">Your basket is empty.</div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-stone-900 dark:text-white truncate">{item.name}</h4>
                      {item.portionName && (
                        <span className="text-[10px] text-amber-600 font-semibold block">{item.portionName}</span>
                      )}
                      <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300">
                        KES {item.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg bg-stone-200 dark:bg-stone-700 p-1">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center font-bold hover:bg-stone-300 dark:hover:bg-stone-600"
                      >
                        -
                      </button>
                      <span className="font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center font-bold hover:bg-stone-300 dark:hover:bg-stone-600"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, -item.quantity)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subtotal & Actions */}
          <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800 flex justify-between items-center text-xs">
            <span className="font-medium text-stone-500">Order Subtotal:</span>
            <span className="font-mono font-extrabold text-base text-stone-900 dark:text-white">
              KES {cartSubtotal.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                setCartDrawerOpen(false);
                setCurrentPage('delivery');
              }}
              className="py-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold flex items-center justify-center gap-1.5 transition text-xs"
            >
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Checkout as Delivery</span>
            </button>

            <button
              onClick={() => {
                setCartDrawerOpen(false);
                onLaunchGuestDemo();
              }}
              className="py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-1.5 transition shadow-sm text-xs"
            >
              <QrCode className="w-4 h-4" />
              <span>Order at Table / Scan</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* 5. DISH CUSTOMIZATION MODAL (Portions, Sides, Modifiers)  */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(selectedDishForModal)}
        onClose={() => setSelectedDishForModal(null)}
        title={selectedDishForModal?.name || 'Customize Dish'}
        maxWidth="md"
      >
        {selectedDishForModal && (
          <div className="space-y-4 text-xs">
            <div className="relative h-40 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 -mt-2">
              <img
                src={selectedDishForModal.image_url}
                alt={selectedDishForModal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black/70 text-white font-bold px-2.5 py-1 rounded-md">
                KES {(modalPortion ? modalPortion.price : selectedDishForModal.price).toLocaleString()}
              </div>
            </div>

            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
              {selectedDishForModal.description}
            </p>

            {/* Portions Selection */}
            {selectedDishForModal.portions && selectedDishForModal.portions.length > 0 && (
              <div className="space-y-1.5">
                <label className="font-bold text-stone-800 dark:text-stone-200 block uppercase tracking-wider text-[11px]">
                  Select Portion Size
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedDishForModal.portions.map((p: any) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setModalPortion(p)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        modalPortion?.name === p.name
                          ? 'border-amber-600 bg-amber-500/10 text-amber-900 dark:text-amber-200 font-bold'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="text-xs">{p.name}</div>
                      <div className="text-[11px] font-mono text-amber-600">KES {p.price.toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Add Button */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-stone-100 dark:bg-stone-800 p-1">
                <button
                  type="button"
                  onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-stone-700 flex items-center justify-center font-bold text-sm shadow-xs"
                >
                  -
                </button>
                <span className="font-bold w-6 text-center text-sm">{modalQuantity}</span>
                <button
                  type="button"
                  onClick={() => setModalQuantity(modalQuantity + 1)}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-stone-700 flex items-center justify-center font-bold text-sm shadow-xs"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>
                  Add to Basket • KES {((modalPortion ? modalPortion.price : selectedDishForModal.price) * modalQuantity).toLocaleString()}
                </span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================= */}
      {/* 6. GLOBAL FOOTER                                          */}
      {/* ========================================================= */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={hotelName}
                className="w-6 h-6 rounded-md object-contain bg-white border border-stone-200 shadow-xs"
              />
            ) : (
              <div className="w-6 h-6 rounded-md bg-amber-600 flex items-center justify-center text-white font-bold text-xs">
                {hotelName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-stone-800">
              {hotelName}
            </span>
          </div>
          <div>
            Multiple Outlets Across Westlands, Kilimani, Upper Hill & Nairobi CBD
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentPage('contact')} className="hover:underline">
              Reservations
            </button>
            <span>•</span>
            <button onClick={() => setCurrentPage('delivery')} className="hover:underline">
              Delivery
            </button>
            <span>•</span>
            <button onClick={() => setCurrentPage('events')} className="hover:underline">
              Catering
            </button>
            <span>•</span>
            <button onClick={onOpenStaffPortal} className="text-amber-600 hover:underline font-semibold">
              Staff Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
