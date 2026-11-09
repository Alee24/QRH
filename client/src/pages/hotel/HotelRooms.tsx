import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Modal } from '../../components/Modal.js';
import {
  Building2,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Search,
  Plus,
  RotateCw,
  LogOut,
  LogIn,
  KeyRound,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface HotelRoom {
  id: string;
  room_number: string;
  floor: number;
  is_occupied: number;
  guest_name?: string;
  check_out_date?: string;
  verification_pin?: string;
  billing_authorized: number;
}

export const HotelRooms: React.FC = () => {
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'occupied' | 'vacant'>('all');

  // Modals
  const [addRoomModalOpen, setAddRoomModalOpen] = useState(false);
  const [newRoomNum, setNewRoomNum] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('1');

  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [guestName, setGuestName] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guestPin, setGuestPin] = useState('');

  const [chargesModalOpen, setChargesModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsData, chargesData] = await Promise.all([
        apiFetch<HotelRoom[]>('/hotel/rooms'),
        apiFetch<any[]>('/hotel/charges').catch(() => []),
      ]);
      setRooms(roomsData);
      setCharges(chargesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNum.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch('/hotel/rooms', {
        method: 'POST',
        body: JSON.stringify({
          roomNumber: newRoomNum.trim(),
          floor: Number(newRoomFloor) || 1,
        }),
      });
      setAddRoomModalOpen(false);
      setNewRoomNum('');
      setNewRoomFloor('1');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create room.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !guestName.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch(`/hotel/rooms/${selectedRoom.id}/guest`, {
        method: 'POST',
        body: JSON.stringify({
          guestName: guestName.trim(),
          checkOutDate: checkOutDate || undefined,
          verificationPin: guestPin.trim() || undefined,
        }),
      });
      setCheckInModalOpen(false);
      setSelectedRoom(null);
      setGuestName('');
      setCheckOutDate('');
      setGuestPin('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to check in guest.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (room: HotelRoom) => {
    if (!confirm(`Confirm check-out for Room ${room.room_number} (${room.guest_name})?`)) return;
    try {
      await apiFetch(`/hotel/rooms/${room.id}/checkout`, { method: 'POST' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to check out room.');
    }
  };

  const occupiedCount = rooms.filter((r) => r.is_occupied === 1).length;
  const vacantCount = rooms.length - occupiedCount;
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedCount / rooms.length) * 100) : 0;
  const totalChargesAmount = charges.reduce((acc, c) => acc + (c.amount || 0), 0);

  const filteredRooms = rooms.filter((r) => {
    const matchSearch =
      r.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.guest_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      `floor ${r.floor}`.includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;
    if (statusFilter === 'occupied') return r.is_occupied === 1;
    if (statusFilter === 'vacant') return r.is_occupied === 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-3 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Building2 size={22} />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
                Hotel Rooms PMS Integration
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Guest room directory, occupancy status, room charge authorization, and dining folio billing
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setChargesModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs whitespace-nowrap transition-colors"
            >
              <FileText size={14} className="text-amber-600" />
              <span>Folio Charges ({charges.length})</span>
            </button>

            <button
              onClick={() => setAddRoomModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-colors"
            >
              <Plus size={15} />
              <span>Add Hotel Room</span>
            </button>
          </div>
        </div>

        {/* 1. KPI SUMMARY STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider block">Total Rooms</span>
            <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 mt-1 block">{rooms.length}</span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">Hotel Room Inventory</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-wider block">Occupied Rooms</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{occupiedCount}</span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">{vacantCount} Vacant Rooms</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold text-blue-500 uppercase tracking-wider block">Occupancy Rate</span>
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">{occupancyRate}%</span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">Live Room Utilization</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-wider block">Total Room Charges</span>
            <span className="text-base sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block font-mono">
              KES {totalChargesAmount.toLocaleString()}
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">{charges.length} Posted Folios</span>
          </div>
        </div>

        {/* 2. SEARCH & OCCUPANCY FILTER BAR */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0 no-scrollbar">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                statusFilter === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              All Rooms ({rooms.length})
            </button>
            <button
              onClick={() => setStatusFilter('occupied')}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                statusFilter === 'occupied'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              Occupied ({occupiedCount})
            </button>
            <button
              onClick={() => setStatusFilter('vacant')}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                statusFilter === 'vacant'
                  ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              Vacant ({vacantCount})
            </button>
          </div>

          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
            <input
              type="text"
              placeholder="Search room #, guest name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* 3. ROOMS DIRECTORY GRID */}
        {loading ? (
          <div className="py-16 text-center text-xs text-stone-400 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80">
            <RotateCw size={24} className="animate-spin mx-auto mb-2 text-amber-600" />
            <span>Loading rooms directory...</span>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80">
            <Building2 size={32} className="mx-auto mb-2 text-stone-300 dark:text-stone-700" />
            <p className="text-sm font-bold text-stone-700 dark:text-stone-300">No rooms match your filter.</p>
            <p className="text-xs text-stone-400 mt-1">Try another search keyword or add a new room.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col justify-between hover:border-amber-500/50 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 block">
                        Room {room.room_number}
                      </span>
                      <span className="text-xs font-medium text-stone-500 truncate block mt-0.5">
                        Floor {room.floor} • PMS Integrated
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap shrink-0 ${
                        room.is_occupied === 1
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {room.is_occupied === 1 ? 'Occupied' : 'Vacant'}
                    </span>
                  </div>

                  {room.is_occupied === 1 ? (
                    <div className="mt-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 space-y-1.5 text-xs">
                      <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <Users size={13} className="text-amber-600 shrink-0" />
                        <span className="truncate">{room.guest_name}</span>
                      </div>
                      {room.check_out_date && (
                        <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                          <Calendar size={12} className="shrink-0" />
                          <span>Depart: {room.check_out_date}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <ShieldCheck size={12} className="shrink-0" />
                        <span>Dining Room Billing Authorized</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 text-xs text-stone-400 italic">
                      Room is currently clean and ready for guest check-in.
                    </div>
                  )}
                </div>

                {/* Action Buttons Toolbar */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                  {room.is_occupied === 1 ? (
                    <button
                      onClick={() => handleCheckOut(room)}
                      className="w-full py-2 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs whitespace-nowrap transition-colors flex items-center justify-center gap-1.5"
                    >
                      <LogOut size={13} className="text-stone-500" />
                      <span>Check Out Guest</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedRoom(room);
                        setCheckInModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <LogIn size={13} />
                      <span>Check In Guest</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD ROOM MODAL */}
      <Modal
        isOpen={addRoomModalOpen}
        onClose={() => setAddRoomModalOpen(false)}
        title="Register New Hotel Room"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Room Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 101, 204, 305"
              value={newRoomNum}
              onChange={(e) => setNewRoomNum(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Floor Number *
            </label>
            <input
              type="number"
              min="1"
              max="20"
              required
              value={newRoomFloor}
              onChange={(e) => setNewRoomFloor(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddRoomModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Register Room'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CHECK-IN GUEST MODAL */}
      <Modal
        isOpen={checkInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        title={`Check In Guest: Room ${selectedRoom?.room_number}`}
        maxWidth="sm"
      >
        <form onSubmit={handleCheckIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Guest Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Sarah Wanjiku"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Departure Date (Check-out)
            </label>
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Verification PIN (Optional for Dining Billing)
            </label>
            <input
              type="password"
              placeholder="4-digit PIN (e.g. 1234)"
              maxLength={6}
              value={guestPin}
              onChange={(e) => setGuestPin(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCheckInModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
            >
              {submitting ? 'Checking In...' : 'Confirm Check-In'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CHARGES AUDIT MODAL */}
      <Modal
        isOpen={chargesModalOpen}
        onClose={() => setChargesModalOpen(false)}
        title="Restaurant-to-Room Folio Charges Audit"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Room</th>
                  <th className="p-3">Session Code</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 dark:divide-stone-800">
                {charges.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 font-mono text-[11px] text-stone-400">
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-bold text-stone-900 dark:text-stone-100">
                      Room {c.room_number}
                    </td>
                    <td className="p-3 font-mono text-stone-500">{c.session_code}</td>
                    <td className="p-3 font-mono font-bold text-emerald-600">
                      KES {c.amount?.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {c.status || 'Posted to PMS'}
                      </span>
                    </td>
                  </tr>
                ))}
                {charges.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-400">
                      No room folio charges recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
