import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext.js';
import { soundEffects } from '../utils/audioChime.js';

export interface OrderNotification {
  id: string;
  type?: 'order' | 'assistance';
  orderNumber: string;
  tableNumber: string;
  tableId?: string;
  amount?: number;
  itemCount?: number;
  requestType?: string;
  notes?: string;
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: OrderNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  toastAlert: OrderNotification | null;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<OrderNotification[]>(() => {
    try {
      const saved = localStorage.getItem('order_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('order_sound_enabled') !== 'false';
  });
  const [toastAlert, setToastAlert] = useState<OrderNotification | null>(null);

  useEffect(() => {
    localStorage.setItem('order_notifications', JSON.stringify(notifications.slice(0, 30)));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('order_sound_enabled', String(soundEnabled));
    soundEffects.enabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data: any) => {
      const order = data.order || data;
      const orderNumber = order.order_number || data.order_number || 'New Order';
      const tableNumber = order.table_number || data.table_number || 'T-??';
      const amount = order.total_amount || data.total_amount || 0;
      const itemCount = order.items?.length || data.item_count || 1;

      const newNotif: OrderNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderNumber,
        tableNumber,
        tableId: order.table_id || data.table_id,
        amount,
        itemCount,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 29)]);
      setToastAlert(newNotif);

      // Play Ding-Dong kitchen order chime
      if (soundEnabled) {
        soundEffects.playOrderBell();
      }

      // Auto-hide toast after 6 seconds
      setTimeout(() => {
        setToastAlert((curr) => (curr?.id === newNotif.id ? null : curr));
      }, 6000);
    };

    const handleAssistance = (data: any) => {
      const tableNumber = data.table_number || (data.table_id ? `T-${data.table_id}` : 'Table');
      const rawType = data.request_type || data.type || 'Assistance';
      const typeMap: Record<string, string> = {
        call_waiter: 'Call Waiter',
        request_water: 'Fresh Water',
        request_bill: 'Bring Bill',
        clean_table: 'Table Cleaning',
      };
      const requestType = typeMap[String(rawType)] || rawType;
      const notes = data.notes || '';

      const newNotif: OrderNotification = {
        id: `assist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'assistance',
        orderNumber: `🛎️ Table ${tableNumber}`,
        tableNumber: String(tableNumber),
        tableId: data.table_id,
        requestType,
        notes,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 29)]);
      setToastAlert(newNotif);

      // Play Service Call Bell resonant chime!
      if (soundEnabled) {
        soundEffects.playServiceCallBell();
      }

      // Auto-hide toast after 8 seconds
      setTimeout(() => {
        setToastAlert((curr) => (curr?.id === newNotif.id ? null : curr));
      }, 8000);
    };

    socket.on('order:new_notification', handleNewOrder);
    socket.on('pos:order_received', handleNewOrder);
    socket.on('kds:new_order', handleNewOrder);
    socket.on('assistance:new_notification', handleAssistance);
    socket.on('service:assistance_requested', handleAssistance);
    socket.on('pos:assistance_requested', handleAssistance);

    return () => {
      socket.off('order:new_notification', handleNewOrder);
      socket.off('pos:order_received', handleNewOrder);
      socket.off('kds:new_order', handleNewOrder);
      socket.off('assistance:new_notification', handleAssistance);
      socket.off('service:assistance_requested', handleAssistance);
      socket.off('pos:assistance_requested', handleAssistance);
    };
  }, [socket, soundEnabled]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  const dismissToast = () => {
    setToastAlert(null);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        soundEnabled,
        toggleSound,
        toastAlert,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
};

