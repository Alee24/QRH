import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { getDepartmentScopeForRole, DepartmentScope } from '../../utils/roleRoutes.js';
import { Modal } from '../../components/Modal.js';
import {
  ShoppingBag,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  UtensilsCrossed,
  Phone,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  Plus,
  X,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Flame,
  Check,
  Ban,
  ArrowRight,
  Bell,
  CreditCard,
  User,
  Coffee,
  CheckCheck
} from 'lucide-react';

interface OrderSummary {
  metrics: {
    total_orders: number;
    new_orders: number;
    confirmed_orders: number;
    preparing_orders: number;
    ready_orders: number;
    dispatch_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    total_revenue: number;
  };
  by_source: { source: string; count: number; revenue: number }[];
}

interface CentralOrder {
  id: string;
  order_number: string;
  source: string;
  fulfillment_type: string;
  fulfillment_status: string;
  status: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  table_number?: string;
  total_amount: number;
  payment_status: string;
  item_count: number;
  items_summary?: string;
  special_instructions?: string;
  driver_name?: string;
  created_at: string;
}

export const CentralOrderManager: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'hotel_owner';

  // Role-based Initial Status Tab Detection
  const getInitialTabForRole = (role?: string): string => {
    if (!role) return 'received';
    if (
      role === 'kitchen_manager' ||
      role === 'kitchen_staff' ||
      role.startsWith('station_chef_') ||
      role === 'chef' ||
      role === 'sous_chef'
    ) {
      return 'preparing';
    }
    if (
      role === 'service_staff' ||
      role === 'food_runner' ||
      role === 'runner' ||
      role === 'waiter'
    ) {
      return 'ready';
    }
    if (role === 'delivery_driver' || role === 'driver' || role === 'dispatch_manager') {
      return 'out_for_delivery';
    }
    if (role === 'cashier') {
      return 'received';
    }
    return 'received';
  };

  const [activeStatusTab, setActiveStatusTab] = useState<string>(() => getInitialTabForRole(user?.role));
  const [orders, setOrders] = useState<CentralOrder[]>([]);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Department-specific Scoping for Management Switcher
  const defaultScope = getDepartmentScopeForRole(userRole);
  const [departmentScope, setDepartmentScope] = useState<DepartmentScope>(defaultScope);

  // Filters
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Detail Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // New Order Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [newOrderSource, setNewOrderSource] = useState('takeaway');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newDeliveryAddress, setNewDeliveryAddress] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);

  // Sync role changes
  useEffect(() => {
    const nextScope = getDepartmentScopeForRole(user?.role);
    setDepartmentScope(nextScope);
    setActiveStatusTab(getInitialTabForRole(user?.role));
  }, [user?.role]);

  useEffect(() => {
    loadData();
    loadMenuItems();
  }, [selectedSource]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, summaryRes] = await Promise.all([
        apiFetch<CentralOrder[]>(`/central-orders?source=${selectedSource}&limit=150`),
        apiFetch<OrderSummary>('/central-orders/summary'),
      ]);
      setOrders(ordersRes);
      setSummary(summaryRes);
    } catch (err) {
      console.error('Failed to load central orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const data = await apiFetch<any>('/menu');
      const all = (data.categories || []).flatMap((c: any) => c.items || []);
      setMenuItems(all);
    } catch (e) {}
  };

  const handleOpenDetail = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setDetailLoading(true);
    try {
      const data = await apiFetch<any>(`/central-orders/${orderId}`);
      setDetailData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusTransition = async (orderId: string, nextStatus: string) => {
    try {
      await apiFetch(`/central-orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      loadData();
      if (selectedOrderId === orderId) {
        handleOpenDetail(orderId);
      }
    } catch (err: any) {
      alert(err.message || 'Status transition failed.');
    }
  };

  const handleCreateOrder = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one menu item.');
      return;
    }
    try {
      await apiFetch('/central-orders/create', {
        method: 'POST',
        body: JSON.stringify({
          source: newOrderSource,
          fulfillment_type: newOrderSource,
          customer_name: newCustomerName || 'Walk-in Guest',
          customer_phone: newCustomerPhone,
          delivery_address: newDeliveryAddress,
          items: selectedItems.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
        }),
      });
      setCreateModalOpen(false);
      setSelectedItems([]);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewDeliveryAddress('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create order.');
    }
  };

  // 1. Role-Based Visible Tabs Resolution
  const getVisibleTabsForRole = () => {
    const role = user?.role || '';
    const isKitchen =
      role === 'kitchen_manager' ||
      role === 'kitchen_staff' ||
      role.startsWith('station_chef_') ||
      role === 'chef' ||
      role === 'sous_chef';
    const isService =
      role === 'service_staff' ||
      role === 'food_runner' ||
      role === 'runner' ||
      role === 'waiter';
    const isDelivery = role === 'delivery_driver' || role === 'driver' || role === 'dispatch_manager';
    const isCashier = role === 'cashier';

    if (isKitchen) {
      return [
        { id: 'preparing', label: 'In Kitchen (Cooking)', icon: Flame },
        { id: 'received', label: 'New Tickets', icon: AlertCircle },
        { id: 'ready', label: 'Plated & Ready for Pass', icon: CheckCircle2 },
      ];
    }

    if (isService) {
      return [
        { id: 'ready', label: 'Ready for Service (Pass)', icon: Bell },
        { id: 'completed', label: 'Delivered to Table', icon: CheckCircle2 },
      ];
    }

    if (isDelivery) {
      return [
        { id: 'out_for_delivery', label: 'Out / Dispatched', icon: Truck },
        { id: 'ready', label: 'Ready for Pickup', icon: Bell },
        { id: 'completed', label: 'Delivered & Signed', icon: CheckCircle2 },
      ];
    }

    if (isCashier) {
      return [
        { id: 'received', label: 'Active Bills (Pending)', icon: CreditCard },
        { id: 'ready', label: 'Ready for Settlement', icon: CheckCircle2 },
        { id: 'completed', label: 'Paid & Settled Today', icon: CheckCircle2 },
        { id: 'all', label: 'All Invoices', icon: ShoppingBag },
      ];
    }

    // Default: Management / Hotel Owner / Super Admin sees all stages
    return [
      { id: 'received', label: 'New & Received', icon: AlertCircle },
      { id: 'confirmed', label: 'Confirmed', icon: Check },
      { id: 'preparing', label: 'In Kitchen', icon: Flame },
      { id: 'ready', label: 'Ready for Service', icon: Bell },
      { id: 'out_for_delivery', label: 'Out / Dispatched', icon: Truck },
      { id: 'completed', label: 'Completed', icon: CheckCircle2 },
      { id: 'all', label: 'All Channels', icon: ShoppingBag },
    ];
  };

  const visibleTabs = getVisibleTabsForRole();

  // 2. Tab Live Order Count Resolver
  const getTabCount = (tabId: string): number => {
    if (tabId === 'all') return orders.length;
    if (tabId === 'received') {
      return orders.filter((o) => o.status === 'received' || o.status === 'pending' || o.status === 'new').length;
    }
    if (tabId === 'out_for_delivery') {
      return orders.filter(
        (o) => o.status === 'out_for_delivery' || o.status === 'awaiting_dispatch' || o.status === 'dispatched'
      ).length;
    }
    return orders.filter((o) => o.status === tabId).length;
  };

  // 3. Filter orders based on search, department scope, and active tab
  const filteredOrders = orders.filter((o) => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        o.order_number.toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.table_number || '').toLowerCase().includes(q) ||
        (o.delivery_address || '').toLowerCase().includes(q) ||
        (o.items_summary || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    // Active status tab match
    if (activeStatusTab !== 'all') {
      if (activeStatusTab === 'received') {
        const isRec = o.status === 'received' || o.status === 'pending' || o.status === 'new';
        if (!isRec) return false;
      } else if (activeStatusTab === 'out_for_delivery') {
        const isOut = o.status === 'out_for_delivery' || o.status === 'awaiting_dispatch' || o.status === 'dispatched';
        if (!isOut) return false;
      } else {
        if (o.status !== activeStatusTab) return false;
      }
    }

    return true;
  });

  const getSourceBadge = (src: string) => {
    switch (src) {
      case 'table_qr':
      case 'qr_code':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1">
            <UtensilsCrossed size={12} className="shrink-0" />
            <span>Table QR</span>
          </span>
        );
      case 'delivery':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 flex items-center gap-1">
            <Truck size={12} className="shrink-0" />
            <span>Delivery</span>
          </span>
        );
      case 'takeaway':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 flex items-center gap-1">
            <ShoppingBag size={12} className="shrink-0" />
            <span>Takeaway</span>
          </span>
        );
      case 'room_service':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
            <Coffee size={12} className="shrink-0" />
            <span>Room PMS</span>
          </span>
        );
      case 'catering':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 flex items-center gap-1">
            <Calendar size={12} className="shrink-0" />
            <span>Catering</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 flex items-center gap-1">
            <CreditCard size={12} className="shrink-0" />
            <span>POS Walk-in</span>
          </span>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
      case 'pending':
      case 'new':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'confirmed':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'preparing':
      case 'in_kitchen':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30';
      case 'ready':
      case 'partially_ready':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'out_for_delivery':
      case 'awaiting_dispatch':
      case 'dispatched':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30';
      case 'completed':
      case 'delivered':
        return 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-3 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShoppingBag size={22} />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
                Central Orders & Fulfillment Hub
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Role-optimized order pipeline for Kitchen, Food Runners, Cashier POS, and Fleet Dispatch
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs whitespace-nowrap transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-colors"
            >
              <Plus size={15} />
              <span>Create Order</span>
            </button>
          </div>
        </div>

        {/* ROLE-BASED STATUS TABS STRIP (Full Width, Never Squished) */}
        <div className="bg-white dark:bg-stone-900 p-2 sm:p-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {visibleTabs.map((tab) => {
              const TabIcon = tab.icon;
              const count = getTabCount(tab.id);
              const isActive = activeStatusTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatusTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                  }`}
                >
                  <TabIcon size={15} className="shrink-0" />
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                      isActive
                        ? 'bg-white text-amber-700'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SEARCH, CHANNEL & VIEW TOGGLES */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase shrink-0 mr-1">Channel:</span>
            {['all', 'qr_code', 'delivery', 'takeaway', 'room_service', 'catering'].map((src) => (
              <button
                key={src}
                onClick={() => setSelectedSource(src)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors capitalize ${
                  selectedSource === src
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {src.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
              <input
                type="text"
                placeholder="Search order #, customer, table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* ORDER CARDS VIEW (Spacious, Tablet-Optimized, No Bleeding Order Numbers) */}
        {viewMode === 'cards' ? (
          <div>
            {loading ? (
              <div className="py-20 text-center text-xs text-stone-400">Loading active orders pipeline...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 space-y-3">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500/70" />
                <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                  No orders in this stage right now
                </h3>
                <p className="text-xs text-stone-400 max-w-md mx-auto">
                  New orders will automatically appear here in real-time as customers place orders at tables, for delivery, or takeaway.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredOrders.map((ord) => {
                  return (
                    <div
                      key={ord.id}
                      className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs hover:border-amber-500/40 transition-all space-y-4"
                    >
                      {/* Top Header: Order Number (Single Line Monospace) & Badges */}
                      <div className="flex items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800/80 pb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-black text-sm tracking-wider text-stone-900 dark:text-stone-100 whitespace-nowrap">
                            {ord.order_number}
                          </span>
                          {getSourceBadge(ord.source)}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-black capitalize border whitespace-nowrap ${getStatusColor(
                              ord.status
                            )}`}
                          >
                            {ord.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-stone-400 whitespace-nowrap flex items-center gap-1">
                            <Clock size={12} />
                            <span>
                              {new Date(ord.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Customer & Location Details Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                            {ord.table_number ? (
                              <>
                                <UtensilsCrossed size={14} className="text-amber-600 shrink-0" />
                                <span>Table #{ord.table_number}</span>
                              </>
                            ) : (
                              <>
                                <User size={14} className="text-amber-600 shrink-0" />
                                <span className="truncate">{ord.customer_name || 'Walk-in Guest'}</span>
                              </>
                            )}
                          </div>

                          {ord.customer_phone && (
                            <div className="text-stone-500 flex items-center gap-1">
                              <Phone size={12} className="shrink-0 text-stone-400" />
                              <a href={`tel:${ord.customer_phone}`} className="hover:underline">
                                {ord.customer_phone}
                              </a>
                            </div>
                          )}

                          {ord.delivery_address && (
                            <div className="text-stone-600 dark:text-stone-400 flex items-start gap-1">
                              <MapPin size={12} className="shrink-0 text-purple-600 mt-0.5" />
                              <span className="line-clamp-2">{ord.delivery_address}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 sm:text-right">
                          <div className="font-black text-base text-amber-600 dark:text-amber-400 whitespace-nowrap">
                            KES {ord.total_amount.toLocaleString()}
                          </div>
                          <div>
                            {ord.payment_status === 'paid' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md whitespace-nowrap">
                                <CheckCheck size={12} />
                                <span>Paid via M-Pesa</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md whitespace-nowrap">
                                <Clock size={12} />
                                <span>Pending Payment</span>
                              </span>
                            )}
                          </div>
                          {ord.driver_name && (
                            <div className="text-purple-600 dark:text-purple-400 font-semibold text-[11px]">
                              Driver: {ord.driver_name}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Items Summary Strip */}
                      <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 text-xs">
                        <span className="font-extrabold text-stone-700 dark:text-stone-300 block mb-1">
                          Items ({ord.item_count || 1}):
                        </span>
                        <p className="text-stone-600 dark:text-stone-400 font-medium line-clamp-2 leading-relaxed">
                          {ord.items_summary || `${ord.item_count} menu items`}
                        </p>
                      </div>

                      {/* Single-Row Action Buttons (No Multi-Row Bleeding) */}
                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                        <button
                          onClick={() => handleOpenDetail(ord.id)}
                          className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs whitespace-nowrap transition-colors"
                        >
                          <Eye size={14} />
                          <span>Details</span>
                        </button>

                        <div className="flex items-center gap-2 flex-1 justify-end">
                          {/* Contextual Status Actions */}
                          {(ord.status === 'received' || ord.status === 'pending' || ord.status === 'new') && (
                            <>
                              <button
                                onClick={() => handleStatusTransition(ord.id, 'confirmed')}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-colors"
                              >
                                <Check size={14} />
                                <span>Accept Order</span>
                              </button>
                              <button
                                onClick={() => handleStatusTransition(ord.id, 'preparing')}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-colors"
                              >
                                <Flame size={14} />
                                <span>Send to Kitchen</span>
                              </button>
                            </>
                          )}

                          {ord.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusTransition(ord.id, 'preparing')}
                              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-colors"
                            >
                              <Flame size={14} />
                              <span>Start Cooking (Kitchen)</span>
                            </button>
                          )}

                          {(ord.status === 'preparing' || ord.status === 'in_kitchen') && (
                            <button
                              onClick={() => handleStatusTransition(ord.id, 'ready')}
                              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-colors"
                            >
                              <CheckCircle2 size={14} />
                              <span>Mark Plated & Ready</span>
                            </button>
                          )}

                          {ord.status === 'ready' && (
                            <>
                              {ord.source === 'delivery' || ord.fulfillment_type === 'delivery' ? (
                                <button
                                  onClick={() => handleStatusTransition(ord.id, 'out_for_delivery')}
                                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-colors"
                                >
                                  <Truck size={14} />
                                  <span>Handover to Driver</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusTransition(ord.id, 'completed')}
                                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 font-bold text-xs whitespace-nowrap shadow-xs transition-colors"
                                >
                                  <CheckCheck size={14} />
                                  <span>Table Served & Complete</span>
                                </button>
                              )}
                            </>
                          )}

                          {(ord.status === 'out_for_delivery' ||
                            ord.status === 'awaiting_dispatch' ||
                            ord.status === 'dispatched') && (
                            <button
                              onClick={() => handleStatusTransition(ord.id, 'completed')}
                              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-colors"
                            >
                              <CheckCircle2 size={14} />
                              <span>Confirm Delivery & Settle</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* DATA TABLE VIEW */
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200/80 dark:border-stone-800/80 text-stone-500 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 whitespace-nowrap">Order #</th>
                    <th className="py-3 px-4 whitespace-nowrap">Channel</th>
                    <th className="py-3 px-4 whitespace-nowrap">Destination</th>
                    <th className="py-3 px-4 whitespace-nowrap">Dishes</th>
                    <th className="py-3 px-4 whitespace-nowrap">Total</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                        {ord.order_number}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{getSourceBadge(ord.source)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-stone-800 dark:text-stone-200 block">
                          {ord.table_number ? `Table #${ord.table_number}` : ord.customer_name || 'Guest'}
                        </span>
                        {ord.customer_phone && <span className="text-[10px] text-stone-400">{ord.customer_phone}</span>}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-stone-600 dark:text-stone-400">
                        {ord.items_summary || `${ord.item_count} items`}
                      </td>
                      <td className="py-3 px-4 font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        KES {ord.total_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${getStatusColor(
                            ord.status
                          )}`}
                        >
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetail(ord.id)}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-600 hover:text-white text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors whitespace-nowrap"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ORDER DETAIL MODAL */}
      <Modal
        isOpen={!!selectedOrderId}
        onClose={() => {
          setSelectedOrderId(null);
          setDetailData(null);
        }}
        title={`Order Details: ${detailData?.order?.order_number || ''}`}
        maxWidth="md"
      >
        {detailLoading || !detailData ? (
          <div className="p-8 text-center text-xs text-stone-400">Loading order timeline & items...</div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Quick Transition Action Bar */}
            <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-stone-700 dark:text-stone-300">
                Current Status: <span className="uppercase text-amber-600 font-black">{detailData.order.status}</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {detailData.order.status === 'received' && (
                  <button
                    onClick={() => handleStatusTransition(detailData.order.id, 'confirmed')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold whitespace-nowrap"
                  >
                    Confirm Order
                  </button>
                )}
                {detailData.order.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusTransition(detailData.order.id, 'preparing')}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 text-white font-bold whitespace-nowrap"
                  >
                    Send to Kitchen
                  </button>
                )}
                {detailData.order.status === 'preparing' && (
                  <button
                    onClick={() => handleStatusTransition(detailData.order.id, 'ready')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold whitespace-nowrap"
                  >
                    Mark Ready
                  </button>
                )}
                {detailData.order.status === 'ready' && (
                  <button
                    onClick={() => handleStatusTransition(detailData.order.id, 'completed')}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold whitespace-nowrap"
                  >
                    Complete
                  </button>
                )}
                {detailData.order.status !== 'cancelled' && detailData.order.status !== 'completed' && (
                  <button
                    onClick={() => handleStatusTransition(detailData.order.id, 'cancelled')}
                    className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold whitespace-nowrap"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Customer & Destination Summary */}
            <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-400">Customer:</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  {detailData.order.customer_name || 'Walk-in'}
                </span>
              </div>
              {detailData.order.customer_phone && (
                <div className="flex justify-between">
                  <span className="text-stone-400">Phone:</span>
                  <span className="font-mono">{detailData.order.customer_phone}</span>
                </div>
              )}
              {detailData.order.table_number && (
                <div className="flex justify-between">
                  <span className="text-stone-400">Table:</span>
                  <span className="font-bold text-amber-600">Table #{detailData.order.table_number}</span>
                </div>
              )}
              {detailData.order.delivery_address && (
                <div className="flex justify-between">
                  <span className="text-stone-400">Delivery Address:</span>
                  <span className="font-medium text-right max-w-xs">{detailData.order.delivery_address}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-stone-100 dark:border-stone-800">
                <span className="text-stone-400">Total Billed:</span>
                <span className="font-black text-amber-600 text-sm">
                  KES {detailData.order.total_amount?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Itemized Order List */}
            <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
              <div className="bg-stone-50 dark:bg-stone-800 p-2.5 font-bold text-stone-600 dark:text-stone-300 text-[11px]">
                Ordered Dishes & Portions
              </div>
              <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-60 overflow-y-auto">
                {detailData.items?.map((item: any) => (
                  <div key={item.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {item.quantity}x {item.item_name}
                      </span>
                      {item.portion_name && (
                        <span className="text-[10px] text-stone-400 ml-1.5">({item.portion_name})</span>
                      )}
                      {item.notes && <div className="text-[10px] text-amber-600 mt-0.5">Note: {item.notes}</div>}
                    </div>
                    <span className="font-mono text-stone-600 dark:text-stone-400">
                      KES {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE MANUAL OMNICHANNEL ORDER MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Order (Manual POS / Phone / Delivery)"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Channel / Source</label>
              <select
                value={newOrderSource}
                onChange={(e) => setNewOrderSource(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold"
              >
                <option value="takeaway">Takeaway (Walk-in / Phone)</option>
                <option value="delivery">Doorstep Delivery</option>
                <option value="room_service">Hotel Room Service</option>
                <option value="walk_in_pos">Bar / Terrace Walk-in</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Customer Name</label>
              <input
                type="text"
                placeholder="E.g. David Mwangi"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Customer Phone</label>
              <input
                type="text"
                placeholder="0712345678"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium"
              />
            </div>

            {newOrderSource === 'delivery' && (
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Delivery Address</label>
                <input
                  type="text"
                  placeholder="Estate, Road, House #"
                  value={newDeliveryAddress}
                  onChange={(e) => setNewDeliveryAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium"
                />
              </div>
            )}
          </div>

          {/* Item Selector */}
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">Add Dishes to Ticket</label>
            <div className="max-h-44 overflow-y-auto border border-stone-200 dark:border-stone-700 rounded-xl divide-y divide-stone-100 dark:divide-stone-800">
              {menuItems.slice(0, 30).map((dish) => (
                <div key={dish.id} className="p-2 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50">
                  <div>
                    <span className="font-bold text-stone-800 dark:text-stone-200">{dish.name}</span>
                    <span className="text-stone-400 ml-2">KES {dish.base_price?.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedItems((prev) => {
                        const existing = prev.find((x) => x.id === dish.id);
                        if (existing) {
                          return prev.map((x) => (x.id === dish.id ? { ...x, quantity: x.quantity + 1 } : x));
                        }
                        return [...prev, { id: dish.id, name: dish.name, price: dish.base_price, quantity: 1 }];
                      });
                    }}
                    className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-white rounded-lg font-bold text-xs"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1.5">
              <span className="font-bold text-amber-700 dark:text-amber-400 block">Selected Items:</span>
              {selectedItems.map((si) => (
                <div key={si.id} className="flex justify-between items-center text-xs">
                  <span>
                    {si.quantity}x {si.name}
                  </span>
                  <span className="font-bold font-mono">KES {(si.price * si.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-amber-500/20 flex justify-between font-black text-stone-900 dark:text-stone-100">
                <span>Total Amount:</span>
                <span>KES {selectedItems.reduce((acc, i) => acc + i.price * i.quantity, 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleCreateOrder}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
          >
            Submit Omnichannel Order
          </button>
        </div>
      </Modal>
    </div>
  );
};
