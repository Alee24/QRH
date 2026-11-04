import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Users, Shield, History, CheckCircle, Clock } from 'lucide-react';

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await apiFetch<any[]>('/auth/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Users className="text-amber-600" />
            <span>Staff Role-Based Access Control (RBAC)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Authorized hospitality team members, role assignments, station routing, and security privileges
          </p>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="p-4">Staff Member</th>
                <th className="p-4">Email</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Outlet / Kitchen Station</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150 dark:divide-stone-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                  <td className="p-4 font-bold text-stone-900 dark:text-stone-100">
                    {u.name}
                  </td>
                  <td className="p-4 font-mono text-stone-500">{u.email}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-stone-600 dark:text-stone-400">
                    {u.station_name || u.outlet_name || 'All Outlets'}
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                      <CheckCircle size={13} />
                      <span>Active</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

