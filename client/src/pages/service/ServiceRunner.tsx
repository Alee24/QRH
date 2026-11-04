import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { useSocket } from '../../context/SocketContext.js';
import { soundEffects } from '../../utils/audioChime.js';
import {
  Bell,
  CheckCircle,
  Clock,
  MapPin,
  Utensils,
  RotateCw,
  PhoneCall,
  Check
} from 'lucide-react';

export const ServiceRunner: React.FC = () => {
  const { socket } = useSocket();

  const [readyTickets, setReadyTickets] = useState<any[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const [tickets, requests] = await Promise.all([
        apiFetch<any[]>('/service/ready-tickets'),
        apiFetch<any[]>('/service/assistance-requests'),
      ]);
      setReadyTickets(tickets);
      setAssistanceRequests(requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;
    socket.emit('join:service');

    const handleReady = () => {
      soundEffects.playReadyChime();
      loadQueue();
    };

    const handleAssistance = () => {
      soundEffects.playOrderBell();
      loadQueue();
    };

    socket.on('service:ticket_ready', handleReady);
    socket.on('service:assistance_requested', handleAssistance);

    return () => {
      socket.off('service:ticket_ready', handleReady);
      socket.off('service:assistance_requested', handleAssistance);
    };
  }, [socket]);

  const handleDeliver = async (ticketId: string) => {
    try {
      await apiFetch(`/service/deliver-ticket/${ticketId}`, { method: 'POST' });
      setReadyTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResolveAssistance = async (reqId: string) => {
    try {
      await apiFetch(`/service/assistance-requests/${reqId}/resolve`, { method: 'PATCH' });
      setAssistanceRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-4 sm:p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Bell className="text-amber-600" />
              <span>Service & Delivery Dispatch</span>
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Food ready for table delivery and live guest assistance requests
            </p>
          </div>
          <button
            onClick={loadQueue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-semibold"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* 1. GUEST ASSISTANCE ALERTS (Prominent at top) */}
        {assistanceRequests.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
              <PhoneCall size={16} className="text-amber-600 animate-bounce" />
              <span>Table Assistance Calls Awaiting Response ({assistanceRequests.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assistanceRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between"
                >
                  <div>
                    <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                      Table {req.table_number}
                    </span>
                    <span className="text-xs text-amber-700 dark:text-amber-400 block font-semibold">
                      {req.request_type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <button
                    onClick={() => handleResolveAssistance(req.id)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition-colors"
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. READY FOOD DELIVERY QUEUE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
              Orders Ready for Collection & Table Delivery ({readyTickets.length})
            </h2>
          </div>

          {readyTickets.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-400">
              <CheckCircle size={40} className="mx-auto mb-2 text-emerald-500" />
              <p className="font-bold text-sm text-stone-700 dark:text-stone-300">
                All prepared dishes have been delivered!
              </p>
              <p className="text-xs text-stone-500 mt-1">
                New tickets will chime automatically when kitchen staff marks them ready.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-5 rounded-2xl bg-white dark:bg-stone-900 border-2 border-emerald-500/60 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3 pb-2 border-b border-stone-150 dark:border-stone-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
                            Table {ticket.table_number}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Ready
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 font-mono mt-0.5">
                          {ticket.kot_number} • {ticket.order_number}
                        </div>
                      </div>

                      <div className="text-[11px] font-bold text-stone-600 dark:text-stone-400 flex items-center gap-1">
                        <Clock size={12} />
                        <span>Ready {new Date(ticket.ready_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 mb-4">
                      {ticket.items?.map((it: any) => (
                        <div key={it.id} className="text-xs text-stone-800 dark:text-stone-200">
                          <span className="font-black text-amber-600 mr-1.5">{it.quantity}x</span>
                          <span className="font-bold">{it.item_name}</span>
                          {it.portion_name && (
                            <span className="text-stone-500 ml-1">({it.portion_name})</span>
                          )}
                          {it.notes && (
                            <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5">
                              {it.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery confirmation CTA */}
                  <button
                    onClick={() => handleDeliver(ticket.id)}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    <span>Confirm Delivered to Table {ticket.table_number}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
