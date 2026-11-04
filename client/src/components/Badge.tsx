import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TableStatusBadge: React.FC<BadgeProps> = ({ status, className = '', size = 'md' }) => {
  const styles: Record<string, { bg: string; text: string; label: string; dot: string }> = {
    available: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800', text: 'Available', label: 'Available', dot: 'bg-emerald-500' },
    occupied: { bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800', text: 'Occupied', label: 'Occupied', dot: 'bg-blue-500' },
    ordering: { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800', text: 'Ordering', label: 'Ordering', dot: 'bg-amber-500' },
    preparing: { bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800', text: 'In Kitchen', label: 'In Kitchen', dot: 'bg-orange-500' },
    ready: { bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800', text: 'Ready for Service', label: 'Ready', dot: 'bg-purple-500' },
    awaiting_payment: { bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800', text: 'Bill Requested', label: 'Bill Requested', dot: 'bg-rose-500' },
    cleaning: { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800', text: 'Needs Cleaning', label: 'Cleaning', dot: 'bg-cyan-500' },
    maintenance: { bg: 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700', text: 'Maintenance', label: 'Maintenance', dot: 'bg-stone-400' },
  };

  const current = styles[status] || styles.available;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1 font-semibold' : 'text-xs px-2.5 py-1 font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${sizeClasses} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} animate-pulse`} />
      {current.label}
    </span>
  );
};

export const OrderStatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const map: Record<string, { bg: string; text: string }> = {
    received: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', text: 'Order Received' },
    confirmed: { bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300', text: 'Confirmed' },
    preparing: { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', text: 'Preparing' },
    partially_ready: { bg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300', text: 'Partially Ready' },
    ready: { bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', text: 'Ready for Collection' },
    served: { bg: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300', text: 'Delivered / Served' },
    cancelled: { bg: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', text: 'Cancelled' },
  };

  const current = map[status] || { bg: 'bg-stone-100 text-stone-800', text: status };
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${current.bg} ${sizeClass}`}>
      {current.text}
    </span>
  );
};
