import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { ThemeSelectorModal } from './ThemeSelectorModal.js';
import { MasterQrModal } from './MasterQrModal.js';
import {
  Menu,
  Sun,
  Moon,
  QrCode,
  Building2,
  ChevronRight,
  Sparkles,
  Wifi,
  Bell,
  Volume2,
  VolumeX,
  CreditCard,
  LayoutGrid,
  Tv,
  MenuSquare,
  Check,
  Trash2,
  Clock,
  ArrowRight,
  X,
  ShoppingBag,
  Truck,
  Calendar,
  Palette
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onMobileMenuOpen: () => void;
  collapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onMobileMenuOpen,
}) => {
  const { theme, toggleTheme, currentPreset } = useTheme();
  const { user } = useAuth();
  const { connected } = useSocket();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    soundEnabled,
    toggleSound,
    toastAlert,
    dismissToast,
  } = useNotifications();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [masterQrModalOpen, setMasterQrModalOpen] = useState(false);

  const titleMap: Record<string, { category: string; title: string }> = {
    saas_showcase: { category: 'Hospitality SaaS', title: 'PlateIQ Cloud Platform Tour' },
    hotel_showcase: { category: 'Subscriber Showcase', title: "Hotel Ambiance & Today's Menu" },
    saas_dashboard: { category: 'SaaS Platform Core', title: 'Platform Control Center' },
    saas_branding: { category: 'White-Label Branding', title: 'Branding & Appearance Studio' },
    orders: { category: 'Central Order Hub', title: 'Omnichannel Orders & Kanban Pipeline' },
    delivery: { category: 'Fleet Logistics', title: 'Delivery Dispatch & Zones Management' },
    driver_portal: { category: 'Driver Dashboard', title: 'Courier Mobile Portal & Proof of Delivery' },
    catering: { category: 'Events & Banquets', title: 'Catering Management & Quotation Engine' },
    customer: { category: 'Guest Portal', title: 'Customer QR Self-Ordering' },
    cashier: { category: 'Point of Sale', title: 'Cashier POS & Consolidated Billing' },
    tables: { category: 'Front of House', title: 'Floor Plan & QR Code Management' },
    service: { category: 'Operations', title: 'Food Runner & Service Queue' },
    kds: { category: 'Kitchen Station', title: 'Touchscreen Kitchen Display (KDS)' },
    menu: { category: 'Culinary Administration', title: 'Menu Items, Prices & CSV Upload' },
    inventory: { category: 'Supply Chain', title: 'Inventory & Recipe BOM' },
    hotel: { category: 'Property Management', title: 'Hotel Guest Rooms & PMS Folios' },
    reports: { category: 'Executive Intelligence', title: 'Sales Analytics & M-Pesa Audit' },
    users: { category: 'Security & Access', title: 'Staff Role-Based Permissions' },
    hotel_settings: { category: 'Hotel Administration', title: 'Hotel Details, M-Pesa & System Settings' },
    login: { category: 'Authentication', title: 'Staff Terminal Sign In' },
  };

  const current = titleMap[currentTab] || { category: 'POS Management', title: 'Dashboard' };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b border-stone-200/80 dark:border-stone-800/80 px-3 sm:px-5 h-15 flex items-center justify-between transition-colors shadow-xs">
        {/* 1. LEFT: Hamburger & Breadcrumbs */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Open Navigation"
          >
            <Menu size={19} />
          </button>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-stone-400 font-medium hidden sm:inline">
              {current.category}
            </span>
            <ChevronRight size={12} className="text-stone-400 hidden sm:inline" />
            <h2 className="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-sm tracking-tight truncate max-w-[140px] sm:max-w-none">
              {current.title}
            </h2>
          </div>
        </div>

        {/* 2. CENTER: HIGH-FREQUENCY OPERATIONAL SHORTCUTS */}
        <div className="hidden xl:flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => onTabChange('orders')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
              currentTab === 'orders'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag size={14} className="text-amber-600" />
            <span>Orders</span>
          </button>

          <button
            onClick={() => onTabChange('cashier')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
              currentTab === 'cashier'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <CreditCard size={14} className="text-emerald-600" />
            <span>POS Billing</span>
          </button>

          <button
            onClick={() => onTabChange('delivery')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
              currentTab === 'delivery'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Truck size={14} className="text-blue-500" />
            <span>Delivery</span>
          </button>

          <button
            onClick={() => onTabChange('catering')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
              currentTab === 'catering'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Calendar size={14} className="text-purple-500" />
            <span>Catering</span>
          </button>

          <button
            onClick={() => onTabChange('kds')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
              currentTab === 'kds'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Tv size={14} className="text-orange-500" />
            <span>KDS</span>
          </button>
        </div>

        {/* 3. RIGHT: NOTIFICATIONS, SOUND, QR TOGGLE, THEME */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Live Sync Status */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-[11px] font-semibold text-stone-600 dark:text-stone-400">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
              }`}
            />
            <span className="hidden lg:inline">{connected ? 'Live Sync' : 'Offline'}</span>
          </div>

          {/* Sound Chime Toggle */}
          <button
            onClick={toggleSound}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              soundEnabled
                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                : 'text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title={soundEnabled ? 'Order Sound Enabled' : 'Order Sound Muted'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* ORDER NOTIFICATION BELL & DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen((prev) => !prev)}
              className="relative p-1.5 sm:p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              title="Recent Table Orders"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white font-extrabold text-[9px] flex items-center justify-center animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl z-50 overflow-hidden animate-fadeIn">
                <div className="p-3 bg-stone-50 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Bell size={14} className="text-amber-600" />
                    <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100">
                      Live Customer Orders
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-amber-600 hover:underline font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                        title="Clear all"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/80">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-stone-400 text-xs">
                      <Bell size={24} className="mx-auto mb-2 text-stone-300 dark:text-stone-700" />
                      <p className="font-semibold text-stone-600 dark:text-stone-300">
                        No recent orders
                      </p>
                      <p className="text-[11px] mt-0.5">
                        New customer QR and POS orders will appear here in real-time.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markAsRead(notif.id);
                          setNotifDropdownOpen(false);
                          onTabChange('cashier');
                        }}
                        className={`p-3 hover:bg-stone-50 dark:hover:bg-stone-800/60 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                          !notif.read ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[10px] font-extrabold font-mono">
                              {notif.tableNumber}
                            </span>
                            <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                              {notif.orderNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {notif.timestamp}
                            </span>
                            <span>•</span>
                            <span>{notif.itemCount} items</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-xs text-amber-600 dark:text-amber-400 block">
                            KES {notif.amount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-stone-400 flex items-center justify-end gap-0.5 mt-1">
                            View <ArrowRight size={10} />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Master Hotel QR Standee Button */}
          <button
            onClick={() => setMasterQrModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-bold border border-stone-200 dark:border-stone-700 transition-all text-stone-700 dark:text-stone-300"
            title="Print Master Hotel QR Code Standee"
          >
            <QrCode size={14} className="text-amber-500" />
            <span className="hidden md:inline">Master QR</span>
          </button>

          {/* 10-Theme Palette Selector */}
          <button
            onClick={() => setThemeModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-bold border border-stone-200 dark:border-stone-700 transition-all text-stone-700 dark:text-stone-300"
            title="Select App Theme (10 Presets Available)"
          >
            <Palette size={14} style={{ color: currentPreset.primaryColor }} />
            <span
              className="w-2.5 h-2.5 rounded-full shadow-xs"
              style={{ backgroundColor: currentPreset.primaryColor }}
            />
            <span className="hidden xl:inline">{currentPreset.name.split(' ')[0]}</span>
          </button>

          {/* Quick QR Toggle */}
          {currentTab !== 'customer' && (
            <button
              onClick={() => onTabChange('customer')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold border border-amber-500/20 transition-all"
              title="Open Customer QR Ordering Simulator"
            >
              <QrCode size={14} />
              <span className="hidden sm:inline">QR Menu</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Global Modals for Themes & Master Hotel QR Standee */}
      <ThemeSelectorModal isOpen={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
      <MasterQrModal isOpen={masterQrModalOpen} onClose={() => setMasterQrModalOpen(false)} />

      {/* 4. REAL-TIME ORDER TOAST BANNER (WHEN ORDER ARRIVES) */}
      {toastAlert && (
        <div className="fixed top-18 right-4 z-50 max-w-sm w-full animate-slideIn">
          <div className="p-3.5 rounded-2xl bg-stone-950 text-white shadow-2xl border border-amber-500/40 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 mt-0.5">
                <Bell size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-white">
                    New Order from Table {toastAlert.tableNumber}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    KES {toastAlert.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-stone-300 mt-0.5">
                  Order #{toastAlert.orderNumber} ({toastAlert.itemCount} items) sent to kitchen & POS.
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      dismissToast();
                      onTabChange('cashier');
                    }}
                    className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>View Bill</span>
                    <ArrowRight size={11} />
                  </button>
                  <button
                    onClick={() => {
                      dismissToast();
                      onTabChange('kds');
                    }}
                    className="text-xs font-bold text-stone-300 hover:text-white flex items-center gap-1"
                  >
                    <span>View KDS</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={dismissToast}
              className="text-stone-400 hover:text-white p-1"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
