import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { useSocket } from '../../context/SocketContext.js';
import { soundEffects } from '../../utils/audioChime.js';
import { TableStatusBadge } from '../../components/Badge.js';
import { Modal } from '../../components/Modal.js';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  RotateCw,
  Printer,
  Percent,
  CheckCircle,
  Users,
  Search,
  Sparkles,
  Receipt,
  Clock,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export const CashierPOS: React.FC = () => {
  const { socket } = useSocket();

  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [billingData, setBillingData] = useState<any | null>(null);
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'room_charge'>('cash');
  const [payAmount, setPayAmount] = useState<string>('');
  const [tenderCash, setTenderCash] = useState<number>(0);
  const [mpesaPhone, setMpesaPhone] = useState('0712345678');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  // Discount Modal
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<string>('');
  const [discountReason, setDiscountReason] = useState('VIP Guest 10%');

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  useEffect(() => {
    loadTables();
    loadRooms();
  }, []);

  const loadTables = async () => {
    try {
      const data = await apiFetch<any[]>('/tables');
      setTables(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const data = await apiFetch<any[]>('/hotel/rooms');
      setHotelRooms(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Socket updates
  useEffect(() => {
    if (!socket) return;
    socket.emit('join:pos');

    const handlePosOrder = () => {
      soundEffects.playOrderBell();
      loadTables();
      if (selectedTable) selectSession(selectedTable);
    };

    const handleTableStatus = (data: any) => {
      setTables((prev) => prev.map((t) => (t.id === data.tableId ? { ...t, status: data.status } : t)));
    };

    const handlePaymentSettled = () => {
      soundEffects.playReadyChime();
      loadTables();
      if (selectedTable) selectSession(selectedTable);
    };

    socket.on('pos:order_received', handlePosOrder);
    socket.on('pos:table_status', handleTableStatus);
    socket.on('pos:payment_settled', handlePaymentSettled);

    return () => {
      socket.off('pos:order_received', handlePosOrder);
      socket.off('pos:table_status', handleTableStatus);
      socket.off('pos:payment_settled', handlePaymentSettled);
    };
  }, [socket, selectedTable]);

  // Select Table to view Consolidated Bill
  const selectSession = async (table: any) => {
    setSelectedTable(table);
    if (!table.active_session_id) {
      setBillingData(null);
      return;
    }
    try {
      const bill = await apiFetch<any>(`/cashier/session/${table.active_session_id}`);
      setBillingData(bill);
      setPayAmount(String(bill.pricing.balance));
      setTenderCash(bill.pricing.balance);
    } catch (err) {
      console.error(err);
      setBillingData(null);
    }
  };

  // Process Payment
  const handleProcessPayment = async () => {
    if (!selectedTable?.active_session_id || !payAmount) return;
    setIsProcessing(true);

    try {
      if (payMethod === 'mpesa') {
        // Send STK Push and simulate confirmation
        const stk = await apiFetch<any>('/payments/mpesa/stk-push', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: selectedTable.active_session_id,
            phoneNumber: mpesaPhone,
            amount: Number(payAmount),
          }),
        });

        await apiFetch('/payments/mpesa/verify', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: selectedTable.active_session_id,
            checkoutRequestId: stk.checkoutRequestId,
          }),
        });
      } else {
        await apiFetch(`/cashier/session/${selectedTable.active_session_id}/pay`, {
          method: 'POST',
          body: JSON.stringify({
            amount: Number(payAmount),
            method: payMethod,
            roomId: payMethod === 'room_charge' ? selectedRoomId : undefined,
            notes: `Cashier POS settlement`,
          }),
        });
      }

      setPaymentSuccess(`Payment of KES ${Number(payAmount).toLocaleString()} recorded successfully!`);
      soundEffects.playReadyChime();

      setTimeout(() => {
        setPayModalOpen(false);
        setPaymentSuccess(null);
        selectSession(selectedTable);
        loadTables();
      }, 1500);
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply Discount
  const handleApplyDiscount = async () => {
    if (!selectedTable?.active_session_id || !discountAmount) return;
    try {
      await apiFetch(`/cashier/session/${selectedTable.active_session_id}/discount`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(discountAmount),
          reason: discountReason,
        }),
      });
      setDiscountModalOpen(false);
      selectSession(selectedTable);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Mark for Cleaning
  const handleMarkCleaning = async () => {
    if (!selectedTable) return;
    try {
      await apiFetch(`/cashier/table/${selectedTable.id}/mark-cleaning`, { method: 'POST' });
      loadTables();
      setSelectedTable((prev: any) => (prev ? { ...prev, status: 'cleaning' } : null));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Confirm Cleaning -> Table Available!
  const handleConfirmCleaning = async () => {
    if (!selectedTable) return;
    try {
      await apiFetch(`/cashier/table/${selectedTable.id}/confirm-cleaning`, { method: 'POST' });
      loadTables();
      setSelectedTable(null);
      setBillingData(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter counters
  const occupiedTables = tables.filter((t) => t.status !== 'available' && t.status !== 'maintenance');
  const totalOutstanding = tables.reduce((acc, t) => acc + (t.session_balance || 0), 0);

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 1. CASHIER POS TOP KPI STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
            <span className="text-xs text-stone-500 font-semibold block uppercase">
              Occupied Tables
            </span>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1 block">
              {occupiedTables.length} / {tables.length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
            <span className="text-xs text-stone-500 font-semibold block uppercase">
              Active Table Balances
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
              KES {totalOutstanding.toLocaleString()}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
            <span className="text-xs text-stone-500 font-semibold block uppercase">
              Selected Session
            </span>
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1 block">
              {selectedTable ? `Table ${selectedTable.table_number}` : 'None'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-500 font-semibold block uppercase">
                Payment Systems
              </span>
              <span className="text-sm font-bold text-emerald-600 block mt-1">
                M-Pesa STK & Card Ready
              </span>
            </div>
            <button
              onClick={() => loadTables()}
              className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300"
              title="Refresh"
            >
              <RotateCw size={16} />
            </button>
          </div>
        </div>

        {/* 2. SPLIT VIEW: FLOOR TILES ON LEFT, CONSOLIDATED BILL ON RIGHT (Screenshot 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: TABLE FLOOR GRID (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                Restaurant Floor Tables
              </h2>
              <span className="text-xs text-stone-500 font-medium">
                Tap table to inspect session & orders
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {tables.map((t) => {
                const isSelected = selectedTable?.id === t.id;
                const hasBalance = t.session_balance > 0;

                return (
                  <div
                    key={t.id}
                    onClick={() => selectSession(t)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-32 ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 shadow-md ring-2 ring-amber-500/20'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-lg font-black text-stone-900 dark:text-stone-100">
                          T{t.table_number}
                        </span>
                        <span className="text-[10px] text-stone-400 block">{t.name}</span>
                      </div>
                      <TableStatusBadge status={t.status} size="sm" />
                    </div>

                    <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs">
                      {hasBalance ? (
                        <div className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                          KES {t.session_balance.toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-stone-400 text-[11px] font-medium">No Balance</span>
                      )}
                      <span className="text-[10px] text-stone-400">{t.capacity} Seats</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: CONSOLIDATED SESSION BILLING PANEL (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col min-h-[550px]">
            {selectedTable && billingData ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {/* Bill Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
                    <div>
                      <h3 className="font-black text-lg text-stone-900 dark:text-stone-100">
                        Table {selectedTable.table_number} Bill
                      </h3>
                      <div className="text-xs text-stone-500 mt-0.5">
                        Session: {billingData.session.session_code} • {billingData.orders?.length} Orders Placed
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setReceiptModalOpen(true)}
                        className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300"
                        title="Print Thermal Receipt"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => setDiscountModalOpen(true)}
                        className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 hover:bg-amber-200"
                        title="Apply Discount"
                      >
                        <Percent size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Consolidated Orders and Dishes */}
                  <div className="py-4 space-y-4 max-h-72 overflow-y-auto">
                    {billingData.orders?.map((ord: any) => (
                      <div key={ord.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                          <span>{ord.order_number} ({ord.source})</span>
                          <span>{new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {ord.items?.map((it: any) => (
                          <div key={it.id} className="flex justify-between items-center text-xs">
                            <span className="text-stone-800 dark:text-stone-200">
                              <span className="font-bold mr-1.5">{it.quantity}x</span>
                              {it.item_name} {it.portion_name && `(${it.portion_name})`}
                            </span>
                            <span className="font-mono text-stone-600 dark:text-stone-400 font-medium">
                              KES {it.total_price.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotals, Tax & Total */}
                <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-2">
                  <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
                    <span>Subtotal</span>
                    <span className="font-mono">KES {billingData.pricing.subtotal.toLocaleString()}</span>
                  </div>

                  {billingData.pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                      <span>Discount Applied</span>
                      <span className="font-mono">- KES {billingData.pricing.discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span>VAT (16% Included)</span>
                    <span className="font-mono">KES {billingData.pricing.vatAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span>Catering Levy (2% Included)</span>
                    <span className="font-mono">KES {billingData.pricing.cateringLevyAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
                    <span>Amount Paid</span>
                    <span className="font-mono text-emerald-600 font-bold">
                      KES {billingData.pricing.totalPaid.toLocaleString()}
                    </span>
                  </div>

                  <div className="border-t border-stone-200 dark:border-stone-700 pt-2 flex justify-between items-center">
                    <span className="text-sm font-black text-stone-900 dark:text-stone-100 uppercase">
                      Balance Due
                    </span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                      KES {billingData.pricing.balance.toLocaleString()}
                    </span>
                  </div>

                  {/* Actions based on balance */}
                  {billingData.pricing.balance > 0 ? (
                    <button
                      onClick={() => setPayModalOpen(true)}
                      className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard size={17} />
                      <span>Process Payment (KES {billingData.pricing.balance.toLocaleString()})</span>
                    </button>
                  ) : (
                    <div className="space-y-2 pt-2">
                      <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center border border-emerald-200">
                        ✓ Bill Settled in Full
                      </div>

                      {selectedTable.status !== 'cleaning' ? (
                        <button
                          onClick={handleMarkCleaning}
                          className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow transition-colors"
                        >
                          Mark Table for Cleaning
                        </button>
                      ) : (
                        <button
                          onClick={handleConfirmCleaning}
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-colors"
                        >
                          Confirm Cleaning (Set Available)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-400">
                <Receipt size={40} className="mb-3 text-stone-300" />
                <h4 className="font-bold text-stone-700 dark:text-stone-300 text-sm">
                  No Active Session Selected
                </h4>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  Click on an occupied or ordering table on the left to view the consolidated bill, process payments, or print receipts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. PAYMENT MODAL */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={`Settle Bill - Table ${selectedTable?.table_number}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {paymentSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-center border border-emerald-200">
              {paymentSuccess}
            </div>
          ) : (
            <>
              {/* Payment Methods Tabs */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'room_charge', label: 'Room Charge', icon: Building },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethod(m.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        payMethod === m.id
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                          : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-[11px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Amount to pay */}
              <div>
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Payment Amount (KES)
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-sm font-bold text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Cash specific: Tender & Change calculator */}
              {payMethod === 'cash' && (
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 space-y-2">
                  <span className="font-bold text-stone-800 dark:text-stone-200 block">
                    Quick Cash Tender
                  </span>
                  <div className="flex gap-2">
                    {[500, 1000, 2000, 5000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTenderCash(val)}
                        className="flex-1 py-1.5 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-mono font-bold"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-200 dark:border-stone-700 font-bold">
                    <span>Change Due:</span>
                    <span className="font-mono text-emerald-600">
                      KES {Math.max(0, tenderCash - Number(payAmount)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* M-Pesa specific */}
              {payMethod === 'mpesa' && (
                <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-500/30 space-y-2">
                  <label className="font-bold text-stone-800 dark:text-stone-200 block">
                    Safaricom Phone Number for STK Push
                  </label>
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="0712345678"
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-emerald-300 font-mono"
                  />
                  <p className="text-[10px] text-stone-500">
                    Sends Daraja STK Push prompt directly to customer's mobile phone with amount KES {Number(payAmount).toLocaleString()}.
                  </p>
                </div>
              )}

              {/* Hotel Room Charge specific */}
              {payMethod === 'room_charge' && (
                <div className="p-3 rounded-xl bg-purple-50/40 border border-purple-500/30 space-y-2">
                  <label className="font-bold text-stone-800 dark:text-stone-200 block">
                    Select Occupied Hotel Room
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-purple-300 font-semibold"
                  >
                    <option value="">-- Choose Hotel Room --</option>
                    {hotelRooms
                      .filter((r) => r.is_occupied)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          Room {r.room_number} - {r.guest_name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Submit Payment Button */}
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={isProcessing || !payAmount}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? <span>Authorizing Payment...</span> : <span>Confirm & Complete Payment</span>}
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* 4. DISCOUNT MODAL */}
      <Modal
        isOpen={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        title="Apply Discount to Session"
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Discount Amount (KES)
            </label>
            <input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              placeholder="E.g. 500"
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Reason / Authorization
            </label>
            <select
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            >
              <option value="VIP Guest 10%">VIP Guest Discount</option>
              <option value="Manager Courtesy">Manager Courtesy</option>
              <option value="Staff Dining 20%">Staff Privilege (20%)</option>
              <option value="Promotional Voucher">Promotional Voucher</option>
            </select>
          </div>

          <button
            onClick={handleApplyDiscount}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow"
          >
            Apply Discount
          </button>
        </div>
      </Modal>

      {/* 5. PRINTABLE THERMAL RECEIPT MODAL */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Tax Invoice & Thermal Receipt"
        maxWidth="sm"
      >
        {billingData && (
          <div className="space-y-3 font-mono text-[11px] text-stone-800 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div className="text-center space-y-0.5">
              <div className="font-bold text-sm">SIRONI RESTAURANTS</div>
              <div>Westlands / Kilimani, Nairobi</div>
              <div>Tel: +254 700 123 456</div>
              <div>PIN: P051239842M</div>
              <div className="border-b border-dashed border-stone-400 my-2" />
            </div>

            <div className="space-y-1">
              <div>Table: {selectedTable?.table_number} ({selectedTable?.name})</div>
              <div>Session: {billingData.session.session_code}</div>
              <div>Date: {new Date().toLocaleString()}</div>
              <div>Cashier: POS Terminal #1</div>
              <div className="border-b border-dashed border-stone-400 my-2" />
            </div>

            {/* Items */}
            <div className="space-y-1">
              {billingData.orders?.flatMap((o: any) => o.items || []).map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.quantity}x {it.item_name}</span>
                  <span>KES {it.total_price.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-b border-dashed border-stone-400 my-2" />
            </div>

            {/* Totals */}
            <div className="space-y-1 font-bold">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>KES {billingData.pricing.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-normal">
                <span>VAT 16%:</span>
                <span>KES {billingData.pricing.vatAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-normal">
                <span>CATERING LEVY 2%:</span>
                <span>KES {billingData.pricing.cateringLevyAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-stone-300">
                <span>TOTAL PAID:</span>
                <span>KES {billingData.pricing.totalPaid.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center pt-3 text-[10px] text-stone-500">
              *** Thank You For Dining With Us ***<br />
              Powered by Sironi Restaurants POS
            </div>

            <button
              onClick={() => window.print()}
              className="w-full mt-3 py-2.5 rounded-xl bg-stone-900 text-white font-sans font-bold text-xs"
            >
              Print Receipt
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

