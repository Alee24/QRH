import React from 'react';
import { useTheme } from '../context/ThemeContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Menu,
  Sun,
  Moon,
  QrCode,
  Building2,
  ChevronRight,
  Sparkles,
  Wifi
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
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const titleMap: Record<string, { category: string; title: string }> = {
    saas_dashboard: { category: 'SaaS Platform Core', title: 'Platform Control Center & Hotel Tenants' },
    saas_branding: { category: 'White-Label Branding', title: 'Appearance Studio & Runtime Theming' },
    customer: { category: 'Guest Portal', title: 'Customer QR Self-Ordering' },
    cashier: { category: 'Point of Sale', title: 'Cashier POS & Consolidated Billing' },
    tables: { category: 'Front of House', title: 'Floor Plan & QR Code Management' },
    service: { category: 'Operations', title: 'Service & Table Delivery Queue' },
    kds: { category: 'Kitchen Station', title: 'Touchscreen Kitchen Display (KDS)' },
    menu: { category: 'Culinary Administration', title: 'Menu Items, Modifiers & Schedules' },
    inventory: { category: 'Supply Chain', title: 'Inventory & Recipe BOM Management' },
    hotel: { category: 'Property Management', title: 'Hotel Guest Rooms & PMS Folios' },
    reports: { category: 'Management Intelligence', title: 'Executive Analytics & M-Pesa Audit' },
    users: { category: 'Security & Access', title: 'Staff Role-Based Permissions' },
    login: { category: 'Authentication', title: 'Staff Terminal Sign In' },
  };

  const current = titleMap[currentTab] || { category: 'POS Management', title: 'Dashboard' };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur border-b border-stone-200/80 dark:border-stone-800/80 px-4 sm:px-6 h-16 flex items-center justify-between transition-colors">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Open Navigation"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-400 font-medium hidden sm:inline">
            {current.category}
          </span>
          <ChevronRight size={13} className="text-stone-400 hidden sm:inline" />
          <h2 className="font-bold text-stone-900 dark:text-stone-100 text-sm tracking-tight truncate max-w-[200px] sm:max-w-none">
            {current.title}
          </h2>
        </div>
      </div>

      {/* Right: Outlet badge, Customer QR shortcut, Theme toggle */}
      <div className="flex items-center gap-2.5">
        {/* Outlet badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px] font-semibold">
          <Building2 size={13} className="text-amber-600" />
          <span>The Royal Orchid Dining</span>
        </div>

        {/* Quick QR toggle if not on customer page */}
        {currentTab !== 'customer' && (
          <button
            onClick={() => onTabChange('customer')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 text-xs font-bold border border-amber-500/20 transition-all"
            title="Preview Customer QR Self-Order Experience"
          >
            <QrCode size={14} />
            <span className="hidden sm:inline">Customer QR View</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};

