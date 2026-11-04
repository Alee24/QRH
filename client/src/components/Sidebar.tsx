import React from 'react';
import { useAuth } from '../context/AuthContext.js';
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
  QrCode,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Palette,
  Globe,
  Upload,
  ChefHat
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  hint: string;
  badge?: string;
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
  const { connected } = useSocket();

  const role = user?.role || 'guest';

  // Role-Based Navigation Groups Definition
  const getRoleBasedGroups = (): NavGroup[] => {
    // 1. SaaS Platform Super / Support / Finance Admins
    if (role.startsWith('saas_') || role === 'super_admin') {
      return [
        {
          group: 'SAAS PLATFORM CORE',
          items: [
            { id: 'saas_dashboard', label: 'Platform Control Center', icon: ShieldCheck, badge: 'L1', hint: 'Tenants & MRR' },
            { id: 'saas_branding', label: 'Appearance & White-Label', icon: Palette, hint: 'Theming & Logos' },
          ],
        },
        {
          group: 'PUBLIC SHOWCASE',
          items: [
            { id: 'saas_showcase', label: 'PlateIQ Cloud Tour', icon: Globe, badge: 'SaaS', hint: 'Platform Directory' },
            { id: 'hotel_showcase', label: 'Subscriber Hotel Menu', icon: Utensils, badge: 'Subdomain', hint: "Today's Menu Showcase" },
          ],
        },
        {
          group: 'AUDIT & REPORTS',
          items: [
            { id: 'reports', label: 'Cross-Tenant Analytics', icon: BarChart3, hint: 'Platform Telemetry' },
            { id: 'users', label: 'System Permissions (RBAC)', icon: Users, hint: 'Role Access' },
          ],
        },
      ];
    }

    // 2. Hotel Owner, Hotel Admin, Restaurant Manager
    if (['hotel_owner', 'hotel_admin', 'restaurant_manager'].includes(role)) {
      return [
        {
          group: 'FRONT OF HOUSE & POS',
          items: [
            { id: 'cashier', label: 'Cashier POS & Billing', icon: CreditCard, hint: 'Bills & Settlement' },
            { id: 'tables', label: 'Floor Plan & Tables', icon: LayoutGrid, hint: 'Tables & QR Tokens' },
            { id: 'service', label: 'Delivery Queue', icon: Bell, hint: 'Food Runner Dispatch' },
          ],
        },
        {
          group: 'CULINARY OPERATIONS',
          items: [
            { id: 'kds', label: 'Kitchen Display (KDS)', icon: Tv, hint: 'Station Tickets' },
            { id: 'menu', label: 'Menu & CSV Import', icon: MenuSquare, badge: 'CSV', hint: 'Dishes & Bulk Upload' },
          ],
        },
        {
          group: 'GUEST EXPERIENCES',
          items: [
            { id: 'customer', label: 'Customer QR Menu', icon: QrCode, badge: 'Live', hint: 'Table Ordering' },
            { id: 'hotel_showcase', label: 'Hotel Public Showcase', icon: Globe, hint: "Today's Menu Page" },
          ],
        },
        {
          group: 'INVENTORY & PMS',
          items: [
            { id: 'inventory', label: 'Recipe BOM Inventory', icon: Package, hint: 'Stock & Deductions' },
            { id: 'hotel', label: 'Room Service & PMS', icon: Building2, hint: 'Room Folios' },
          ],
        },
        {
          group: 'MANAGEMENT & BRANDING',
          items: [
            { id: 'reports', label: 'Executive Reports', icon: BarChart3, hint: 'Sales & M-Pesa Audit' },
            { id: 'users', label: 'Staff Roles (RBAC)', icon: Users, hint: 'Permissions' },
            { id: 'saas_branding', label: 'Hotel Logo & Branding', icon: Palette, hint: 'Upload Logo & Style' },
          ],
        },
      ];
    }

    // 3. Kitchen Operations (Chefs & Kitchen Manager)
    if (role === 'kitchen_manager' || role.startsWith('station_chef_')) {
      return [
        {
          group: 'KITCHEN DISPATCH',
          items: [
            { id: 'kds', label: 'Touchscreen KDS', icon: Tv, badge: 'Live', hint: 'Station Tickets' },
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

    // 4. Cashier
    if (role === 'cashier') {
      return [
        {
          group: 'POINT OF SALE',
          items: [
            { id: 'cashier', label: 'Cashier POS Terminal', icon: CreditCard, badge: 'POS', hint: 'Consolidated Billing' },
            { id: 'tables', label: 'Floor Plan & Cleaning', icon: LayoutGrid, hint: 'Table Status' },
          ],
        },
        {
          group: 'SIMULATOR',
          items: [
            { id: 'customer', label: 'Customer QR Order View', icon: QrCode, hint: 'Table Ordering Simulator' },
          ],
        },
      ];
    }

    // 5. Food Runner & Waiters
    if (['food_runner', 'waiter'].includes(role)) {
      return [
        {
          group: 'SERVICE RUNNER',
          items: [
            { id: 'service', label: 'Service Delivery Queue', icon: Bell, badge: 'Queue', hint: 'Delivering Ready Food' },
            { id: 'tables', label: 'Floor Plan & Occupancy', icon: LayoutGrid, hint: 'Table Locations' },
          ],
        },
      ];
    }

    // 6. Inventory Manager & Procurement
    if (['inventory_manager', 'procurement_officer'].includes(role)) {
      return [
        {
          group: 'SUPPLY CHAIN & BOM',
          items: [
            { id: 'inventory', label: 'Inventory & Recipe BOM', icon: Package, badge: 'Stock', hint: 'Ingredients & Reorders' },
            { id: 'menu', label: 'Menu Items & Recipes', icon: MenuSquare, hint: 'BOM Item Formulas' },
          ],
        },
      ];
    }

    // 7. Accounting Manager & Auditor
    if (['accounting_manager', 'auditor'].includes(role)) {
      return [
        {
          group: 'FINANCE & AUDIT',
          items: [
            { id: 'reports', label: 'Financial Audit & Reports', icon: BarChart3, badge: 'Audit', hint: 'VAT & M-Pesa Logs' },
            { id: 'cashier', label: 'Cashier Shift Settlement', icon: CreditCard, hint: 'Consolidated Ledgers' },
          ],
        },
      ];
    }

    // 8. Receptionist (PMS Room Billing)
    if (role === 'receptionist') {
      return [
        {
          group: 'HOTEL FRONT DESK',
          items: [
            { id: 'hotel', label: 'Guest Rooms & PMS Folios', icon: Building2, badge: 'PMS', hint: 'Room Charges' },
            { id: 'tables', label: 'Dining Table Reservations', icon: LayoutGrid, hint: 'Seating Overview' },
          ],
        },
      ];
    }

    // 9. Default / Guest / Fallback
    return [
      {
        group: 'GUEST EXPERIENCE',
        items: [
          { id: 'customer', label: 'Customer QR Menu', icon: QrCode, badge: 'Live', hint: 'Self-Service Ordering' },
          { id: 'hotel_showcase', label: "Today's Scheduled Menu", icon: Utensils, hint: 'Hotel Showcase' },
          { id: 'saas_showcase', label: 'PlateIQ Cloud SaaS', icon: Globe, hint: 'Platform Overview' },
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

  const navigationGroups = getRoleBasedGroups();

  const handleSelect = (id: string) => {
    onTabChange(id);
    onMobileClose();
  };

  const roleRoster = [
    { email: 'superadmin@plateiq.cloud', name: 'Dr. Harrison Ochieng', role: 'SaaS Super Admin' },
    { email: 'admin@hotel.com', name: 'Chef Marcus Kamau', role: 'Grand Heritage Owner' },
    { email: 'gm@serenasafari.com', name: 'Beatrice Kiprono', role: 'Serena Safari GM' },
    { email: 'kitchen@hotel.com', name: 'Chef James Mwangi', role: 'Kitchen Head' },
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
      <div className="p-3.5 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between min-h-[60px]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/25 shrink-0">
            <Utensils size={18} className="stroke-[2.5]" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-extrabold text-xs tracking-tight text-stone-900 dark:text-stone-100 block leading-tight truncate">
                {user?.tenant_id === 'tenant-serena-safari' ? 'Serena Safari Lodge' : 'Grand Heritage Hotel'}
              </span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase block mt-0.5">
                {role.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* 2. ROLE-BASED NAVIGATION LINKS */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {navigationGroups.map((grp) => (
          <div key={grp.group} className="space-y-0.5">
            {!collapsed ? (
              <div className="px-2.5 py-1 text-[10px] font-extrabold text-stone-400 dark:text-stone-500 tracking-wider uppercase">
                {grp.group}
              </div>
            ) : (
              <div className="w-3 h-0.5 mx-auto bg-stone-200 dark:bg-stone-800 rounded-full my-1.5" />
            )}

            <div className="space-y-0.5">
              {grp.items.map((item: NavItem) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full group relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium text-xs transition-all ${
                      isActive
                        ? 'bg-amber-600 text-white font-bold shadow-sm shadow-amber-600/30'
                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                    title={collapsed ? `${item.label} (${item.hint})` : undefined}
                  >
                    <Icon
                      size={16}
                      className={`shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-white' : 'text-stone-500 dark:text-stone-400'
                      }`}
                    />

                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between overflow-hidden">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. COMPACT ROLE SWITCHER & USER FOOTER */}
      <div className="p-2.5 border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-50/60 dark:bg-stone-900/60">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-stone-500">Active Terminal Role:</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>

            {/* Quick Role Switcher Dropdown */}
            <select
              value={user?.email || ''}
              onChange={(e) => {
                const target = roleRoster.find((r) => r.email === e.target.value);
                if (target && switchUserByEmail) {
                  switchUserByEmail(target.email);
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
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 bottom-0 z-40 bg-white dark:bg-stone-900 border-r border-stone-200/80 dark:border-stone-800/80 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
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
