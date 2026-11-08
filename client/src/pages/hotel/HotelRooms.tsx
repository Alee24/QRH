import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import {
  Building2,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  Calendar,
  Clock
} from 'lucide-react';

export const HotelRooms: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [roomsData, chargesData] = await Promise.all([
        apiFetch<any[]>('/hotel/rooms'),
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

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Building2 className="text-amber-600" />
            <span>Hotel PMS Integration & Room Directory</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Registered hotel guest rooms, restaurant-to-room charge posting and room-service billing
          </p>
        </div>

        {/* 1. ROOMS DIRECTORY GRID */}
        <div>
          <h2 className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-3">
            Hotel Guest Rooms Directory ({rooms.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between min-h-[170px]"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
                        Room {room.room_number}
                      </span>
                      <span className="text-xs text-stone-400 block mt-0.5">Floor {room.floor}</span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        room.is_occupied
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {room.is_occupied ? 'Occupied' : 'Vacant'}
                    </span>
                  </div>

                  {room.is_occupied ? (
                    <div className="mt-3 space-y-1 text-xs">
                      <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <Users size={13} className="text-amber-600" />
                        <span>{room.guest_name}</span>
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>Check-out: {room.check_out_date}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-xs text-stone-400 italic">No guest checked in.</div>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-150 dark:border-stone-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-stone-500 font-medium">Room Billing:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle size={13} />
                    <span>Authorized</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. ROOM CHARGES AUDIT LOG */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-stone-800 dark:text-stone-200">
            Restaurant to Room Charge Transactions ({charges.length})
          </h2>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-4">Date Time</th>
                  <th className="p-4">Room Number</th>
                  <th className="p-4">Guest Name</th>
                  <th className="p-4">Table Session</th>
                  <th className="p-4">Amount Charged</th>
                  <th className="p-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 dark:divide-stone-800">
                {charges.map((c) => (
                  <tr key={c.id}>
                    <td className="p-4 text-stone-400 font-mono text-[11px]">
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-stone-900 dark:text-stone-100">
                      Room {c.room_number}
                    </td>
                    <td className="p-4 font-medium text-stone-700 dark:text-stone-300">
                      {c.guest_name}
                    </td>
                    <td className="p-4 font-mono text-stone-500">{c.session_code}</td>
                    <td className="p-4 font-mono font-bold text-amber-600">
                      KES {c.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-stone-500">{c.authorized_by}</td>
                  </tr>
                ))}
                {charges.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400">
                      No room charges posted today. When a cashier settles a bill using "Room Charge", it appears here and posts to the hotel guest ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

