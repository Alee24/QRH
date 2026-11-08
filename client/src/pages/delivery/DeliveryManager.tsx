import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Modal } from '../../components/Modal.js';
import {
  Truck,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Sliders,
  DollarSign,
  ShieldCheck,
  Check,
  X,
  Navigation,
  FileText
} from 'lucide-react';

interface DeliveryOrder {
  id: string;
  order_id: string;
  order_number: string;
  total_amount: number;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  delivery_notes?: string;
  delivery_fee: number;
  status: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
  zone_name?: string;
  assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  proof_of_delivery_note?: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate: string;
  status: string;
  rating: number;
  total_deliveries: number;
}

interface DeliveryZone {
  id: string;
  name: string;
  code: string;
  min_order_amount: number;
  base_fee: number;
  per_km_fee: number;
  estimated_minutes: number;
}

export const DeliveryManager: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Zone Modal
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [zoneBaseFee, setZoneBaseFee] = useState('150');
  const [zonePerKm, setZonePerKm] = useState('25');
  const [zoneTime, setZoneTime] = useState('35');

  // Complete / Proof Modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [proofNote, setProofNote] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, driversRes, zonesRes, dashboardRes] = await Promise.all([
        apiFetch<DeliveryOrder[]>(`/delivery/orders?status=${selectedStatus}`),
        apiFetch<Driver[]>('/delivery/drivers'),
        apiFetch<DeliveryZone[]>('/delivery/zones'),
        apiFetch<any>('/delivery/dashboard'),
      ]);
      setDeliveries(ordersRes);
      setDrivers(driversRes);
      setZones(zonesRes);
      setMetrics(dashboardRes.metrics);
    } catch (err) {
      console.error('Failed to load delivery data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = async (deliveryId: string, driverId: string) => {
    if (!driverId) return;
    try {
      await apiFetch('/delivery/assign', {
        method: 'POST',
        body: JSON.stringify({ delivery_id: deliveryId, driver_id: driverId }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Driver assignment failed.');
    }
  };

  const handlePickup = async (deliveryId: string) => {
    try {
      await apiFetch(`/delivery/orders/${deliveryId}/pickup`, { method: 'POST' });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!completingId) return;
    try {
      await apiFetch(`/delivery/orders/${completingId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ proof_of_delivery_note: proofNote || 'Customer received package at front door.' }),
      });
      setCompleteModalOpen(false);
      setCompletingId(null);
      setProofNote('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateZone = async () => {
    if (!zoneName || !zoneCode) return;
    try {
      await apiFetch('/delivery/zones', {
        method: 'POST',
        body: JSON.stringify({
          name: zoneName,
          code: zoneCode,
          base_fee: parseFloat(zoneBaseFee),
          per_km_fee: parseFloat(zonePerKm),
          estimated_minutes: parseInt(zoneTime, 10),
        }),
      });
      setZoneModalOpen(false);
      setZoneName('');
      setZoneCode('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.order_number.toLowerCase().includes(q) ||
      d.recipient_name.toLowerCase().includes(q) ||
      d.delivery_address.toLowerCase().includes(q) ||
      (d.driver_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-3 sm:p-5 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* 1. DISPATCH KPI STRIP */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Dispatches</span>
              <span className="text-xl font-black text-stone-900 dark:text-stone-100 mt-0.5 block">{metrics.total_deliveries}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-amber-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Pending Driver</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">{metrics.unassigned}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-blue-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">Assigned</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 block">{metrics.assigned}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-purple-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider block">In Transit</span>
              <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5 block">{metrics.in_transit}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Delivered Today</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{metrics.delivered_today}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Delivery Fees</span>
              <span className="text-sm font-black text-amber-700 dark:text-amber-400 mt-1 block">
                KES {metrics.total_delivery_revenue.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* 2. CONTROLS & ZONE CREATOR */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase mr-1">Status:</span>
            {['all', 'pending_dispatch', 'assigned', 'in_transit', 'delivered', 'failed'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors capitalize ${
                  selectedStatus === st
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={13} />
              <input
                type="text"
                placeholder="Search address, driver, order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setZoneModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs"
            >
              <MapPin size={13} />
              <span>Add Zone</span>
            </button>
          </div>
        </div>

        {/* 3. DISPATCH QUEUE & ACTIVE DELIVERIES GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Delivery Orders Feed (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Truck size={16} className="text-amber-600" />
                <span>Live Dispatch Queue ({filteredDeliveries.length})</span>
              </h2>
            </div>

            {filteredDeliveries.length === 0 ? (
              <div className="p-12 text-center text-xs text-stone-400 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80">
                No deliveries matching the selected criteria.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredDeliveries.map((del) => (
                  <div
                    key={del.id}
                    className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100 font-mono">
                            {del.order_number}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            del.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            del.status === 'in_transit' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                            del.status === 'assigned' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {del.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                          <span className="font-bold text-stone-800 dark:text-stone-200">{del.recipient_name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-stone-500">
                            <Phone size={11} /> {del.recipient_phone}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-sm text-amber-600 dark:text-amber-400 block">
                          KES {del.total_amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          Fee: KES {del.delivery_fee}
                        </span>
                      </div>
                    </div>

                    {/* Address & Zone */}
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 text-xs text-stone-600 dark:text-stone-300 flex items-start gap-2">
                      <MapPin size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">{del.delivery_address}</span>
                        {del.delivery_notes && (
                          <span className="text-[11px] text-stone-400 block mt-0.5">Note: {del.delivery_notes}</span>
                        )}
                      </div>
                    </div>

                    {/* Driver Assignment & Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-500 text-[11px]">Assigned Driver:</span>
                        {del.driver_name ? (
                          <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                            <User size={12} className="text-purple-600" />
                            {del.driver_name} ({del.vehicle_plate || 'Motorcycle'})
                          </span>
                        ) : (
                          <select
                            onChange={(e) => handleAssignDriver(del.id, e.target.value)}
                            defaultValue=""
                            className="text-xs p-1 rounded-lg bg-stone-50 dark:bg-stone-800 border border-amber-500/50 text-stone-800 dark:text-stone-200 font-bold"
                          >
                            <option value="" disabled>-- Assign Available Driver --</option>
                            {drivers.map((drv) => (
                              <option key={drv.id} value={drv.id}>
                                {drv.name} ({drv.status} - ★{drv.rating})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* State actions */}
                      <div className="flex items-center gap-1.5">
                        {del.status === 'assigned' && (
                          <button
                            onClick={() => handlePickup(del.id)}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold text-xs"
                          >
                            Confirm Pickup
                          </button>
                        )}
                        {del.status === 'in_transit' && (
                          <button
                            onClick={() => {
                              setCompletingId(del.id);
                              setCompleteModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Active Drivers & Delivery Zones (1 col) */}
          <div className="space-y-4">
            {/* Drivers List */}
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs space-y-3">
              <h3 className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <User size={14} className="text-purple-600" />
                <span>Driver Fleet ({drivers.length})</span>
              </h3>

              <div className="space-y-2">
                {drivers.map((drv) => (
                  <div key={drv.id} className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-800 dark:text-stone-200 block">{drv.name}</span>
                      <span className="text-[10px] text-stone-400">
                        {drv.vehicle_type} ({drv.vehicle_plate}) • ★{drv.rating}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                      drv.status === 'available' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
                    }`}>
                      {drv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Zones */}
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs space-y-3">
              <h3 className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <MapPin size={14} className="text-amber-600" />
                <span>Configured Delivery Zones ({zones.length})</span>
              </h3>

              <div className="space-y-2 text-xs">
                {zones.map((z) => (
                  <div key={z.id} className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-800 dark:text-stone-200 block">{z.name}</span>
                      <span className="text-[10px] text-stone-400">Est. Time: ~{z.estimated_minutes} mins</span>
                    </div>
                    <span className="font-black text-amber-600 dark:text-amber-400">
                      KES {z.base_fee}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PROOF OF DELIVERY MODAL */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Complete Delivery & Capture Proof"
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-500">
            Confirm that the customer has received the food package in good condition.
          </p>

          <div>
            <label className="font-bold block mb-1">Proof of Delivery Note / Recipient</label>
            <input
              type="text"
              placeholder="e.g. Handed to customer at door / Signed by reception"
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
              onClick={handleCompleteDelivery}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Confirm Delivery Complete
            </button>
          </div>
        </div>
      </Modal>

      {/* 5. ADD ZONE MODAL */}
      <Modal
        isOpen={zoneModalOpen}
        onClose={() => setZoneModalOpen(false)}
        title="Add New Delivery Zone"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">Zone Name *</label>
            <input
              type="text"
              placeholder="e.g. Gigiri & Runda Diplomatic"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Zone Code *</label>
              <input
                type="text"
                placeholder="GIG-RND"
                value={zoneCode}
                onChange={(e) => setZoneCode(e.target.value)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Base Delivery Fee (KES)</label>
              <input
                type="number"
                value={zoneBaseFee}
                onChange={(e) => setZoneBaseFee(e.target.value)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setZoneModalOpen(false)}
              className="flex-1 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateZone}
              className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Save Zone
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

