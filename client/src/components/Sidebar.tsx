import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { useSocket } from '../context/SocketContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { getDefaultTabForRole } from '../utils/roleRoutes.js';
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
  QrCode,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
  Sparkles,
  ShieldCheck,
  Palette,
  Globe,
  Truck,
  ShoppingBag,
  Calendar,
  Search,
  Bike,
  FileText,
  Boxes,
  Compass,
  CheckCircle2,
  Settings,
  X
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  hint: string;
  badge?: string;
  badgeCount?: number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}) => {
  const { user, switchUserByEmail, logout } = useAuth();
  const { branding } = useTheme();
  const { connected } = useSocket();
  const { unreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');

  const role = user?.role || 'guest';

  // Role-Based Navigation Groups Definition conforming to Module 1 Specifications
  const getRoleBasedGroups = (): NavGroup[] => {
    // 1. SaaS Platform Super / Support / Finance / Technical Admins & Hotel Super Admin
    if (role.startsWith('saas_') || role === 'super_admin') {
      return [
        {
          group: 'WORKSPACE',
          items: [
            { id: 'orders', label: 'Central Orders Hub', icon: ShoppingBag, badge: 'Live', hint: 'All Channels & Status' },
            { id: 'cashier', label: 'Cashier POS & Billing', icon: CreditCard, hint: 'Settlements & M-Pesa' },
            { id: 'tables', label: 'Floor Plan & QR Tables', icon: LayoutGrid, hint: 'Seating & Table Tokens' },
          ],
        },
        {
          group: 'KITCHEN & MENU',
          items: [
            { id: 'kds', label: 'Kitchen Display (KDS)', icon: Tv, hint: 'Multi-Station Cook Tickets' },
            { id: 'menu', label: 'Menu & CSV Bulk Import', icon: MenuSquare, badge: 'CSV', hint: 'Dishes, Prices, Spices & Photos' },
            { id: 'service', label: 'Food Runner Dispatch', icon: Bell, hint: 'Ready Table Trays' },
            { id: 'inventory', label: 'Recipe BOM & Stock', icon: Package, hint: 'Ingredients & Deductions' },
          ],
        },
        {
          group: 'FULFILLMENT & DELIVERIES',
          items: [
            { id: 'delivery', label: 'Delivery Dispatch & Fleet', icon: Truck, badge: 'Fleet', hint: 'Zones, Couriers & Tracking' },
            { id: 'driver_portal', label: 'Driver Mobile Portal', icon: Bike, hint: 'Courier POD Interface' },
            { id: 'hotel', label: 'Guest Rooms PMS', icon: Building2, hint: 'Room Folios & Orders' },
            { id: 'catering', label: 'Catering & Event Services', icon: Calendar, badge: 'BEO', hint: 'Quotations & Equipment' },
          ],
        },
        {
          group: 'INTELLIGENCE & AUDIT',
          items: [
            { id: 'reports', label: 'Executive Analytics', icon: BarChart3, hint: 'Sales, VAT, KRA & Telemetry' },
            { id: 'users', label: 'Staff Roles & RBAC', icon: Users, hint: 'Team Permissions & Access' },
          ],
        },
        {
          group: 'HOTEL ADMINISTRATION',
          items: [
            { id: 'hotel_settings', label: 'Hotel Details & Credentials', icon: Settings, badge: 'Core', hint: 'Hotel Name, M-Pesa, Email & Mode' },
            { id: 'saas_branding', label: 'Hotel Logo & Theming', icon: Palette, hint: 'Brand Colors, Logo & Styles' },
          ],
        },
        {
          group: 'GUEST EXPERIENCES',
          items: [
            { id: 'customer', label: 'Customer QR Ordering', icon: QrCode, badge: 'Mobile', hint: 'Table Self-Service' },
            { id: 'hotel_showcase', label: 'Subscriber Hotel Menu', icon: Utensils, badge: 'Subdomain', hint: "Today's Live Menu" },
          ],
        },
        {
          group: 'ENTERPRISE SYSTEM',
          items: [
            { id: 'saas_dashboard', label: 'Platform Control Center', icon: ShieldCheck, badge: 'L1', hint: 'Tenants & Operations' },
            { id: 'saas_showcase', label: 'Sironi Guest Website', icon: Globe, badge: 'Live', hint: 'Dining & Ordering Portal' },
          ],
        },
      ];
    }

    // 2. Dedicated Order Manager
    if (role === 'order_manager') {
      return [
        {
          group: 'ORDER MANAGEMENT',
          items: [
            { id: 'orders', label: 'Central Orders Hub', icon: ShoppingBag, badge: 'Live', hint: 'Kanban & Omnichannel Matrix' },
            { id: 'cashier', label: 'POS Terminal', icon: CreditCard, hint: 'Walk-in & Phone Settlement' },
          ],
        },
        {
          group: 'FULFILLMENT PIPELINE',
          items: [
            { id: 'delivery', label: 'Delivery Dispatch', icon: Truck, hint: 'Courier Allocation' },
            { id: 'kds', label: 'Kitchen Tickets (KDS)', icon: Tv, hint: 'Cook Station Progress' },
            { id: 'service', label: 'Food Runner Dispatch', icon: Bell, hint: 'Floor Ready Orders' },
          ],
        },
        {
          group: 'REPORTS & TABLES',
          items: [
            { id: 'tables', label: 'Table Plan & QR', icon: LayoutGrid, hint: 'Dine-in Floor Grid' },
            { id: 'reports', label: 'Order Analytics', icon: BarChart3, hint: 'Daily Turnaround & Revenue' },
          ],
        },
      ];
    }

    // 3. Dedicated Delivery Dispatch Manager
    if (role === 'dispatch_manager') {
      return [
        {
          group: 'DELIVERY LOGISTICS',
          items: [
            { id: 'delivery', label: 'Dispatch Control Board', icon: Truck, badge: 'Dispatch', hint: 'Drivers, Zones & Distance Pricing' },
            { id: 'driver_portal', label: 'Driver Mobile Simulator', icon: Bike, hint: 'Field Courier Interface' },
          ],
        },
        {
          group: 'ORDERS & DISPATCH',
          items: [
            { id: 'orders', label: 'Central Delivery Orders', icon: ShoppingBag, hint: 'Active Delivery Pipeline' },
            { id: 'reports', label: 'Fleet Delivery Reports', icon: BarChart3, hint: 'On-Time Rates & Tips' },
          ],
        },
      ];
    }

    // 4. Delivery Driver
    if (role === 'delivery_driver') {
      return [
        {
          group: 'DRIVER PORTAL',
          items: [
            { id: 'driver_portal', label: 'My Deliveries & POD', icon: Bike, badge: 'Active', hint: 'Pickup, Navigation & Signature' },
            { id: 'delivery', label: 'Zone & Fleet Overview', icon: Truck, hint: 'Assigned Territories' },
          ],
        },
      ];
    }

    // 5. Catering Manager, Catering Sales Officer, Event Coordinator, Logistics Officer, Catering Accountant
    if (
      [
        'catering_manager',
        'catering_sales_officer',
        'event_coordinator',
        'logistics_officer',
        'catering_accountant',
        'catering_supervisor',
      ].includes(role)
    ) {
      return [
        {
          group: 'CATERING & BANQUETS',
          items: [
            { id: 'catering', label: 'Catering Operations Hub', icon: Calendar, badge: 'Pipeline', hint: 'Enquiries, Quotes & Events' },
            { id: 'orders', label: 'Event Orders & BEO', icon: ShoppingBag, hint: 'Banquet Order Sheets' },
          ],
        },
        {
          group: 'PRODUCTION & LOGISTICS',
          items: [
            { id: 'kds', label: 'Banquet Kitchen KDS', icon: Tv, hint: 'Production Prep Sheets' },
            { id: 'inventory', label: 'Equipment & Cutlery BOM', icon: Boxes, hint: 'Chafers, Warmers & Tents' },
          ],
        },
        {
          group: 'CLIENT & FINANCE',
          items: [
            { id: 'cashier', label: 'Catering Deposit & POS', icon: CreditCard, hint: '50% Invoicing & M-Pesa' },
            { id: 'reports', label: 'Catering Sales & Ledger', icon: BarChart3, hint: 'Food, Labor & Transport P&L' },
          ],
        },
      ];
    }

    // 6. Catering Chef
    if (role === 'catering_chef') {
      return [
        {
          group: 'BANQUET PRODUCTION',
          items: [
            { id: 'kds', label: 'Production Station KDS', icon: Tv, badge: 'Live', hint: 'Bulk Batching & Timing' },
            { id: 'catering', label: 'Event Menu Schedules', icon: Calendar, hint: 'BEO Menus & Quantities' },
          ],
        },
        {
          group: 'SUPPLIES & RECIPES',
          items: [
            { id: 'inventory', label: 'Ingredients & BOM', icon: Package, hint: 'Bulk Raw Materials' },
            { id: 'menu', label: 'Master Recipe Cards', icon: MenuSquare, hint: 'Portion Formulas' },
          ],
        },
      ];
    }

    // 7. Hotel Owner, Hotel Admin, Restaurant Manager (Comprehensive Enterprise View)
    if (['hotel_owner', 'hotel_admin', 'restaurant_manager'].includes(role)) {
      return [
        {
          group: 'WORKSPACE',
          items: [
            { id: 'orders', label: 'Central Orders Hub', icon: ShoppingBag, badge: 'Hub', hint: 'Omnichannel Pipeline' },
            { id: 'cashier', label: 'Cashier POS & Billing', icon: CreditCard, hint: 'Settlements & M-Pesa' },
          ],
        },
        {
          group: 'RESTAURANT & SERVICE',
          items: [
            { id: 'tables', label: 'Floor Plan & QR Tables', icon: LayoutGrid, hint: 'Seating & Table Tokens' },
            { id: 'kds', label: 'Kitchen Display (KDS)', icon: Tv, hint: 'Live Station Tickets' },
            { id: 'service', label: 'Food Runner Dispatch', icon: Bell, hint: 'Ready-to-Serve Trays' },
            { id: 'menu', label: 'Menu & CSV Bulk Import', icon: MenuSquare, badge: 'CSV', hint: 'Dishes & Recipes' },
          ],
        },
        {
          group: 'FULFILLMENT SERVICES',
          items: [
            { id: 'delivery', label: 'Delivery & Fleet Dispatch', icon: Truck, badge: 'Fleet', hint: 'Zones, Couriers & Tracking' },
            { id: 'driver_portal', label: 'Driver Mobile Portal', icon: Bike, hint: 'Courier POD Interface' },
            { id: 'catering', label: 'Catering & Event Services', icon: Calendar, badge: 'BEO', hint: 'Quotations & Equipment' },
          ],
        },
        {
          group: 'PROPERTY & OPERATIONS',
          items: [
            { id: 'inventory', label: 'Recipe BOM & Stock', icon: Package, hint: 'Ingredients & Deductions' },
            { id: 'hotel', label: 'Guest Rooms PMS', icon: Building2, hint: 'Room Folios & Orders' },
          ],
        },
        {
          group: 'REPORTS & ADMINISTRATION',
          items: [
            { id: 'reports', label: 'Executive Analytics', icon: BarChart3, hint: 'Sales, VAT & Audit Trail' },
            { id: 'users', label: 'Staff Roles & RBAC', icon: Users, hint: 'Team Permissions' },
            { id: 'hotel_settings', label: 'Hotel Details & Credentials', icon: Settings, badge: 'Core', hint: 'Hotel Name, M-Pesa & Mode' },
            { id: 'saas_branding', label: 'Hotel Logo & Branding', icon: Palette, hint: 'Logo, Colors & Theme' },
          ],
        },
        {
          group: 'GUEST EXPERIENCES',
          items: [
            { id: 'customer', label: 'Customer QR Ordering', icon: QrCode, badge: 'Mobile', hint: 'Table Self-Service' },
            { id: 'hotel_showcase', label: 'Public Hotel Menu Page', icon: Utensils, hint: "Today's Live Menu" },
            { id: 'saas_showcase', label: 'Sironi Guest Website', icon: Globe, hint: 'Public Dining & Ordering' },
          ],
        },
      ];
    }

    // 8. Kitchen Operations (Chefs & Kitchen Manager)
    if (
      role === 'kitchen_manager' ||
      role === 'kitchen_staff' ||
      role.startsWith('station_chef_') ||
      role === 'catering_chef' ||
      role === 'chef'
    ) {
      return [
        {
          group: 'KITCHEN DISPATCH',
          items: [
            { id: 'kds', label: 'Touchscreen KDS', icon: Tv, badge: 'Live', hint: 'Station Tickets' },
            { id: 'orders', label: 'Kitchen Prep Tickets', icon: ShoppingBag, hint: 'Cook Queue' },
            { id: 'menu', label: 'Menu & 86ed Availability', icon: MenuSquare, hint: 'Sold Out Toggles' },
          ],
        },
        {
          group: 'RECIPES & INVENTORY',
          items: [
            { id: 'inventory', label: 'Recipe BOM Ingredients', icon: Package, hint: 'Stock Quantities' },
          ],
        },
      ];
    }

    // 9. Cashier
    if (role === 'cashier') {
      return [
        {
          group: 'POINT OF SALE',
          items: [
            { id: 'cashier', label: 'Cashier POS Terminal', icon: CreditCard, badge: 'POS', hint: 'Consolidated Billing' },
            { id: 'orders', label: 'Unpaid Bills & Settlements', icon: ShoppingBag, hint: 'Bill Settlements' },
            { id: 'tables', label: 'Floor Plan & Status', icon: LayoutGrid, hint: 'Table Occupancy' },
          ],
        },
        {
          group: 'FULFILLMENT & GUEST',
          items: [
            { id: 'delivery', label: 'Delivery Payments', icon: Truck, hint: 'Cash & M-Pesa on Delivery' },
            { id: 'customer', label: 'Customer QR View', icon: QrCode, hint: 'Guest Ordering Simulator' },
          ],
        },
      ];
    }

    // 10. Food Runner & Waiters
    if (['service_staff', 'food_runner', 'runner', 'waiter'].includes(role)) {
      return [
        {
          group: 'SERVICE RUNNER',
          items: [
            { id: 'service', label: 'Service Delivery Queue', icon: Bell, badge: 'Queue', hint: 'Delivering Ready Food' },
            { id: 'orders', label: 'Ready-to-Serve Tickets', icon: ShoppingBag, hint: 'Plated Dishes' },
            { id: 'tables', label: 'Floor Plan & Occupancy', icon: LayoutGrid, hint: 'Table Locations' },
          ],
        },
      ];
    }

    // 11. Inventory Manager & Procurement
    if (['inventory_manager', 'procurement_officer'].includes(role)) {
      return [
        {
          group: 'SUPPLY CHAIN & BOM',
          items: [
            { id: 'inventory', label: 'Inventory & Recipe BOM', icon: Package, badge: 'Stock', hint: 'Ingredients & Reorders' },
            { id: 'catering', label: 'Catering Equipment Stock', icon: Boxes, hint: 'Rental Inventory' },
            { id: 'menu', label: 'Menu Items & Recipes', icon: MenuSquare, hint: 'BOM Item Formulas' },
          ],
        },
      ];
    }

    // 12. Accounting Manager & Auditor
    if (['accountant', 'accounting_manager', 'auditor'].includes(role)) {
      return [
        {
          group: 'FINANCE & AUDIT',
          items: [
            { id: 'reports', label: 'Financial Audit & Reports', icon: BarChart3, badge: 'Audit', hint: 'VAT & M-Pesa Logs' },
            { id: 'cashier', label: 'Cashier Shift Settlement', icon: CreditCard, hint: 'Consolidated Ledgers' },
            { id: 'orders', label: 'All Orders Ledger', icon: ShoppingBag, hint: 'Historical Invoices' },
            { id: 'catering', label: 'Catering Financials', icon: Calendar, hint: 'Deposits & Balances' },
          ],
        },
      ];
    }

    // 13. Receptionist (PMS Room Billing)
    if (role === 'receptionist') {
      return [
        {
          group: 'HOTEL FRONT DESK',
          items: [
            { id: 'hotel', label: 'Guest Rooms & PMS Folios', icon: Building2, badge: 'PMS', hint: 'Room Charges' },
            { id: 'orders', label: 'Room Service Orders', icon: ShoppingBag, hint: 'In-Room Dining Orders' },
            { id: 'tables', label: 'Dining Table Reservations', icon: LayoutGrid, hint: 'Seating Overview' },
          ],
        },
      ];
    }

    // 14. Default / Guest / Fallback
    return [
      {
        group: 'GUEST EXPERIENCE',
        items: [
          { id: 'customer', label: 'Customer QR Menu', icon: QrCode, badge: 'Live', hint: 'Self-Service Ordering' },
          { id: 'hotel_showcase', label: "Today's Scheduled Menu", icon: Utensils, hint: 'Hotel Showcase' },
          { id: 'saas_showcase', label: 'Sironi Guest Website', icon: Globe, hint: 'Public Dining & Ordering' },
        ],
      },
      {
        group: 'STAFF ACCESS',
        items: [
          { id: 'login', label: 'Staff Terminal Sign In', icon: LogIn, hint: 'Role Authentication' },
        ],
      },
    ];
  };

  const allGroups = getRoleBasedGroups();

  // Search filter across groups and items
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return allGroups;
    const query = searchQuery.toLowerCase();

    return allGroups
      .map((grp) => ({
        ...grp,
        items: grp.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.hint.toLowerCase().includes(query) ||
            (item.badge && item.badge.toLowerCase().includes(query))
        ),
      }))
      .filter((grp) => grp.items.length > 0);
  }, [allGroups, searchQuery]);

  const handleSelect = (id: string) => {
    onTabChange(id);
    onMobileClose();
  };

  // Comprehensive Role Roster with the 10 New Specialized Roles
  const roleRoster = [
    { email: 'superadmin@sironi.kkdes.co.ke', name: 'Dr. Harrison Ochieng', role: 'Group Operations Director' },
    { email: 'admin@hotel.com', name: 'Chef Marcus Kamau', role: 'Sironi Restaurant Owner' },
    { email: 'ordermanager@hotel.com', name: 'Sarah Cherono', role: 'Central Order Manager' },
    { email: 'dispatch@hotel.com', name: 'Daniel Kiprotich', role: 'Delivery Dispatcher' },
    { email: 'driver@hotel.com', name: 'Hassan Ali', role: 'Delivery Fleet Driver' },
    { email: 'catering@hotel.com', name: 'Esther Muthoni', role: 'Catering Director' },
    { email: 'coordinator@hotel.com', name: 'Brian Otieno', role: 'Event Coordinator' },
    { email: 'gm@serenasafari.com', name: 'Beatrice Kiprono', role: 'Serena Safari GM' },
    { email: 'kitchen@hotel.com', name: 'Chef James Mwangi', role: 'Executive Head Chef' },
    { email: 'grill@hotel.com', name: 'Chef David Omondi', role: 'Charcoal Grill Chef' },
    { email: 'cashier@hotel.com', name: 'Grace Wambui', role: 'Cashier POS' },
    { email: 'runner@hotel.com', name: 'Kevin Kiprop', role: 'Food Runner' },
    { email: 'inventory@hotel.com', name: 'Peter Ndungu', role: 'Inventory Officer' },
    { email: 'accounts@hotel.com', name: 'Esther Njeri', role: 'Finance / Auditor' },
    { email: 'reception@hotel.com', name: 'Mary Achieng', role: 'Front Desk PMS' },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between select-none">
      {/* 1. BRAND HEADER */}
      <div className="p-3.5 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between min-h-[64px]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {branding?.logo_url ? (
            <img
              src={branding.logo_url}
              alt="Logo"
              className="w-9 h-9 rounded-xl object-contain bg-white border border-stone-200/80 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/25 shrink-0">
              <Utensils size={18} className="stroke-[2.5]" />
            </div>
          )}
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-black text-xs tracking-tight text-stone-900 dark:text-stone-100 block leading-tight truncate">
                {branding?.platform_name || (user?.tenant_id === 'tenant-serena-safari' ? 'Serena Safari Lodge' : 'Sironi Restaurants')}
              </span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase block mt-0.5 truncate">
                {role.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors"
          title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* 2. SEARCHABLE NAVIGATION BAR (When expanded) */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search navigation..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800/80 text-xs text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 border border-transparent dark:border-stone-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. ROLE-BASED NAVIGATION GROUPS */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-4 scrollbar-thin">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-6 text-xs text-stone-400">
            No navigation items match "{searchQuery}"
          </div>
        ) : (
          filteredGroups.map((grp) => (
            <div key={grp.group} className="space-y-0.5">
              {!collapsed ? (
                <div className="px-2.5 py-1 text-[10px] font-extrabold text-stone-400 dark:text-stone-500 tracking-wider uppercase">
                  {grp.group}
                </div>
              ) : (
                <div className="w-3 h-0.5 mx-auto bg-stone-200 dark:bg-stone-800 rounded-full my-2" />
              )}

              <div className="space-y-0.5">
                {grp.items.map((item: NavItem) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => handleSelect(item.id)}
                        className={`w-full relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium text-xs transition-all ${
                          isActive
                            ? 'bg-amber-600 text-white font-bold shadow-sm shadow-amber-600/30'
                            : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                        } ${collapsed ? 'justify-center px-0' : ''}`}
                      >
                        <Icon
                          size={17}
                          className={`shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-white' : 'text-stone-500 dark:text-stone-400'
                          }`}
                        />

                        {!collapsed && (
                          <div className="flex-1 flex items-center justify-between overflow-hidden">
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </button>

                      {/* Floating Tooltip in Collapsed View */}
                      {collapsed && (
                        <div className="absolute left-[72px] top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-lg bg-stone-900 text-white shadow-xl text-xs z-50 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 border border-stone-800">
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className="text-[9px] bg-amber-600 text-white px-1 py-0.2 rounded font-extrabold">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-400">{item.hint}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. COMPACT ROLE SWITCHER & USER FOOTER */}
      <div className="p-2.5 border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-900/70">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-stone-500">Terminal Role:</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>

            {/* Quick Role Switcher Dropdown */}
            <select
              value={user?.email || ''}
              onChange={async (e) => {
                const target = roleRoster.find((r) => r.email === e.target.value);
                if (target && switchUserByEmail) {
                  await switchUserByEmail(target.email);
                  const destTab = getDefaultTabForRole(target.role);
                  onTabChange(destTab);
                }
              }}
              className="w-full text-xs font-semibold py-1.5 px-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {roleRoster.map((r) => (
                <option key={r.email} value={r.email}>
                  {r.role} ({r.name.split(' ')[0]})
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="w-6 h-6 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 truncate">
                  {user?.name || 'Staff Member'}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs font-bold"
              title={`${user?.name} (${role})`}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <button
              onClick={() => logout()}
              className="p-1 text-stone-400 hover:text-red-500"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (w-64 = 256px, w-[72px] = 72px) */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 bottom-0 z-40 bg-white dark:bg-stone-900 border-r border-stone-200/80 dark:border-stone-800/80 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-stone-900 h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
