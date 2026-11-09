import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { useSocket } from '../context/SocketContext.js';
import {
  Utensils,
  Tv,
  CreditCard,
  LayoutGrid,
  MenuSquare,
  Package,
  Building2,
  BarChart3,
  Users,
  Sun,
  Moon,
  LogOut,
  LogIn,
  QrCode,
  Bell,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { connected } = useSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'customer', label: 'Customer QR', icon: QrCode, badge: 'Live' },
    { id: 'kds', label: 'Kitchen KDS', icon: Tv, roles: ['super_admin', 'hotel_admin', 'restaurant_manager', 'kitchen_manager', 'kitchen_staff'] },
    { id: 'service', label: 'Service / Runner', icon: Bell, roles: ['super_admin', 'hotel_admin', 'restaurant_manager', 'service_staff'] },
    { id: 'cashier', label: 'Cashier POS', icon: CreditCard, roles: ['super_admin', 'hotel_admin', 'restaurant_manager', 'cashier', 'accountant'] },
    { id: 'tables', label: 'Floor & Tables', icon: LayoutGrid, roles: ['super_admin', 'hotel_admin', 'restaurant_manager'] },
    { id: 'menu', label: 'Menu & Schedules', icon: MenuSquare, roles: ['super_admin', 'hotel_admin', 'restaurant_manager', 'kitchen_manager'] },
    { id: 'inventory', label: 'Inventory & BOM', icon: Package, roles: ['super_admin', 'hotel_admin', 'restaurant_manager', 'kitchen_manager', 'inventory_manager'] },
    { id: 'hotel', label: 'Hotel Rooms', icon: Building2, roles: ['super_admin', 'hotel_admin', 'restaurant_manager', 'cashier'] },
    { id: 'reports', label: 'Reports & Audit', icon: BarChart3, roles: ['super_admin', 'hotel_admin', 'restaurant_manager', 'accountant', 'auditor'] },
    { id: 'users', label: 'Staff & Roles', icon: Users, roles: ['super_admin', 'hotel_admin'] },
  ];

  const visibleNav = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!user) return true; // Preview mode allows access
    return item.roles.includes(user.role) || user.role === 'super_admin';
  });

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20">
              <Utensils size={20} />
            </div>
            <div>
              <span className="font-extrabold text-stone-900 dark:text-stone-100 tracking-tight text-base sm:text-lg block leading-none">
                Grand Heritage
              </span>
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 tracking-wider uppercase block mt-1">
                Hotel & Dining POS
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Socket Status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                connected
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400'
              }`}
              title={connected ? 'Real-time WebSocket Live' : 'Reconnecting to real-time engine...'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="hidden sm:inline">{connected ? 'Live Sync' : 'Connecting'}</span>
            </div>

            {/* User Session Profile */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-stone-800">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {user.role.replace(/_/g, ' ')}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onTabChange('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
              >
                <LogIn size={14} />
                <span>Staff Login</span>
              </button>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-600 dark:text-stone-300 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 space-y-1 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-600 text-white'
                    : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

