import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Modal } from '../../components/Modal.js';
import {
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  Navigation,
  FileCheck,
  AlertTriangle,
  History,
  User,
  ShieldCheck
} from 'lucide-react';

export const DriverPortal: React.FC = () => {
  const [driver, setDriver] = useState<any | null>(null);
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Complete / Proof modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [proofNote, setProofNote] = useState('');

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/delivery/driver/me');
      setDriver(data.driver);
      setAssignedOrders(data.assigned_orders || []);
      setHistory(data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async (deliveryId: string) => {
    try {
      await apiFetch(`/delivery/orders/${deliveryId}/pickup`, { method: 'POST' });
      loadDriverData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleComplete = async () => {
    if (!completingId) return;
    try {
      await apiFetch(`/delivery/orders/${completingId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ proof_of_delivery_note: proofNote || 'Handed to customer' }),
      });
      setCompleteModalOpen(false);
      setCompletingId(null);
      setProofNote('');
      loadDriverData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 p-3 sm:p-5 font-sans">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* 1. DRIVER PROFILE CARD */}
        {driver && (
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-md">
                <Truck size={20} />
              </div>
              <div>
                <h1 className="font-extrabold text-base text-stone-900 dark:text-stone-100 tracking-tight leading-none">
                  {driver.name}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                  <span>{driver.vehicle_type} ({driver.vehicle_plate})</span>
                  <span>•</span>
                  <span className="text-amber-500 font-bold">★ {driver.rating}</span>
                </div>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {driver.status}
            </span>
          </div>
        )}

        {/* 2. ACTIVE ASSIGNED DELIVERIES */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Navigation size={16} className="text-purple-600" />
              <span>Active Assigned Orders ({assignedOrders.length})</span>
            </h2>
            <button
              onClick={loadDriverData}
              className="text-xs text-purple-600 hover:underline font-bold"
            >
              Refresh
            </button>
          </div>

          {assignedOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-400 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80">
              <Truck size={28} className="mx-auto mb-2 text-stone-300 dark:text-stone-700" />
              <p className="font-bold text-stone-600 dark:text-stone-300">No active delivery assignments</p>
              <p className="text-[11px] mt-0.5">Stay near dispatch. When dispatch assigns you an order, it will appear here.</p>
            </div>
          ) : (
            assignedOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-sm font-mono text-stone-900 dark:text-stone-100">
                      {ord.order_number}
                    </span>
                    <span className="text-xs text-stone-500 block mt-0.5">
                      Recipient: <strong className="text-stone-800 dark:text-stone-200">{ord.recipient_name}</strong>
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    ord.status === 'in_transit' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {ord.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 space-y-1.5 text-xs">
                  <div className="flex items-start gap-1.5 text-stone-700 dark:text-stone-300">
                    <MapPin size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{ord.delivery_address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <Phone size={13} className="text-purple-600" />
                    <a href={`tel:${ord.recipient_phone}`} className="font-bold text-purple-600 underline">
                      {ord.recipient_phone}
                    </a>
                  </div>
                </div>

                {/* Driver Action Buttons */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex gap-2">
                  {ord.status === 'assigned' && (
                    <button
                      onClick={() => handlePickup(ord.id)}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
                    >
                      Confirm Pickup at Restaurant
                    </button>
                  )}
                  {ord.status === 'in_transit' && (
                    <button
                      onClick={() => {
                        setCompletingId(ord.id);
                        setCompleteModalOpen(true);
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                    >
                      Confirm Delivered & Capture Proof
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 3. RECENT COMPLETED DELIVERIES */}
        {history.length > 0 && (
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs space-y-3">
            <h3 className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <History size={14} className="text-stone-500" />
              <span>Completed Deliveries History ({history.length})</span>
            </h3>

            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {history.map((h) => (
                <div key={h.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-800 dark:text-stone-200">{h.order_number}</span>
                    <span className="text-[11px] text-stone-400 block">{h.recipient_name} • {h.delivery_address}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Delivered
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PROOF MODAL */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Delivery Confirmation & Proof"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">Recipient Name / Note *</label>
            <input
              type="text"
              placeholder="e.g. Handed to customer (Jane Doe) at Door"
              value={proofNote}
              onChange={(e) => setProofNote(e.target.value)}
              className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setCompleteModalOpen(false)}
              className="flex-1 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Confirm Delivered
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

