import React, { useState } from 'react';
import { apiFetch } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Utensils, Lock, Mail, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface StaffLoginProps {
  onSuccess: () => void;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ onSuccess }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@hotel.com');
  const [password, setPassword] = useState('Admin@2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(res.token, res.user);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    // Level 1: SaaS Platform
    { level: 'SaaS Platform', role: 'SaaS Super Admin', email: 'superadmin@plateiq.cloud', desc: 'Cross-Tenant Control' },
    { level: 'SaaS Platform', role: 'SaaS Support Admin', email: 'support@plateiq.cloud', desc: 'Tenant Support' },
    { level: 'SaaS Platform', role: 'SaaS Finance Admin', email: 'finance@plateiq.cloud', desc: 'Subscriptions & MRR' },

    // Level 2: Hotel Management
    { level: 'Hotel Leadership', role: 'Grand Heritage Owner', email: 'admin@hotel.com', desc: 'Full Hotel Oversight' },
    { level: 'Hotel Leadership', role: 'Serena Safari GM', email: 'gm@serenasafari.com', desc: 'Mara Safari Tenant' },
    { level: 'Hotel Leadership', role: 'Restaurant Manager', email: 'manager@hotel.com', desc: 'Floor & Shifts Lead' },
    { level: 'Hotel Leadership', role: 'Hotel Admin (Ops)', email: 'admin-ops@hotel.com', desc: 'Front-of-House Lead' },

    // Level 3: Departmental Operations
    { level: 'Kitchen & Beverage', role: 'Executive Chef', email: 'chef@hotel.com', desc: 'Main Kitchen KDS' },
    { level: 'Kitchen & Beverage', role: 'Charcoal Grill Chef', email: 'grill@hotel.com', desc: 'Grill Station KDS' },
    { level: 'Kitchen & Beverage', role: 'Bar Mixologist', email: 'bar@hotel.com', desc: 'Cocktail Bar KDS' },
    { level: 'Kitchen & Beverage', role: 'Pastry Chef', email: 'pastry@hotel.com', desc: 'Bakery & Dessert KDS' },

    { level: 'Front of House & Finance', role: 'Cashier / POS', email: 'cashier@hotel.com', desc: 'Bills & M-Pesa POS' },
    { level: 'Front of House & Finance', role: 'Service Runner', email: 'runner@hotel.com', desc: 'Food Delivery Queue' },
    { level: 'Front of House & Finance', role: 'Reception / Front Desk', email: 'reception@hotel.com', desc: 'PMS Room Folios' },
    { level: 'Front of House & Finance', role: 'Inventory Manager', email: 'inventory@hotel.com', desc: 'Recipe BOM & Stock' },
    { level: 'Front of House & Finance', role: 'Finance Accountant', email: 'accountant@hotel.com', desc: 'Ledger & Reconciliation' },
    { level: 'Front of House & Finance', role: 'Internal Auditor', email: 'audit@hotel.com', desc: 'Audit Logs & Compliance' },
  ];

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-amber-600/30">
          <Utensils size={28} />
        </div>
        <h2 className="mt-4 text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
          Grand Heritage POS Portal
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Hotel & Restaurant Management Staff Authentication
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-stone-900 py-8 px-6 shadow-xl rounded-3xl border border-stone-200 dark:border-stone-800 sm:px-10 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/30 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <span>Verifying...</span> : <span>Sign In to Terminal</span>}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-4 border-t border-stone-150 dark:border-stone-800 space-y-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              1-Click Role Switcher
            </span>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Admin@2026!');
                    setTimeout(() => handleSubmit(), 50);
                  }}
                  className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-left hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all text-[11px]"
                >
                  <div className="font-bold text-stone-800 dark:text-stone-200 line-clamp-1">
                    {acc.role}
                  </div>
                  <div className="text-[10px] text-stone-400 line-clamp-1">{acc.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

