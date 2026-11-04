import React, { useState, useEffect } from 'react';
import {
  Building2,
  DollarSign,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  ExternalLink,
  Layers,
  Activity,
  Server,
  RefreshCw,
  Sliders,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  status: 'active' | 'pending_approval' | 'suspended' | 'cancelled' | 'trial';
  plan_id: string;
  plan_name: string;
  price_monthly: number;
  currency: string;
  table_count: number;
  outlet_count: number;
  staff_count: number;
  gmv: number;
  total_orders: number;
  owner_email: string;
  owner_phone: string;
  created_at: string;
  tenant_logo?: string;
}

interface DashboardMetrics {
  total_tenants: number;
  active_tenants: number;
  pending_tenants: number;
  suspended_tenants: number;
  mrr: number;
  currency: string;
  total_gmv: number;
  total_orders: number;
  total_tables: number;
  total_staff: number;
}

interface SystemHealth {
  status: string;
  uptime_hours: string;
  memory_heap_used_mb: string;
  os_platform: string;
  database_type: string;
  websocket_status: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  currency: string;
  max_tables: number;
  max_outlets: number;
  max_staff: number;
  features_json: string;
  active_subscriber_count: number;
}

export const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { branding } = useTheme();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState<Tenant | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New Tenant Form
  const [formData, setFormData] = useState({
    name: '',
    owner_email: '',
    owner_phone: '',
    plan_id: 'plan-growth',
    max_tables: 50,
    max_outlets: 3,
    custom_domain: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Load metrics & system health
      const dashRes = await fetch('/api/saas/dashboard', { headers });
      if (dashRes.ok) {
        const d = await dashRes.json();
        setMetrics(d.metrics);
        setSystemHealth(d.system_health);
      }

      // Load tenants
      const tenantsRes = await fetch('/api/saas/tenants', { headers });
      if (tenantsRes.ok) {
        const t = await tenantsRes.json();
        setTenants(t);
      }

      // Load plans
      const plansRes = await fetch('/api/saas/plans', { headers });
      if (plansRes.ok) {
        const p = await plansRes.json();
        setPlans(p);
      }
    } catch (err) {
      console.error('Failed to load SaaS dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (tenantId: string, newStatus: string, reason: string = '') => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/saas/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, reason }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to update tenant status', err);
    }
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/saas/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowOnboardModal(false);
        setFormData({
          name: '',
          owner_email: '',
          owner_phone: '',
          plan_id: 'plan-growth',
          max_tables: 50,
          max_outlets: 3,
          custom_domain: '',
        });
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to onboard tenant');
      }
    } catch (err) {
      console.error('Failed to onboard tenant', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.owner_email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* SaaS Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Level 1: SaaS Platform Core
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Multi-Tenant Mesh
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
            SaaS Platform Control Center
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Cross-tenant orchestration, hotel subscriber lifecycle, recurring billing, and infrastructure telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
          <button
            onClick={() => setShowOnboardModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Onboard Hotel Tenant
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Platform MRR
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-stone-900 dark:text-white">
              KES {metrics ? metrics.mrr.toLocaleString() : '---'}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Recurring Subscription Run-Rate</span>
            </div>
          </div>
        </div>

        {/* Cross-Tenant GMV */}
        <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Cross-Tenant GMV
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-stone-900 dark:text-white">
              KES {metrics ? metrics.total_gmv.toLocaleString() : '---'}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Processed over {metrics?.total_orders || 0} customer orders
            </div>
          </div>
        </div>

        {/* Hotel Tenants Count */}
        <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Active Hotels
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900 dark:text-white">
                {metrics?.active_tenants || 0}
              </span>
              <span className="text-xs text-stone-500">/ {metrics?.total_tenants || 0} onboarded</span>
            </div>
            {metrics && metrics.pending_tenants > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{metrics.pending_tenants} pending approval</span>
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Infrastructure
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-base font-bold text-stone-900 dark:text-white uppercase">
                {systemHealth?.status || 'HEALTHY'}
              </span>
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Uptime: {systemHealth?.uptime_hours || '0'} hrs • Heap: {systemHealth?.memory_heap_used_mb || '0'} MB
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Plans Catalog Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white">Subscription Tier Portfolio</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Pre-configured SaaS licensing tiers with operational feature gates and capacity limits.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const features = JSON.parse(p.features_json || '[]');
            return (
              <div
                key={p.id}
                className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-stone-900 dark:text-white">{p.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {p.active_subscriber_count} active hotels
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 min-h-[32px]">
                    {p.description}
                  </p>
                  <div className="mt-3 text-xl font-bold text-stone-900 dark:text-white">
                    KES {p.price_monthly.toLocaleString()}
                    <span className="text-xs font-normal text-stone-500"> / month</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2 text-xs text-stone-600 dark:text-stone-300">
                    <div className="flex justify-between">
                      <span>Max Tables:</span>
                      <span className="font-semibold">{p.max_tables}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Outlets:</span>
                      <span className="font-semibold">{p.max_outlets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Staff Accounts:</span>
                      <span className="font-semibold">{p.max_staff}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {features.map((f: string) => (
                        <span
                          key={f}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
                        >
                          {f.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hotel Tenants Master Roster */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {['all', 'active', 'pending_approval', 'suspended', 'trial'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  filterStatus === st
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search hotel name, slug, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Tenant Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Hotel Tenant</th>
                <th className="py-3 px-4">Subscription Plan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Capacity Used</th>
                <th className="py-3 px-4">GMV (Sales)</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500 dark:text-stone-400">
                    No hotel tenants found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  let badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                  if (t.status === 'pending_approval') {
                    badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                  } else if (t.status === 'suspended') {
                    badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                  }

                  return (
                    <tr key={t.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-amber-600 text-sm">
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900 dark:text-white flex items-center gap-1.5">
                              {t.name}
                              {t.custom_domain && (
                                <span className="text-[10px] text-stone-400 font-mono">
                                  ({t.custom_domain})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-400 font-mono">id: {t.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-900 dark:text-white">{t.plan_name}</div>
                        <div className="text-[11px] text-stone-400">
                          KES {t.price_monthly.toLocaleString()} / mo
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${badgeClass}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-stone-700 dark:text-stone-300">
                          <span className="font-semibold">{t.table_count}</span> tables • <span className="font-semibold">{t.outlet_count}</span> outlets
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {t.staff_count} registered staff
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 dark:text-white">
                          KES {t.gmv.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-stone-400">{t.total_orders} orders</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-stone-700 dark:text-stone-300">{t.owner_email}</div>
                        <div className="text-[11px] text-stone-400">{t.owner_phone || '---'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status === 'pending_approval' && (
                            <button
                              onClick={() => handleStatusChange(t.id, 'active', 'Super admin manual approval')}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                            >
                              Approve
                            </button>
                          )}

                          {t.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(t.id, 'suspended', 'Administrative hold')}
                              className="px-2.5 py-1 text-xs font-medium rounded border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            >
                              Suspend
                            </button>
                          )}

                          {t.status === 'suspended' && (
                            <button
                              onClick={() => handleStatusChange(t.id, 'active', 'Reactivated by Super Admin')}
                              className="px-2.5 py-1 text-xs font-medium rounded border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                            >
                              Reactivate
                            </button>
                          )}

                          <button
                            onClick={() => {
                              localStorage.setItem('active_tenant_id', t.id);
                              window.location.reload();
                            }}
                            title="Inspect and switch to this hotel context"
                            className="p-1 rounded text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Hotel Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                  Onboard New Hotel Tenant
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Provisions isolated schema records, outlets, KDS stations, and default white-label parameters.
                </p>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Hotel / Property Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fairmont Mount Kenya Safari Club"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Owner / GM Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="gm@fairmont.com"
                    value={formData.owner_email}
                    onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+254 700 123 456"
                    value={formData.owner_phone}
                    onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={formData.plan_id}
                    onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (KES {p.price_monthly.toLocaleString()}/mo)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Custom Domain (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="dining.fairmont.com"
                    value={formData.custom_domain}
                    onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                >
                  {submitting ? 'Provisioning...' : 'Complete Hotel Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
