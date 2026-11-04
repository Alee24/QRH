import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
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
  ArrowRight
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
  driver_name?: string;
  created_at: string;
}

export const CentralOrderManager: React.FC = () => {
  const [orders, setOrders] = useState<CentralOrder[]>([]);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');

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

  useEffect(() => {
    loadData();
    loadMenuItems();
  }, [selectedSource, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, summaryRes] = await Promise.all([
        apiFetch<CentralOrder[]>(`/central-orders?source=${selectedSource}&status=${selectedStatus}`),
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

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.table_number || '').toLowerCase().includes(q)
    );
  });

  const kanbanColumns = [
    { id: 'received', label: 'New & Received', color: 'border-blue-500', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
    { id: 'confirmed', label: 'Confirmed', color: 'border-amber-500', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    { id: 'preparing', label: 'In Kitchen', color: 'border-orange-500', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' },
    { id: 'ready', label: 'Ready for Service', color: 'border-emerald-500', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
    { id: 'out_for_delivery', label: 'Out / Dispatched', color: 'border-purple-500', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
    { id: 'completed', label: 'Completed', color: 'border-stone-400', badge: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300' },
  ];

  const getSourceIcon = (src: string) => {
    switch (src) {
      case 'table_qr':
      case 'qr_code':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">QR Table</span>;
      case 'delivery':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">Delivery</span>;
      case 'takeaway':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">Takeaway</span>;
      case 'room_service':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Room PMS</span>;
      case 'catering':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">Catering</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-500/10 text-stone-600">POS Order</span>;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-3 sm:p-5 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* 1. TOP PIPELINE METRICS STRIP */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Orders</span>
              <span className="text-xl font-black text-stone-900 dark:text-stone-100 mt-0.5 block">{summary.metrics.total_orders}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-blue-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">New / Pending</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 block">{summary.metrics.new_orders}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-amber-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Confirmed</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">{summary.metrics.confirmed_orders}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-orange-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block">In Kitchen</span>
              <span className="text-xl font-black text-orange-600 dark:text-orange-400 mt-0.5 block">{summary.metrics.preparing_orders}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Ready</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{summary.metrics.ready_orders}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-purple-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider block">Dispatched</span>
              <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5 block">{summary.metrics.dispatch_orders}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Completed</span>
              <span className="text-xl font-black text-stone-700 dark:text-stone-300 mt-0.5 block">{summary.metrics.completed_orders}</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Order Revenue</span>
              <span className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-400 mt-1 block">
                KES {summary.metrics.total_revenue.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* 2. FILTER & VIEW MODE HEADER */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase shrink-0 mr-1">Source:</span>
            {['all', 'qr_code', 'takeaway', 'delivery', 'room_service', 'walk_in_pos'].map((src) => (
              <button
                key={src}
                onClick={() => setSelectedSource(src)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors capitalize ${
                  selectedSource === src
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                {src.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={13} />
              <input
                type="text"
                placeholder="Search order #, customer, table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  viewMode === 'kanban' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500'
                }`}
              >
                Table
              </button>
            </div>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
            >
              <Plus size={14} />
              <span>New Order</span>
            </button>
          </div>
        </div>

        {/* 3. KANBAN WORKFLOW BOARD VIEW */}
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 items-start overflow-x-auto pb-4">
            {kanbanColumns.map((col) => {
              const colOrders = filteredOrders.filter((o) => {
                if (col.id === 'received') return o.status === 'received' || o.status === 'pending';
                if (col.id === 'out_for_delivery') return o.status === 'out_for_delivery' || o.status === 'awaiting_dispatch';
                return o.status === col.id;
              });

              return (
                <div
                  key={col.id}
                  className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs p-3 space-y-3 min-h-[500px]"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                    <span className="font-bold text-xs text-stone-900 dark:text-stone-100">{col.label}</span>
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${col.badge}`}>
                      {colOrders.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {colOrders.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => handleOpenDetail(ord.id)}
                        className={`p-3 rounded-xl bg-stone-50/80 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 border-l-3 ${col.color} border border-stone-200/70 dark:border-stone-700/60 shadow-xs cursor-pointer transition-all space-y-2`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100 font-mono">
                            {ord.order_number}
                          </span>
                          {getSourceIcon(ord.source)}
                        </div>

                        <div className="text-[11px] text-stone-500 space-y-0.5">
                          {ord.table_number && <div>Table: <span className="font-bold text-stone-700 dark:text-stone-300">#{ord.table_number}</span></div>}
                          {ord.customer_name && <div className="truncate font-medium text-stone-600 dark:text-stone-400">{ord.customer_name}</div>}
                          {ord.driver_name && <div className="text-purple-600 dark:text-purple-400 font-semibold">Driver: {ord.driver_name}</div>}
                        </div>

                        <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between">
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                            KES {ord.total_amount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 4. DATA TABLE VIEW */
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200/80 dark:border-stone-800/80 text-stone-500 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Customer / Table</th>
                    <th className="py-2.5 px-3">Items</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-extrabold font-mono text-stone-900 dark:text-stone-100">
                        {ord.order_number}
                      </td>
                      <td className="py-2.5 px-3">{getSourceIcon(ord.source)}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-stone-800 dark:text-stone-200 block">
                          {ord.table_number ? `Table #${ord.table_number}` : ord.customer_name || 'Customer'}
                        </span>
                        {ord.customer_phone && <span className="text-[10px] text-stone-400">{ord.customer_phone}</span>}
                      </td>
                      <td className="py-2.5 px-3">{ord.item_count} items</td>
                      <td className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400">
                        KES {ord.total_amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleOpenDetail(ord.id)}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-600 hover:text-white text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors"
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

      {/* 5. ORDER DETAIL MODAL */}
      <Modal
        isOpen={!!selectedOrderId}
        onClose={() => {
          setSelectedOrderId(null);
          setDetailData(null);
        }}
        title={`Order Details: ${detailData?.order?.order_number || ''}`}
      >
        {detailLoading || !detailData ? (
          <div className="p-8 text-center text-xs text-stone-400">Loading order timeline & items...</div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Quick Transition Action Bar */}
            <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-stone-700 dark:text-stone-300">
                Current Status: <span className="uppercase text-amber-600">{detailData.order.status}</span>
              </span>
              <div className="flex items-center gap-1.5">
                {detailData.order.status === 'received' && (
                  <button
                    onClick={() => handleStatusTransition(detailData.order.id, 'confirmed')}
                    className="px-2.5 py-1 rounded bg-amber-600 text-white font-bold"
                  >
                    Confirm Order
                  </button>
                )}
                {detailData.order.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusTransition(detailData.order.id, 'preparing')}
                    className="px-2.5 py-1 rounded bg-orange-600 text-white font-bold"
                  >
                    Send to Kitchen
                  </button>
                )}
                {detailData.order.status === 'preparing' && (
                  <button
                    onClick={() => handleStatusTransition(detailData.order.id, 'ready')}
                    className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold"
                  >
                    Mark Ready
                  </button>
                )}
                {detailData.order.status === 'ready' && (
                  <button
                    onClick={() => handleStatusTransition(detailData.order.id, 'completed')}
                    className="px-2.5 py-1 rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold"
                  >
                    Complete
                  </button>
                )}
                {detailData.order.status !== 'cancelled' && detailData.order.status !== 'completed' && (
                  <button
                    onClick={() => handleStatusTransition(detailData.order.id, 'cancelled')}
                    className="px-2 py-1 rounded text-red-600 hover:bg-red-50 font-bold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Itemized Order List */}
            <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
              <div className="bg-stone-50 dark:bg-stone-800 p-2 font-bold text-stone-600 dark:text-stone-300 text-[11px]">
                Ordered Dishes & Portions
              </div>
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {detailData.items.map((item: any) => (
                  <div key={item.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {item.quantity}x {item.item_name}
                      </span>
                      {item.portion_name && <span className="text-stone-500 ml-1">({item.portion_name})</span>}
                      {item.station_name && <span className="text-[10px] text-stone-400 block">Station: {item.station_name}</span>}
                    </div>
                    <span className="font-extrabold text-stone-900 dark:text-stone-100">
                      KES {item.total_price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-stone-50 dark:bg-stone-800/80 p-2.5 flex justify-between font-extrabold text-sm border-t border-stone-200 dark:border-stone-800">
                <span>Total Amount:</span>
                <span className="text-amber-600">KES {detailData.order.total_amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Customer & Delivery Context */}
            {detailData.delivery && (
              <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-50/20 dark:bg-purple-950/20 space-y-1">
                <span className="font-bold text-purple-700 dark:text-purple-300 block text-xs">Delivery Details:</span>
                <div>Recipient: {detailData.delivery.recipient_name} ({detailData.delivery.recipient_phone})</div>
                <div>Address: {detailData.delivery.delivery_address}</div>
                {detailData.delivery.driver_name && <div>Assigned Driver: {detailData.delivery.driver_name}</div>}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 6. CREATE ORDER MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Order (Omnichannel POS & Takeaway)"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">Order Source / Fulfilment</label>
            <select
              value={newOrderSource}
              onChange={(e) => setNewOrderSource(e.target.value)}
              className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold focus:outline-none"
            >
              <option value="takeaway">Takeaway Counter</option>
              <option value="delivery">Delivery Order</option>
              <option value="phone">Phone / WhatsApp Order</option>
              <option value="walk_in_pos">Walk-in POS</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Customer Name</label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+254 7..."
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              />
            </div>
          </div>

          {newOrderSource === 'delivery' && (
            <div>
              <label className="font-bold block mb-1">Delivery Address *</label>
              <input
                type="text"
                placeholder="Apartment / Estate / Street name"
                value={newDeliveryAddress}
                onChange={(e) => setNewDeliveryAddress(e.target.value)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              />
            </div>
          )}

          {/* Item Selector */}
          <div>
            <label className="font-bold block mb-1">Select Dishes from Menu</label>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800">
              {menuItems.slice(0, 15).map((item) => (
                <div key={item.id} className="p-2 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50">
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{item.name}</span>
                    <span className="text-[11px] text-amber-600 block">KES {item.price}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItems((prev) => {
                        const existing = prev.find((i) => i.id === item.id);
                        if (existing) {
                          return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
                        }
                        return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
                      });
                    }}
                    className="px-2 py-1 rounded bg-amber-600 text-white font-bold"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Items Summary */}
          {selectedItems.length > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20">
              <span className="font-bold block mb-1">Items in this Order ({selectedItems.length}):</span>
              {selectedItems.map((i) => (
                <div key={i.id} className="flex justify-between text-[11px]">
                  <span>{i.quantity}x {i.name}</span>
                  <span>KES {(i.price * i.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="flex-1 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrder}
              className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md"
            >
              Confirm & Dispatch to Kitchen
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

