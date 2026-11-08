import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { useCart } from '../../context/CartContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { soundEffects } from '../../utils/audioChime.js';
import { Modal } from '../../components/Modal.js';
import { OrderStatusBadge } from '../../components/Badge.js';
import {
  Utensils,
  Search,
  Clock,
  Sparkles,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  BellRing,
  CreditCard,
  Phone,
  Wifi,
  ChevronRight,
  Flame,
  Soup,
  Egg,
  Wine,
  Coffee,
  Cake,
  AlertCircle,
  RefreshCw,
  Smartphone,
  FileText
} from 'lucide-react';

export const CustomerOrdering: React.FC<{ initialToken?: string; onBackToWebsite?: () => void }> = ({
  initialToken,
  onBackToWebsite,
}) => {
  const { items: cartItems, addItem, updateQuantity, removeItem, clearCart, subtotal, itemCount } = useCart();
  const { socket } = useSocket();

  // State
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDietary, setSelectedDietary] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modals & Panels
  const [selectedItemForModal, setSelectedItemForModal] = useState<any | null>(null);
  const [modalPortion, setModalPortion] = useState<any | null>(null);
  const [modalModifiers, setModalModifiers] = useState<Record<string, any>>({});
  const [modalNotes, setModalNotes] = useState('');
  const [modalQuantity, setModalQuantity] = useState(1);

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderInstructions, setOrderInstructions] = useState('');

  // Active Session & Order Tracking
  const [sessionData, setSessionData] = useState<any | null>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [viewingTracker, setViewingTracker] = useState(false);

  // Assistance Modal
  const [assistanceModalOpen, setAssistanceModalOpen] = useState(false);
  const [assistanceSuccess, setAssistanceSuccess] = useState<string | null>(null);

  // M-Pesa Bill Payment
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [billingData, setBillingData] = useState<any | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState('0712345678');
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [mpesaSuccess, setMpesaSuccess] = useState<string | null>(null);

  // Universal Customer Checkout with M-Pesa STK Push
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('last_customer_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('last_customer_phone') || '0712345678');
  const [seatingLocation, setSeatingLocation] = useState('');
  const [stkPushActive, setStkPushActive] = useState(false);
  const [stkStatus, setStkStatus] = useState<{
    checkoutRequestId?: string;
    phone?: string;
    amount?: number;
    receipt?: string;
    message?: string;
    verified?: boolean;
    orderId?: string;
    orderNumber?: string;
    sessionId?: string;
    tableNumber?: string;
  } | null>(null);

  // Load Tables & Menu
  useEffect(() => {
    loadTables();
    loadMenu();
  }, [initialToken]);

  const loadTables = async () => {
    try {
      // 1. Direct table token / table number resolution via /scan endpoint
      if (initialToken) {
        try {
          const directScanned = await apiFetch<any>(`/tables/scan/${encodeURIComponent(initialToken)}`);
          if (directScanned && directScanned.table) {
            setSelectedTable(directScanned.table);
            if (directScanned.session) {
              setSessionData(directScanned.session);
              setActiveOrders(directScanned.orders || []);
            }
            // CRITICAL: Always keep menu visible on scan so the guest can browse and order immediately!
            setViewingTracker(false);
          }
        } catch (e) {
          console.warn('Direct token scan check failed, falling back to table list:', e);
        }
      }

      // 2. Fetch full tables catalog
      const data = await apiFetch<any[]>('/tables');
      setTables(data);

      if (data.length > 0) {
        if (initialToken) {
          const match = data.find((t) => 
            t.qr_token === initialToken || 
            String(t.table_number).toLowerCase() === String(initialToken).toLowerCase() ||
            t.id === initialToken
          );
          if (match) {
            setSelectedTable(match);
            handleSelectTable(match);
            return;
          }
        }
        if (!selectedTable) {
          handleSelectTable(data[0]);
        }
      }
    } catch (err) {
      console.error('Error loading tables:', err);
    }
  };

  const loadMenu = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/menu');
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error loading menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = async (table: any) => {
    setSelectedTable(table);
    try {
      const scanned = await apiFetch<any>(`/tables/scan/${table.qr_token || table.id}`);
      if (scanned.session) {
        setSessionData(scanned.session);
        setActiveOrders(scanned.orders || []);
        // Note: Do NOT auto-flip viewingTracker to true; guarantee menu is open for ordering!
      } else {
        setSessionData(null);
        setActiveOrders([]);
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
  };

  // Listen to socket order status updates in real-time
  useEffect(() => {
    if (!socket || !sessionData) return;

    socket.emit('join:session', sessionData.session_code);

    const onOrderReceived = (data: any) => {
      soundEffects.playOrderBell();
      setActiveOrders((prev) => {
        const exists = prev.some((o) => o.id === data.order.id);
        if (exists) return prev.map((o) => (o.id === data.order.id ? data.order : o));
        return [...prev, data.order];
      });
    };

    const onStatusChange = (data: any) => {
      soundEffects.playReadyChime();
      setActiveOrders((prev) =>
        prev.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o))
      );
    };

    const onPaymentSettled = (payment: any) => {
      soundEffects.playReadyChime();
      setMpesaSuccess(`Payment of KES ${payment.amount?.toLocaleString()} confirmed!`);
      // Reload session
      if (selectedTable) handleSelectTable(selectedTable);
    };

    socket.on('order:received', onOrderReceived);
    socket.on('order:status_change', onStatusChange);
    socket.on('payment:settled', onPaymentSettled);

    return () => {
      socket.off('order:received', onOrderReceived);
      socket.off('order:status_change', onStatusChange);
      socket.off('payment:settled', onPaymentSettled);
    };
  }, [socket, sessionData, selectedTable]);

  // Open Item Customizer
  const handleOpenItem = (item: any) => {
    setSelectedItemForModal(item);
    setModalQuantity(1);
    setModalNotes('');

    // Default portion
    if (item.portions && item.portions.length > 0) {
      const def = item.portions.find((p: any) => p.is_default) || item.portions[0];
      setModalPortion(def);
    } else {
      setModalPortion(null);
    }

    // Default modifiers
    const initialMods: Record<string, any> = {};
    if (item.modifier_groups) {
      for (const mg of item.modifier_groups) {
        if (mg.is_required && mg.options?.length > 0) {
          initialMods[mg.id] = [mg.options[0]];
        } else {
          initialMods[mg.id] = [];
        }
      }
    }
    setModalModifiers(initialMods);
  };

  // Add Item to Cart from modal
  const handleAddToCart = () => {
    if (!selectedItemForModal) return;

    const chosenModifiers: { name: string; price: number }[] = [];
    let modifiersCost = 0;

    Object.values(modalModifiers).forEach((opts) => {
      if (Array.isArray(opts)) {
        opts.forEach((o) => {
          chosenModifiers.push({ name: o.name, price: o.price });
          modifiersCost += o.price;
        });
      }
    });

    addItem({
      menuItemId: selectedItemForModal.id,
      name: selectedItemForModal.name,
      price: selectedItemForModal.price,
      portionName: modalPortion ? modalPortion.name : undefined,
      portionPrice: modalPortion ? modalPortion.price : undefined,
      quantity: modalQuantity,
      modifiers: chosenModifiers,
      modifiersCost,
      notes: modalNotes,
      imageUrl: selectedItemForModal.image_url,
    });

    setSelectedItemForModal(null);
  };

  // Open Checkout Modal
  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;
    setCartDrawerOpen(false);
    setCheckoutModalOpen(true);
    setStkPushActive(false);
    setStkStatus(null);
    if (!seatingLocation && selectedTable) {
      setSeatingLocation(selectedTable.name || `Table ${selectedTable.table_number}`);
    }
  };

  // Submit Order and Trigger Safaricom Daraja M-Pesa STK Push
  const handleConfirmOrderAndPayStk = async () => {
    const rawPhone = customerPhone.trim().replace(/\s+/g, '').replace(/^\+/, '');
    if (!rawPhone) {
      alert('Please enter your Safaricom M-Pesa phone number to receive the STK payment prompt.');
      return;
    }

    // Auto-normalize Kenyan phone numbers for Safaricom Daraja API
    let normalizedPhone = rawPhone;
    if (normalizedPhone.startsWith('0') && normalizedPhone.length === 10) {
      normalizedPhone = '254' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('254') && normalizedPhone.length === 9) {
      normalizedPhone = '254' + normalizedPhone;
    }

    const tableNum = selectedTable?.table_number || '01';
    const effectiveName = customerName.trim() || `Guest Table ${tableNum}`;

    localStorage.setItem('last_customer_name', customerName);
    localStorage.setItem('last_customer_phone', customerPhone);
    setOrderSubmitting(true);

    try {
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const targetTableId = selectedTable?.id || (tables[0] ? tables[0].id : 'tbl-t1');

      const payload = {
        tableId: targetTableId,
        sessionCode: sessionData?.session_code,
        source: 'qr_code',
        customerName: effectiveName,
        customerPhone: normalizedPhone,
        items: cartItems.map((i) => ({
          menuItemId: i.menuItemId,
          portionName: i.portionName,
          portionPrice: i.portionPrice,
          quantity: i.quantity,
          modifiers: i.modifiers,
          notes: i.notes,
        })),
        specialInstructions: [seatingLocation ? `Location: ${seatingLocation}` : '', orderInstructions].filter(Boolean).join(' • '),
        idempotencyKey,
      };

      const newOrder = await apiFetch<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Sound chime
      soundEffects.playOrderPlaced();

      // Trigger M-Pesa STK Push
      setStkPushActive(true);
      const stkRes = await apiFetch<any>('/payments/mpesa/stk-push', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: newOrder.table_session_id,
          orderId: newOrder.id,
          tenantId: newOrder.tenant_id,
          phoneNumber: normalizedPhone,
          amount: newOrder.total_amount,
        }),
      });

      setStkStatus({
        checkoutRequestId: stkRes.checkoutRequestId,
        phone: stkRes.phone || normalizedPhone,
        amount: newOrder.total_amount,
        message: stkRes.customerMessage || `M-Pesa STK prompt sent to ${normalizedPhone}`,
        orderId: newOrder.id,
        orderNumber: newOrder.order_number,
        sessionId: newOrder.table_session_id,
        tableNumber: tableNum,
        verified: false,
      });

      clearCart();
      setOrderInstructions('');

      // Auto-simulate confirmation after 3.2s for smooth demo/live testing
      setTimeout(async () => {
        try {
          const verifyRes = await apiFetch<any>('/payments/mpesa/verify', {
            method: 'POST',
            body: JSON.stringify({
              sessionId: newOrder.table_session_id,
              checkoutRequestId: stkRes.checkoutRequestId,
            }),
          });
          setStkStatus((prev) => (prev ? { ...prev, verified: true, receipt: verifyRes.receipt } : null));
          soundEffects.playPaymentSuccess();
        } catch (e) {}
      }, 3200);

      if (selectedTable) {
        await handleSelectTable(selectedTable);
      }
    } catch (err: any) {
      alert(`Order submission error: ${err.message}`);
      setStkPushActive(false);
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Submit Order and Pay Later at Table (Cash / Card with Waiter)
  const handlePlaceOrderPayLater = async () => {
    if (cartItems.length === 0) return;
    const tableNum = selectedTable?.table_number || '01';
    const effectiveName = customerName.trim() || `Guest Table ${tableNum}`;
    let normalizedPhone = customerPhone.trim().replace(/\s+/g, '').replace(/^\+/, '') || '0712345678';
    if (normalizedPhone.startsWith('0') && normalizedPhone.length === 10) {
      normalizedPhone = '254' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('254') && normalizedPhone.length === 9) {
      normalizedPhone = '254' + normalizedPhone;
    }

    setOrderSubmitting(true);
    try {
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const targetTableId = selectedTable?.id || (tables[0] ? tables[0].id : 'tbl-t1');

      const payload = {
        tableId: targetTableId,
        sessionCode: sessionData?.session_code,
        source: 'qr_code',
        customerName: effectiveName,
        customerPhone: normalizedPhone,
        items: cartItems.map((i) => ({
          menuItemId: i.menuItemId,
          portionName: i.portionName,
          portionPrice: i.portionPrice,
          quantity: i.quantity,
          modifiers: i.modifiers,
          notes: i.notes,
        })),
        specialInstructions: [seatingLocation ? `Location: ${seatingLocation}` : '', orderInstructions].filter(Boolean).join(' • '),
        idempotencyKey,
      };

      await apiFetch<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      soundEffects.playOrderPlaced();
      clearCart();
      setOrderInstructions('');
      setCheckoutModalOpen(false);

      if (selectedTable) {
        await handleSelectTable(selectedTable);
      }
      setViewingTracker(true);
    } catch (err: any) {
      alert(`Order submission error: ${err.message}`);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleManualVerifyStk = async () => {
    if (!stkStatus?.checkoutRequestId || !stkStatus?.sessionId) return;
    try {
      const verifyRes = await apiFetch<any>('/payments/mpesa/verify', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: stkStatus.sessionId,
          checkoutRequestId: stkStatus.checkoutRequestId,
        }),
      });
      setStkStatus((prev) => (prev ? { ...prev, verified: true, receipt: verifyRes.receipt } : null));
      soundEffects.playPaymentSuccess();
    } catch (err: any) {
      alert(err.message || 'Payment verification in progress...');
    }
  };

  // Submit Order (Legacy / Direct)
  const handleSubmitOrder = async () => {
    handleProceedToCheckout();
  };

  // Request Assistance
  const handleRequestAssistance = async (type: string) => {
    if (!selectedTable) return;
    try {
      await apiFetch('/orders/assistance', {
        method: 'POST',
        body: JSON.stringify({
          tableId: selectedTable.id,
          sessionCode: sessionData?.session_code,
          requestType: type,
        }),
      });
      setAssistanceSuccess(`Service staff notified: ${type.replace(/_/g, ' ')}`);
      setTimeout(() => {
        setAssistanceSuccess(null);
        setAssistanceModalOpen(false);
      }, 2000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Bill & M-Pesa Modal
  const handleOpenBill = async () => {
    if (!sessionData) return;
    try {
      const bill = await apiFetch<any>(`/cashier/session/${sessionData.id}`);
      setBillingData(bill);
      setBillModalOpen(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Send M-Pesa STK Push
  const handleSendMpesaStk = async () => {
    if (!sessionData || !billingData) return;
    setMpesaLoading(true);
    try {
      const res = await apiFetch<any>('/payments/mpesa/stk-push', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: sessionData.id,
          phoneNumber: mpesaPhone,
          amount: billingData.pricing.balance,
        }),
      });

      // Automatically verify in demo mode or wait for real Daraja callback
      setTimeout(async () => {
        try {
          await apiFetch('/payments/mpesa/verify', {
            method: 'POST',
            body: JSON.stringify({
              sessionId: sessionData.id,
              checkoutRequestId: res.checkoutRequestId,
            }),
          });
        } catch (e) {}
      }, 1500);

      setMpesaSuccess(res.customerMessage || 'M-Pesa STK push prompt sent to your phone!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMpesaLoading(false);
    }
  };

  // Filter items
  const allItems = categories.flatMap((c) => c.items || []);
  const filteredItems = (activeCategory === 'all'
    ? allItems
    : categories.find((c) => c.id === activeCategory)?.items || []
  ).filter((item: any) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDietary =
      selectedDietary === 'all' ||
      (item.dietary_flags && item.dietary_flags.includes(selectedDietary));
    return matchesSearch && matchesDietary;
  });

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-28">
      {/* 0. Optional Top Navigation Strip */}
      {onBackToWebsite && (
        <div className="bg-stone-900 text-stone-300 px-4 py-2 text-xs flex items-center justify-between border-b border-stone-800">
          <button
            onClick={onBackToWebsite}
            className="flex items-center gap-1.5 hover:text-white transition font-medium"
          >
            <span>← Return to Sironi Restaurants Platform</span>
          </button>
          <span className="text-[11px] text-stone-400">Live Guest Ordering Simulator</span>
        </div>
      )}

      {/* 1. RESTAURANT & TABLE HEADER */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/30">
                {selectedTable ? selectedTable.table_number : '01'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                    {selectedTable?.name || 'Table 01'}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                    Self-Service QR
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Wifi size={12} className="text-amber-600" />
                    Sironi-Guest (sironiguest)
                  </span>
                </div>
              </div>
            </div>

            {/* Table Switcher Demo Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={selectedTable?.id || ''}
                onChange={(e) => {
                  const t = tables.find((tbl) => tbl.id === e.target.value);
                  if (t) handleSelectTable(t);
                }}
                className="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs rounded-xl px-2.5 py-1.5 border-0 focus:ring-2 focus:ring-amber-500 font-medium"
              >
                {tables.map((tbl) => (
                  <option key={tbl.id} value={tbl.id}>
                    T{tbl.table_number} - {tbl.name}
                  </option>
                ))}
              </select>

              {/* Call Waiter Quick Button */}
              <button
                onClick={() => setAssistanceModalOpen(true)}
                className="p-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 hover:bg-amber-200 transition-colors"
                title="Call Waiter"
              >
                <BellRing size={16} />
              </button>
            </div>
          </div>

          {/* Active Orders Tracker Pill */}
          {activeOrders.length > 0 && (
            <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  {activeOrders.length} Active {activeOrders.length === 1 ? 'Order' : 'Orders'} in Session ({sessionData?.session_code})
                </span>
              </div>
              <button
                onClick={() => setViewingTracker(!viewingTracker)}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                {viewingTracker ? 'Hide Tracker' : 'View Live Progress'}
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4">
        {/* 2. REAL-TIME ORDER TRACKER (Expandable) */}
        {viewingTracker && activeOrders.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="text-amber-600" size={18} />
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Live Kitchen & Service Progress
                </h2>
              </div>
              <button
                onClick={handleOpenBill}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-sm hover:bg-amber-700 transition-colors"
              >
                <CreditCard size={13} />
                <span>View Bill & Pay</span>
              </button>
            </div>

            <div className="space-y-3">
              {activeOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-150 dark:border-stone-700/60"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {ord.order_number}
                      </span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 ml-2">
                        {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/orders/${ord.id}/receipt-pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 text-[10px] font-semibold flex items-center gap-1 transition"
                        title="Download Sironi Dining Receipt"
                      >
                        <FileText size={11} className="text-amber-600" />
                        <span>Receipt (PDF)</span>
                      </a>
                      <OrderStatusBadge status={ord.status} size="sm" />
                    </div>
                  </div>

                  {/* Items in order */}
                  <div className="text-xs text-stone-600 dark:text-stone-300 space-y-1">
                    {ord.items?.map((it: any) => (
                      <div key={it.id} className="flex justify-between items-center py-0.5">
                        <span>
                          {it.quantity}x {it.item_name} {it.portion_name && `(${it.portion_name})`}
                        </span>
                        <span className="font-mono text-stone-500">
                          KES {it.total_price?.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. SEARCH & DIETARY FILTERS */}
        <div className="space-y-3 mb-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Search dishes, drinks, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100 shadow-sm"
            />
          </div>

          {/* Dietary Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {['all', 'Halal', 'Chef Special', 'Vegetarian', 'Gluten-Free', 'Seafood'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedDietary(tag)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  selectedDietary === tag
                    ? 'bg-amber-600 text-white'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {tag === 'all' ? 'All Dishes' : tag}
              </button>
            ))}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100'
              }`}
            >
              <Utensils size={14} />
              <span>Full Menu</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. DISHES MENU GRID */}
        {loading ? (
          <div className="py-12 text-center text-stone-400">Loading fine dining menu...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-stone-500">No dishes match your filter criteria.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item: any) => (
              <div
                key={item.id}
                onClick={() => handleOpenItem(item)}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Dish Image */}
                  <div className="relative h-44 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.is_sold_out ? (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm tracking-wide">
                        SOLD OUT FOR TODAY
                      </div>
                    ) : null}

                    {/* Prep time badge */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur text-white text-[10px] font-medium flex items-center gap-1">
                      <Clock size={11} />
                      <span>{item.estimated_prep_time} mins</span>
                    </div>

                    {/* Dietary badge */}
                    {item.dietary_flags && item.dietary_flags.length > 0 && (
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        {item.dietary_flags.slice(0, 2).map((flag: string) => (
                          <span
                            key={flag}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/90 text-white shadow-sm"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm group-hover:text-amber-600 transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Price and Add button */}
                <div className="p-4 pt-0 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 font-semibold uppercase block">
                      Price
                    </span>
                    <span className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                      KES {item.price.toLocaleString()}
                    </span>
                  </div>

                  <button
                    disabled={Boolean(item.is_sold_out)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-40 transition-colors shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. ITEM CUSTOMIZATION MODAL */}
      <Modal
        isOpen={Boolean(selectedItemForModal)}
        onClose={() => setSelectedItemForModal(null)}
        title={selectedItemForModal?.name || 'Customize Dish'}
        maxWidth="lg"
      >
        {selectedItemForModal && (
          <div className="space-y-4 text-sm">
            {/* Header with image */}
            <div className="relative h-40 rounded-xl overflow-hidden -mt-2">
              <img
                src={selectedItemForModal.image_url}
                alt={selectedItemForModal.name}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300">
              {selectedItemForModal.description}
            </p>

            {/* Portions selection */}
            {selectedItemForModal.portions?.length > 0 && (
              <div>
                <label className="text-xs font-bold text-stone-800 dark:text-stone-200 block mb-2 uppercase tracking-wide">
                  Select Portion Size
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedItemForModal.portions.map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setModalPortion(p)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        modalPortion?.id === p.id
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                          : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="font-bold">{p.name}</div>
                      <div className="text-stone-500 dark:text-stone-400 mt-0.5">
                        KES {p.price.toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Modifier Groups */}
            {selectedItemForModal.modifier_groups?.map((mg: any) => (
              <div key={mg.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                    {mg.name}
                  </span>
                  {mg.is_required ? (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                      Required
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400">Optional</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {mg.options?.map((opt: any) => {
                    const currentSelected = modalModifiers[mg.id] || [];
                    const isSelected = currentSelected.some((o: any) => o.name === opt.name);

                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => {
                          if (mg.max_selection === 1) {
                            setModalModifiers({ ...modalModifiers, [mg.id]: [opt] });
                          } else {
                            if (isSelected) {
                              setModalModifiers({
                                ...modalModifiers,
                                [mg.id]: currentSelected.filter((o: any) => o.name !== opt.name),
                              });
                            } else {
                              setModalModifiers({
                                ...modalModifiers,
                                [mg.id]: [...currentSelected, opt],
                              });
                            }
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                            : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <div className="font-semibold">{opt.name}</div>
                        {opt.price > 0 && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400">
                            +KES {opt.price.toLocaleString()}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Special Instructions Note */}
            <div>
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 block mb-1 uppercase tracking-wide">
                Special Preparation Instructions
              </label>
              <textarea
                rows={2}
                placeholder="E.g. Sauce on the side, allergies, extra spicy, no onions..."
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Quantity and Add Button */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                  className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-stone-700 dark:text-stone-300"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-bold text-sm">{modalQuantity}</span>
                <button
                  type="button"
                  onClick={() => setModalQuantity(modalQuantity + 1)}
                  className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-stone-700 dark:text-stone-300"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-600/30 hover:bg-amber-700 transition-colors"
              >
                <span>Add to Order</span>
                <span>•</span>
                <span>
                  KES{' '}
                  {(
                    ((modalPortion ? modalPortion.price : selectedItemForModal.price) +
                      Object.values(modalModifiers)
                        .flat()
                        .reduce((a, b: any) => a + (b?.price || 0), 0)) *
                    modalQuantity
                  ).toLocaleString()}
                </span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 6. PERSISTENT FLOATING CART BAR (Mobile-First) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-stone-900/60 to-transparent pointer-events-none z-40">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/40 transition-all font-bold"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm">
                  {itemCount}
                </div>
                <div className="text-left">
                  <div className="text-xs uppercase tracking-wider text-amber-100">Your Cart</div>
                  <div className="text-sm">Review & Place Order</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg">KES {subtotal.toLocaleString()}</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 7. CART DRAWER MODAL */}
      <Modal
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        title="Your Table Order"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="divide-y divide-stone-150 dark:divide-stone-800">
            {cartItems.map((item) => (
              <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                    {item.name}
                  </div>
                  {item.portionName && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400">
                      Portion: {item.portionName}
                    </div>
                  )}
                  {item.modifiers?.length > 0 && (
                    <div className="text-[11px] text-stone-500">
                      + {item.modifiers.map((m) => m.name).join(', ')}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-[11px] text-stone-400 italic">"{item.notes}"</div>
                  )}
                  <div className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100 mt-1">
                    KES {item.totalPrice.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-l"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="px-2 text-xs font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-r"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Table Instructions */}
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Table Order Notes
            </label>
            <input
              type="text"
              placeholder="E.g. Please bring drinks first, celebratory meal..."
              value={orderInstructions}
              onChange={(e) => setOrderInstructions(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Subtotal and Tax breakdown */}
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>Subtotal</span>
              <span className="font-mono">KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-stone-500 text-[11px]">
              <span>VAT (16% Included)</span>
              <span className="font-mono">KES {(subtotal * 0.16).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-stone-500 text-[11px]">
              <span>Catering Levy (2% Included)</span>
              <span className="font-mono">KES {(subtotal * 0.02).toFixed(0)}</span>
            </div>
            <div className="border-t border-stone-200 dark:border-stone-700 pt-1.5 flex justify-between font-bold text-sm text-stone-900 dark:text-stone-100">
              <span>Order Total</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">
                KES {subtotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Proceed to Checkout CTA */}
          <button
            onClick={handleProceedToCheckout}
            className="w-full py-3.5 rounded-xl bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-600/30 hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            <span>Proceed to Name, Phone & M-Pesa Checkout</span>
          </button>
        </div>
      </Modal>

      {/* 7.5. GUEST DETAILS & M-PESA STK PUSH CHECKOUT MODAL */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => {
          if (!orderSubmitting) {
            setCheckoutModalOpen(false);
            setStkPushActive(false);
          }
        }}
        title={stkPushActive ? 'Safaricom M-Pesa STK Payment' : 'Guest Details & M-Pesa Checkout'}
        maxWidth="md"
      >
        {!stkPushActive ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
              Key in your Safaricom phone number. An instant M-Pesa STK push PIN prompt will appear on your phone.
            </div>

            {/* Safaricom M-Pesa Phone Number - Primary */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-stone-900 dark:text-stone-100">
                  Safaricom M-Pesa Phone Number *
                </label>
                <button
                  type="button"
                  onClick={() => setCustomerPhone('0712345678')}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-lg transition"
                >
                  ⚡ Use Demo Phone
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 font-bold font-mono">
                  +254
                </span>
                <input
                  type="tel"
                  required
                  autoFocus
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0712345678 or 0112345678"
                  className="w-full pl-14 pr-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">
                Enter your 10-digit number. A prompt for KES {subtotal.toLocaleString()} will appear on your phone screen.
              </span>
            </div>

            {/* Guest Full Name - Optional */}
            <div>
              <label className="font-medium text-stone-700 dark:text-stone-300 block mb-1">
                Guest Name (Optional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={`Defaults to Guest Table ${selectedTable?.table_number || '01'}`}
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Table / Seating Location */}
            <div>
              <label className="font-medium text-stone-700 dark:text-stone-300 block mb-1">
                Table / Seating Location
              </label>
              <input
                type="text"
                value={seatingLocation}
                onChange={(e) => setSeatingLocation(e.target.value)}
                placeholder="e.g. Table 04, Terrace Garden, Bar Counter..."
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Special Instructions */}
            <div>
              <label className="font-medium text-stone-700 dark:text-stone-300 block mb-1">
                Special Kitchen Notes (Optional)
              </label>
              <input
                type="text"
                value={orderInstructions}
                onChange={(e) => setOrderInstructions(e.target.value)}
                placeholder="e.g. Extra serviettes, allergen notes, cutlery..."
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>

            {/* Total Summary */}
            <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-between">
              <div>
                <span className="text-stone-500 text-[11px] block">Payable Total ({itemCount} items)</span>
                <span className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                  KES {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                <Sparkles size={12} />
                <span>Instant STK Push</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleConfirmOrderAndPayStk}
                disabled={orderSubmitting}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {orderSubmitting ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Sending M-Pesa STK Prompt...</span>
                  </>
                ) : (
                  <>
                    <Smartphone size={16} />
                    <span>Pay Now via M-Pesa STK (KES {subtotal.toLocaleString()})</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs"
                >
                  Back to Cart
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrderPayLater}
                  disabled={orderSubmitting}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-xs transition"
                >
                  Send to Kitchen (Pay Later)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STK PROMPT IN PROGRESS / VERIFIED SCREEN */
          <div className="space-y-5 text-center py-4">
            {stkStatus?.verified ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    Payment Verified & Received!
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Your order <span className="font-bold text-stone-800 dark:text-stone-200">{stkStatus?.orderNumber}</span> has been dispatched to the Sironi kitchen cook stations.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono space-y-1">
                  <div>
                    Sironi Restaurants — <span className="font-bold text-stone-900 dark:text-stone-100">Table {stkStatus?.tableNumber || selectedTable?.table_number}</span>
                  </div>
                  <div>
                    Safaricom Receipt: <span className="font-bold text-amber-600">{stkStatus?.receipt || 'CONFIRMED'}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <a
                    href={`/api/orders/${stkStatus?.orderId || stkStatus?.orderNumber}/receipt-pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition"
                  >
                    <FileText size={15} className="text-amber-400" />
                    <span>Download Sironi Receipt (PDF)</span>
                  </a>
                  <button
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      setStkPushActive(false);
                      setViewingTracker(true);
                    }}
                    className="flex-1 py-3 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Track in Kitchen</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center mx-auto animate-pulse">
                  <Smartphone size={32} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    STK Push Prompt Dispatched!
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-xs mx-auto">
                    Please check your phone (<span className="font-mono font-bold">{stkStatus?.phone}</span>) and enter your Safaricom M-Pesa PIN for KES {stkStatus?.amount?.toLocaleString()}.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[11px] space-y-1 text-left">
                  <div className="flex justify-between text-stone-500">
                    <span>Order Number</span>
                    <span className="font-mono font-bold text-stone-800 dark:text-stone-200">{stkStatus?.orderNumber}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Amount</span>
                    <span className="font-mono font-bold text-amber-600">KES {stkStatus?.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Status</span>
                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                      <RefreshCw size={10} className="animate-spin" />
                      <span>Awaiting PIN...</span>
                    </span>
                  </div>
                </div>

                {/* Instant Simulator Button */}
                <button
                  type="button"
                  onClick={handleManualVerifyStk}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>⚡ Simulate Customer Entered PIN (Confirm Payment)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCheckoutModalOpen(false);
                    setStkPushActive(false);
                    setViewingTracker(true);
                  }}
                  className="text-stone-400 hover:text-stone-600 text-xs block mx-auto"
                >
                  View Order Status in Background
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 8. CALL WAITER / ASSISTANCE MODAL */}
      <Modal
        isOpen={assistanceModalOpen}
        onClose={() => setAssistanceModalOpen(false)}
        title="Guest Assistance"
        maxWidth="sm"
      >
        <div className="space-y-3">
          {assistanceSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold text-center border border-emerald-200">
              {assistanceSuccess}
            </div>
          ) : (
            <>
              <p className="text-xs text-stone-500">
                Need anything at {selectedTable?.name || 'your table'}? Tap below and our service team will be right over.
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'call_waiter', label: 'Call Waiter', desc: 'General service' },
                  { id: 'request_water', label: 'Fresh Water', desc: 'Still or Sparkling' },
                  { id: 'request_bill', label: 'Bring Bill', desc: 'Settlement' },
                  { id: 'clean_table', label: 'Table Cleaning', desc: 'Clear plates' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleRequestAssistance(item.id)}
                    className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 text-left hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors"
                  >
                    <div className="font-bold text-xs text-stone-900 dark:text-stone-100">{item.label}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* 9. BILL & M-PESA PAYMENT MODAL */}
      <Modal
        isOpen={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        title={`Table ${selectedTable?.table_number} Bill & Payment`}
        maxWidth="md"
      >
        {billingData && (
          <div className="space-y-4 text-xs">
            {mpesaSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                {mpesaSuccess}
              </div>
            )}

            {/* Bill items summary */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 space-y-2">
              <div className="font-bold text-stone-900 dark:text-stone-100 flex justify-between">
                <span>Session: {billingData.session.session_code}</span>
                <span>{billingData.orders?.length} Orders Placed</span>
              </div>

              <div className="border-t border-stone-200 dark:border-stone-700 pt-2 space-y-1">
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Subtotal</span>
                  <span className="font-mono">KES {billingData.pricing.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Total Paid</span>
                  <span className="font-mono text-emerald-600">KES {billingData.pricing.totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-stone-900 dark:text-stone-100 pt-1 border-t border-stone-200 dark:border-stone-700">
                  <span>Outstanding Balance</span>
                  <span className="font-mono text-amber-600">
                    KES {billingData.pricing.balance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Pay via M-Pesa STK Push */}
            {billingData.pricing.balance > 0 ? (
              <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                    M
                  </div>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    Safaricom M-Pesa STK Push
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                    Enter Safaricom Mobile Number
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="tel"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      placeholder="0712345678"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSendMpesaStk}
                  disabled={mpesaLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/30 transition-colors flex items-center justify-center gap-2"
                >
                  {mpesaLoading ? (
                    <span>Sending STK Prompt to Phone...</span>
                  ) : (
                    <span>Pay KES {billingData.pricing.balance.toLocaleString()} via M-Pesa</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-center border border-emerald-200">
                Bill Settled in Full. Thank you for dining with us at Sironi Restaurants.
              </div>
            )}
            {/* Download Printable Receipt Button */}
            <div className="pt-2">
              <a
                href={`/api/tables/${selectedTable?.id}/receipt-pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition"
              >
                <FileText size={14} className="text-amber-400" />
                <span>Download Sironi Table {selectedTable?.table_number} Bill & Receipt (PDF)</span>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

