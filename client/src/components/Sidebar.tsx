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
  Globe
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

  const isSaas = user?.role?.startsWith('saas_') || user?.role === 'super_admin';

  const navigationGroups: NavGroup[] = [
    ...(isSaas ? [{
      group: 'SAAS PLATFORM CORE',
      items: [
        { id: 'saas_dashboard', label: 'Platform Control Center', icon: ShieldCheck, badge: 'L1', hint: 'Tenants & MRR' },
        { id: 'saas_branding', label: 'Branding & Appearance', icon: Palette, hint: 'White-Label Theming' },
      ],
    }] : []),
    {
      group: 'PUBLIC SHOWCASE & MENUS',
      items: [
        { id: 'saas_showcase', label: 'PlateIQ Cloud Platform', icon: Globe, badge: 'SaaS', hint: 'Platform Tour & Plans' },
        { id: 'hotel_showcase', label: "Hotel Ambiance & Menu", icon: Utensils, badge: 'Subdomain', hint: "Today's Scheduled Menu" },
      ],
    },
    {
      group: 'GUEST EXPERIENCE',
      items: [
        { id: 'customer', label: 'Customer QR Menu', icon: QrCode, badge: 'Live', hint: 'Guest Ordering' },
      ],
    },
    {
      group: 'FRONT OF HOUSE & POS',
      items: [
        { id: 'cashier', label: 'Cashier POS & Billing', icon: CreditCard, hint: 'Bills & Settlement' },
        { id: 'tables', label: 'Floor Plan & Tables', icon: LayoutGrid, hint: 'Tables & QR Tokens' },
        { id: 'service', label: 'Delivery Queue', icon: Bell, hint: 'Food Runner Dispatch' },
      ],
    },
    {
      group: 'KITCHEN OPERATIONS',
      items: [
        { id: 'kds', label: 'Kitchen Display (KDS)', icon: Tv, hint: 'Station Tickets' },
        { id: 'menu', label: 'Menu & Schedules', icon: MenuSquare, hint: 'Dishes & Timing' },
      ],
    },
    {
      group: 'INVENTORY & PMS',
      items: [
        { id: 'inventory', label: 'Inventory & Recipe BOM', icon: Package, hint: 'Stock & Deductions' },
        { id: 'hotel', label: 'Hotel Room Folios', icon: Building2, hint: 'PMS Room Charge' },
      ],
    },
    {
      group: 'ADMINISTRATION',
      items: [
        { id: 'reports', label: 'Executive Reports & Audit', icon: BarChart3, hint: 'Sales & M-Pesa' },
        { id: 'users', label: 'Staff & Roles (RBAC)', icon: Users, hint: 'Permissions' },
      ],
    },
  ];

  const handleSelect = (id: string) => {
    onTabChange(id);
    onMobileClose();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between select-none">
      {/* 1. BRAND HEADER */}
      <div className="p-4 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between min-h-[64px]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-600/25 shrink-0 ring-2 ring-amber-500/20">
            <Utensils size={20} className="stroke-[2.5]" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden animate-fadeIn">
              <span className="font-extrabold text-sm tracking-tight text-stone-900 dark:text-stone-100 block leading-tight truncate">
                Grand Heritage
              </span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase block mt-0.5">
                Hotel & Dining POS
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-7 h-7 rounded-xl items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* 2. NAVIGATION LINKS */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationGroups.map((grp) => (
          <div key={grp.group} className="space-y-1">
            {!collapsed ? (
              <div className="px-3 text-[10px] font-extrabold text-stone-400 dark:text-stone-500 tracking-wider uppercase">
                {grp.group}
              </div>
            ) : (
              <div className="w-4 h-0.5 mx-auto bg-stone-200 dark:bg-stone-800 rounded-full my-2" />
            )}

            <div className="space-y-0.5">
              {grp.items.map((item: NavItem) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                      isActive
                        ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-600/30'
                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                    title={collapsed ? `${item.label} (${item.hint})` : undefined}
                  >
                    <Icon
                      size={18}
                      className={`shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-stone-500 dark:text-stone-400'
                      }`}
                    />

                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between overflow-hidden">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Active highlight bar on left */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. USER FOOTER & CONNECTION STATUS */}
      <div className="p-3 border-t border-stone-200/80 dark:border-stone-800/80 space-y-3 bg-stone-50/50 dark:bg-stone-900/50">
        {/* Real-time status */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-medium border ${
            connected
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400'
              : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-400'
          } ${collapsed ? 'justify-center p-1.5' : ''}`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          {!collapsed && (
            <span className="truncate">{connected ? 'WebSocket Engine Online' : 'Reconnecting...'}</span>
          )}
        </div>

        {/* User profile */}
        {user ? (
          <div className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-amber-600/10 text-amber-700 dark:text-amber-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-amber-500/20">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider truncate">
                      {user.role.replace(/_/g, ' ')}
                    </div>
                  </div>
                )}
              </div>

              {!collapsed && (
                <button
                  onClick={logout}
                  className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>

            {!collapsed && (
              <div className="pt-2 border-t border-stone-200/50 dark:border-stone-800/50">
                <select
                  aria-label="Switch Role or Tenant"
                  value={user?.email || ''}
                  onChange={async (e) => {
                    const email = e.target.value;
                    if (email) {
                      await switchUserByEmail(email);
                    }
                  }}
                  className="w-full text-[10px] px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium focus:outline-none"
                >
                  <option value="" disabled>Switch Role / Tenant...</option>
                  <optgroup label="Level 1: SaaS Platform">
                    <option value="superadmin@plateiq.cloud">⭐ Alex Vance (SaaS Super Admin)</option>
                    <option value="support@plateiq.cloud">🛠️ Sonia Patel (SaaS Support Admin)</option>
                    <option value="finance@plateiq.cloud">📊 Daniel Muthama (SaaS Finance Admin)</option>
                    <option value="tech@plateiq.cloud">💻 Kevin Mworia (SaaS Tech Admin)</option>
                  </optgroup>
                  <optgroup label="Level 2: Hotel Leadership">
                    <option value="admin@hotel.com">🏨 Arthur Pendelton (Grand Heritage Owner)</option>
                    <option value="gm@serenasafari.com">🦁 Capt. Robertson (Serena Safari Owner)</option>
                    <option value="manager@hotel.com">📋 Grace Muthoni (Restaurant Manager)</option>
                    <option value="admin-ops@hotel.com">🏢 Beatrice Wambui (Hotel Admin Ops)</option>
                  </optgroup>
                  <optgroup label="Level 3: Operations & Departments">
                    <option value="chef@hotel.com">👨‍🍳 Chef Samuel (Main Kitchen KDS)</option>
                    <option value="grill@hotel.com">🥩 Chef Kelvin (Charcoal Grill KDS)</option>
                    <option value="bar@hotel.com">🍸 Brian Kimani (Cocktail Bar KDS)</option>
                    <option value="pastry@hotel.com">🍰 Chef Chloe (Pastry Studio KDS)</option>
                    <option value="cashier@hotel.com">💳 Faith Chebet (Cashier POS)</option>
                    <option value="runner@hotel.com">🏃 Felix Cheruiyot (Food Runner)</option>
                    <option value="reception@hotel.com">🛎️ Sharon Nekesa (Front Desk PMS)</option>
                    <option value="inventory@hotel.com">📦 Mercy Achieng (Inventory BOM)</option>
                    <option value="accountant@hotel.com">📈 Patrick Ochieng (Accountant)</option>
                    <option value="audit@hotel.com">⚖️ George Kariuki (Internal Auditor)</option>
                  </optgroup>
                </select>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => handleSelect('login')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold text-xs shadow-sm hover:opacity-90 transition-opacity ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            <LogIn size={15} />
            {!collapsed && <span>Staff Sign In</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 bottom-0 z-40 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-over with overlay) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-stone-900 h-full shadow-2xl flex flex-col z-10 animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
