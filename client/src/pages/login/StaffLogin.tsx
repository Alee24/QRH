import React, { useState } from 'react';
import { apiFetch } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Utensils, Lock, Mail, CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

interface StaffLoginProps {
  onSuccess: (role?: string) => void;
  onBackToWebsite?: () => void;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ onSuccess, onBackToWebsite }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@hotel.com');
  const [password, setPassword] = useState('Admin@2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent, directEmail?: string, directPassword?: string) => {
    if (e) e.preventDefault();
    const loginEmail = (directEmail !== undefined ? directEmail : email).trim().toLowerCase();
    const loginPassword = directPassword !== undefined ? directPassword : password;

    if (!loginEmail || !loginPassword) {
      setError('Please provide both staff email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      login(res.token, res.user);
      onSuccess(res.user?.role);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    // Restaurant Leadership
    { level: 'Restaurant Leadership', role: 'Sironi Restaurant Owner', email: 'admin@hotel.com', desc: 'Full Oversight & Reports' },
    { level: 'Restaurant Leadership', role: 'Restaurant Floor Manager', email: 'manager@hotel.com', desc: 'Dining Floor & Shifts' },
    { level: 'Restaurant Leadership', role: 'Central Order Manager', email: 'ordermanager@hotel.com', desc: 'Takeaway & Order Pipeline' },
    { level: 'Restaurant Leadership', role: 'Hotel Operations Admin', email: 'admin-ops@hotel.com', desc: 'Front-of-House Lead' },

    // Culinary & Beverage Team
    { level: 'Kitchen & Beverage', role: 'Executive Head Chef', email: 'chef@hotel.com', desc: 'Main Kitchen KDS' },
    { level: 'Kitchen & Beverage', role: 'Charcoal Grill Master', email: 'grill@hotel.com', desc: 'Grill Station KDS' },
    { level: 'Kitchen & Beverage', role: 'Head Mixologist', email: 'bar@hotel.com', desc: 'Cocktail Bar KDS' },
    { level: 'Kitchen & Beverage', role: 'Pastry & Dessert Chef', email: 'pastry@hotel.com', desc: 'Bakery & Dessert KDS' },

    // Dining Floor, POS & Logistics
    { level: 'Front of House & Logistics', role: 'Cashier / POS Terminal', email: 'cashier@hotel.com', desc: 'Bills & M-Pesa Settlement' },
    { level: 'Front of House & Logistics', role: 'Food Runner & Service', email: 'runner@hotel.com', desc: 'Plated Food Delivery' },
    { level: 'Front of House & Logistics', role: 'Delivery Fleet Dispatcher', email: 'dispatch@hotel.com', desc: 'Courier Board & Orders' },
    { level: 'Front of House & Logistics', role: 'Delivery Driver', email: 'driver@hotel.com', desc: 'Mobile Route & POD' },
    { level: 'Front of House & Logistics', role: 'Events & Catering Director', email: 'catering@hotel.com', desc: 'Private Dinners & Banquets' },
    { level: 'Front of House & Logistics', role: 'Inventory Officer', email: 'inventory@hotel.com', desc: 'Recipe BOM & Stock Levels' },
  ];

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {onBackToWebsite && (
          <button
            type="button"
            onClick={onBackToWebsite}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition"
          >
            <ArrowLeft size={14} />
            <span>Return to Sironi Restaurants Website</span>
          </button>
        )}
        <div className="w-14 h-14 rounded-2xl bg-amber-600 flex items-center justify-center text-white mx-auto shadow-md">
          <Utensils size={28} />
        </div>
        <h2 className="mt-4 text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
          Sironi Restaurants Staff Portal
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Sign in to access your authorized department terminal
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
                    handleSubmit(undefined, acc.email, 'Admin@2026!');
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

