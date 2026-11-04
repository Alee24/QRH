import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { useSocket } from '../../context/SocketContext.js';
import { soundEffects } from '../../utils/audioChime.js';
import {
  Tv,
  Volume2,
  VolumeX,
  RotateCw,
  Printer,
  Check,
  Flame,
  Clock,
  Utensils,
  History,
  AlertTriangle,
  Play
} from 'lucide-react';

export const KitchenDisplay: React.FC = () => {
  const { socket, connected } = useSocket();

  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [servedTickets, setServedTickets] = useState<any[]>([]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load Stations & Initial Tickets
  useEffect(() => {
    loadStations();
    loadTickets();
  }, [selectedStation]);

  const loadStations = async () => {
    try {
      const data = await apiFetch<any[]>('/kds/stations');
      setStations(data);
    } catch (err) {
      console.error('Error loading stations:', err);
    }
  };

  const loadTickets = async () => {
    try {
      const data = await apiFetch<any[]>(`/kds/tickets?stationId=${selectedStation}`);
      setTickets(data);
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Socket.IO Real-time ticket updates
  useEffect(() => {
    if (!socket) return;

    socket.emit('join:kds', selectedStation);

    const onNewTicket = (data: any) => {
      if (soundEnabled) soundEffects.playOrderBell();
      loadTickets();
    };

    const onTicketUpdated = (data: any) => {
      setTickets((prev) =>
        prev
          .map((t) => (t.id === data.ticket.id ? data.ticket : t))
          .filter((t) => t.status !== 'served' && t.status !== 'cancelled')
      );
    };

    socket.on('kds:new_ticket', onNewTicket);
    socket.on('kds:new_order', onNewTicket);
    socket.on('kds:ticket_updated', onTicketUpdated);

    return () => {
      socket.off('kds:new_ticket', onNewTicket);
      socket.off('kds:new_order', onNewTicket);
      socket.off('kds:ticket_updated', onTicketUpdated);
    };
  }, [socket, selectedStation, soundEnabled]);

  // Update Status
  const handleUpdateStatus = async (ticketId: string, status: 'pending' | 'preparing' | 'ready' | 'served') => {
    try {
      if (status === 'ready' && soundEnabled) {
        soundEffects.playReadyChime();
      }
      const updated = await apiFetch<any>(`/kds/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      if (status === 'served') {
        setTickets((prev) => prev.filter((t) => t.id !== ticketId));
        setServedTickets((prev) => [updated, ...prev]);
      } else {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      }
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  // Toggle Item checkbox inside ticket
  const handleToggleItem = async (itemId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ready' ? 'pending' : 'ready';
    try {
      await apiFetch(`/kds/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      loadTickets();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Rush Priority
  const handleTogglePriority = async (ticketId: string, current: string) => {
    const next = current === 'rush' ? 'normal' : 'rush';
    try {
      await apiFetch(`/kds/tickets/${ticketId}/priority`, {
        method: 'PATCH',
        body: JSON.stringify({ priority: next }),
      });
      loadTickets();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter columns
  const pendingTickets = tickets.filter((t) => t.status === 'pending');
  const preparingTickets = tickets.filter((t) => t.status === 'preparing');
  const readyTickets = tickets.filter((t) => t.status === 'ready');

  // Elapsed Time Calculator
  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    return `${mins} min ago`;
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans">
      {/* 1. TOP KDS BAR (Matching Screenshot 3) */}
      <div className="h-16 px-6 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
        {/* Left: Branding & Station Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow">
              <Tv size={18} />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white hidden sm:inline">
              Heritage KDS
            </span>
          </div>

          {/* Station dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="bg-stone-800 text-stone-100 text-xs font-semibold px-3 py-2 rounded-xl border border-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">⚡ All Stations ({tickets.length})</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>

            {/* Board / List toggle */}
            <div className="flex bg-stone-800 p-0.5 rounded-xl border border-stone-700">
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  viewMode === 'board' ? 'bg-blue-600 text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sync indicator, Audio toggle, Served History, Time */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => loadTickets()}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white"
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Sync ({connected ? 'Live' : 'Poll'})</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white"
          >
            {soundEnabled ? <Volume2 size={16} className="text-emerald-400" /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Chime On' : 'Muted'}</span>
          </button>

          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700"
          >
            <History size={14} />
            <span>History</span>
          </button>

          <div className="font-mono text-sm font-bold text-stone-200 pl-3 border-l border-stone-800">
            {currentTime}
          </div>
        </div>
      </div>

      {/* 2. THREE-COLUMN KDS BOARD (Screenshot 3 Design) */}
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto">
        {/* COLUMN 1: PENDING */}
        <div className="flex flex-col rounded-2xl bg-stone-950/60 border border-stone-800 overflow-hidden">
          <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wider uppercase text-blue-400">
                PENDING
              </span>
            </div>
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
              {pendingTickets.length}
            </span>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {pendingTickets.map((ticket) => renderTicketCard(ticket, 'pending'))}
            {pendingTickets.length === 0 && (
              <div className="h-48 flex items-center justify-center text-xs text-stone-600">
                No pending tickets
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: PREPARING */}
        <div className="flex flex-col rounded-2xl bg-stone-950/60 border border-stone-800 overflow-hidden">
          <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wider uppercase text-amber-400">
                PREPARING
              </span>
            </div>
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">
              {preparingTickets.length}
            </span>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {preparingTickets.map((ticket) => renderTicketCard(ticket, 'preparing'))}
            {preparingTickets.length === 0 && (
              <div className="h-48 flex items-center justify-center text-xs text-stone-600">
                No orders in preparation
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: READY */}
        <div className="flex flex-col rounded-2xl bg-stone-950/60 border border-stone-800 overflow-hidden">
          <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wider uppercase text-emerald-400">
                READY FOR COLLECTION
              </span>
            </div>
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
              {readyTickets.length}
            </span>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {readyTickets.map((ticket) => renderTicketCard(ticket, 'ready'))}
            {readyTickets.length === 0 && (
              <div className="h-48 flex items-center justify-center text-xs text-stone-600">
                No orders ready for delivery
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Helper to render high-contrast KDS ticket card (Screenshot 3 layout)
  function renderTicketCard(ticket: any, column: 'pending' | 'preparing' | 'ready') {
    const isRush = ticket.priority === 'rush';
    const elapsed = getElapsedMinutes(ticket.created_at);

    return (
      <div
        key={ticket.id}
        className={`rounded-2xl bg-white text-stone-900 p-4 shadow-lg border-2 transition-all ${
          isRush
            ? 'border-red-500 ring-2 ring-red-500/30'
            : column === 'ready'
            ? 'border-emerald-500'
            : 'border-stone-200'
        }`}
      >
        {/* Ticket Header */}
        <div className="flex items-start justify-between border-b border-stone-150 pb-2 mb-3">
          <div>
            <div className="font-black text-base tracking-tight text-stone-900 flex items-center gap-2">
              <span>{ticket.kot_number}</span>
              <span className="text-xs px-2 py-0.5 rounded-lg bg-stone-900 text-white font-extrabold">
                T{ticket.table_number}
              </span>
            </div>
            <div className="text-xs text-stone-500 font-medium mt-0.5">
              Order {ticket.order_number}
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-1">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                elapsed.includes('Just')
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {elapsed}
            </span>
            {isRush && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-600 text-white font-black animate-pulse">
                RUSH
              </span>
            )}
          </div>
        </div>

        {/* Items List (Touchable) */}
        <div className="space-y-2 mb-4">
          {ticket.items?.map((item: any) => {
            const isItemReady = item.status === 'ready';
            return (
              <div
                key={item.id}
                onClick={() => handleToggleItem(item.id, item.status)}
                className={`flex items-start gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                  isItemReady ? 'bg-stone-100 opacity-60 line-through' : 'hover:bg-stone-50'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border ${
                    isItemReady
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-stone-400 bg-white'
                  }`}
                >
                  {isItemReady && <Check size={11} />}
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-stone-900">
                    <span className="text-blue-600 font-black mr-1">{item.quantity}x</span>
                    {item.item_name}
                    {item.portion_name && (
                      <span className="text-stone-500 font-normal ml-1">({item.portion_name})</span>
                    )}
                  </div>
                  {item.modifiers_summary && (
                    <div className="text-[11px] text-stone-500 font-medium">
                      {item.modifiers_summary}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 font-semibold">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Actions and Station Code */}
        <div className="pt-2 border-t border-stone-150 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {column === 'pending' && (
              <button
                onClick={() => handleUpdateStatus(ticket.id, 'preparing')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow"
              >
                <Play size={13} />
                <span>Start</span>
              </button>
            )}

            {column === 'preparing' && (
              <button
                onClick={() => handleUpdateStatus(ticket.id, 'ready')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow"
              >
                <Check size={13} />
                <span>Ready</span>
              </button>
            )}

            {column === 'ready' && (
              <button
                onClick={() => handleUpdateStatus(ticket.id, 'served')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow"
              >
                <span>Serve</span>
              </button>
            )}

            {/* Rush Toggle */}
            <button
              onClick={() => handleTogglePriority(ticket.id, ticket.priority)}
              className={`p-1.5 rounded-lg border text-xs font-semibold ${
                isRush ? 'bg-red-50 text-red-700 border-red-300' : 'text-stone-400 border-stone-200 hover:text-stone-700'
              }`}
              title="Toggle Rush Priority"
            >
              <Flame size={14} />
            </button>
          </div>

          {/* Station Tag */}
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ticket.station_color || '#3b82f6' }}
            />
            <span>{ticket.station_code || 'KITCHEN'}</span>
          </div>
        </div>
      </div>
    );
  }
};

