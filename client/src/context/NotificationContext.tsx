import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext.js';
import { soundEffects } from '../utils/audioChime.js';

export interface OrderNotification {
  id: string;
  orderNumber: string;
  tableNumber: string;
  tableId?: string;
  amount: number;
  itemCount: number;
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

    socket.on('order:new_notification', handleNewOrder);
    socket.on('pos:order_received', handleNewOrder);
    socket.on('kds:new_order', handleNewOrder);

    return () => {
      socket.off('order:new_notification', handleNewOrder);
      socket.off('pos:order_received', handleNewOrder);
      socket.off('kds:new_order', handleNewOrder);
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
