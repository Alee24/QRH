import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import {
  BarChart3,
  Download,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  Smartphone,
  RotateCw,
  CreditCard,
  Building,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const ReportsDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [mpesaRecon, setMpesaRecon] = useState<any | null>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [dash, mpesa, sales] = await Promise.all([
        apiFetch<any>('/reports/dashboard'),
        apiFetch<any>('/reports/mpesa-reconciliation').catch(() => null),
        apiFetch<any[]>('/reports/sales').catch(() => []),
      ]);
      setDashboard(dash);
      setMpesaRecon(mpesa);
      setRecentSales(sales);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <BarChart3 className="text-amber-600" />
              <span>Management Reporting & Daraja Reconciliation</span>
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Sales velocity, kitchen preparation metrics, payment settlement audits, and CSV exports
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadReports}
              className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300"
              title="Refresh"
            >
              <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <a
              href="/api/reports/export/sales.csv"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/30 transition-colors"
            >
              <Download size={14} />
              <span>Export Sales CSV</span>
            </a>
          </div>
        </div>

        {/* 1. TOP KPI STAT CARDS */}
        {dashboard && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
              <span className="text-xs text-stone-500 font-semibold uppercase block">
                Today's Gross Sales
              </span>
              <span className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 mt-1 block">
                KES {dashboard.todayRevenue?.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
                KES Currency Baseline
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
              <span className="text-xs text-stone-500 font-semibold uppercase block">
                Orders Completed Today
              </span>
              <span className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 mt-1 block">
                {dashboard.todayOrders}
              </span>
              <span className="text-[11px] text-stone-400 mt-1 block">
                Across QR self-order & POS
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
              <span className="text-xs text-stone-500 font-semibold uppercase block">
                Average Order Value
              </span>
              <span className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 mt-1 block">
                KES {dashboard.avgOrderValue?.toLocaleString()}
              </span>
              <span className="text-[11px] text-amber-600 font-bold mt-1 block">
                Per dining ticket
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
              <span className="text-xs text-stone-500 font-semibold uppercase block">
                Kitchen Tickets Queue
              </span>
              <span className="text-2xl sm:text-3xl font-black text-blue-600 mt-1 block">
                {dashboard.kitchenQueue?.pending + dashboard.kitchenQueue?.preparing}
              </span>
              <span className="text-[11px] text-stone-400 mt-1 block">
                {dashboard.kitchenQueue?.ready} ready for delivery
              </span>
            </div>
          </div>
        )}

        {/* 2. TOP DISHES & CATEGORY SALES */}
        {dashboard && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top dishes */}
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                Top Selling Gourmet Dishes
              </h3>

              <div className="space-y-3">
                {dashboard.topItems?.map((it: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {it.item_name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-stone-800 dark:text-stone-200 block">
                        {it.total_qty} Ordered
                      </span>
                      <span className="font-mono text-stone-400 text-[11px]">
                        KES {it.total_revenue?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                {(!dashboard.topItems || dashboard.topItems.length === 0) && (
                  <div className="text-center py-6 text-stone-400 text-xs">
                    No order items placed yet today.
                  </div>
                )}
              </div>
            </div>

            {/* Category breakdown */}
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                Sales by Category
              </h3>

              <div className="space-y-3">
                {dashboard.categorySales?.map((c: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-stone-800 dark:text-stone-200">{c.category_name}</span>
                      <span className="font-mono text-amber-600">
                        KES {c.revenue?.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full"
                        style={{
                          width: `${Math.min(100, (c.revenue / (dashboard.todayRevenue || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. SAFARICOM DARAJA M-PESA RECONCILIATION */}
        {mpesaRecon && (
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="text-emerald-600" />
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                  Safaricom Daraja M-Pesa Settlement Reconciliation
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-stone-500">
                  Total Reconciled:{' '}
                  <strong className="text-emerald-600 font-mono">
                    KES {mpesaRecon.summary.totalReconciled?.toLocaleString()}
                  </strong>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {mpesaRecon.summary.completedCount} Completed
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">M-Pesa Receipt</th>
                    <th className="p-3">Checkout Request ID</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150 dark:divide-stone-800">
                  {mpesaRecon.transactions?.map((m: any) => (
                    <tr key={m.id}>
                      <td className="p-3 font-mono text-[11px] text-stone-400">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 font-mono font-bold text-stone-900 dark:text-stone-100">
                        {m.mpesa_receipt || 'Pending...'}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-stone-500">
                        {m.checkout_request_id}
                      </td>
                      <td className="p-3 font-mono text-stone-700 dark:text-stone-300">
                        {m.phone_number}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-600">
                        KES {m.amount?.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!mpesaRecon.transactions || mpesaRecon.transactions.length === 0) && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-stone-400">
                        No M-Pesa transactions recorded today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
