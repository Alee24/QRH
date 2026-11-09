import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Modal } from '../../components/Modal.js';
import {
  Users,
  Shield,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  RotateCw,
  Mail,
  Lock,
  Building,
  ChefHat,
  Tv,
  Check,
  X,
  UserPlus,
  KeyRound,
  Filter,
} from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id: string;
  is_active: number;
  outlet_name?: string;
  station_name?: string;
  created_at: string;
}

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Add User Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('waiter');
  const [formStationId, setFormStationId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    loadStations();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<StaffUser[]>('/auth/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStations = async () => {
    try {
      const data = await apiFetch<any[]>('/kds/stations');
      setStations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await apiFetch('/auth/users', {
        method: 'POST',
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword,
          role: formRole,
          stationId: formStationId || undefined,
        }),
      });

      setFormSuccess(`Staff member ${formName} (${formRole}) created successfully!`);
      setTimeout(() => {
        setAddModalOpen(false);
        setFormName('');
        setFormEmail('');
        setFormPassword('');
        setFormRole('waiter');
        setFormStationId('');
        setFormSuccess(null);
        loadUsers();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: StaffUser) => {
    const nextStatus = user.is_active === 1 ? 0 : 1;
    try {
      await apiFetch(`/auth/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextStatus }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: nextStatus } : u))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.station_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (roleFilter === 'all') return true;
    if (roleFilter === 'leadership') {
      return ['hotel_owner', 'super_admin', 'hotel_admin', 'restaurant_manager'].includes(u.role);
    }
    if (roleFilter === 'kitchen') {
      return u.role.includes('chef') || u.role.includes('kitchen') || u.role.includes('cook');
    }
    if (roleFilter === 'floor') {
      return ['waiter', 'runner', 'service_staff', 'cashier'].includes(u.role);
    }
    if (roleFilter === 'logistics') {
      return ['driver', 'delivery_driver', 'dispatch_manager', 'inventory_officer', 'catering_director'].includes(u.role);
    }
    return true;
  });

  const activeStaffCount = users.filter((u) => u.is_active === 1).length;
  const kitchenStaffCount = users.filter((u) => u.role.includes('chef') || u.role.includes('kitchen')).length;
  const frontHouseCount = users.filter((u) => ['waiter', 'runner', 'service_staff', 'cashier'].includes(u.role)).length;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-3 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Users size={22} />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
                Staff RBAC & Team Access
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Authorized hospitality staff, departmental routing, station permissions, and security roles
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={loadUsers}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs whitespace-nowrap transition-colors"
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-colors"
            >
              <UserPlus size={15} />
              <span>Add Staff Member</span>
            </button>
          </div>
        </div>

        {/* 1. KPI SUMMARY STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider block">Total Team</span>
            <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 mt-1 block">{users.length}</span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">{activeStaffCount} Active Members</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-wider block">Culinary Line</span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">{kitchenStaffCount}</span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">{stations.length} Active Kitchen Stations</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold text-blue-500 uppercase tracking-wider block">Front of House</span>
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">{frontHouseCount}</span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">POS, Waiters & Runners</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-wider block">Security RBAC</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">100%</span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Encrypted Credentials</span>
          </div>
        </div>

        {/* 2. SEARCH & ROLE FILTER BAR */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0 no-scrollbar">
            {[
              { id: 'all', label: `All Staff (${users.length})` },
              { id: 'leadership', label: 'Leadership & Mgmt' },
              { id: 'kitchen', label: `Culinary & KDS (${kitchenStaffCount})` },
              { id: 'floor', label: `Front of House (${frontHouseCount})` },
              { id: 'logistics', label: 'Logistics & Events' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  roleFilter === tab.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
            <input
              type="text"
              placeholder="Search staff, email, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* 3. STAFF DIRECTORY TABLE (Desktop) & CARDS (Mobile) */}
        {loading ? (
          <div className="py-16 text-center text-xs text-stone-400 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80">
            <RotateCw size={24} className="animate-spin mx-auto mb-2 text-amber-600" />
            <span>Loading staff directory...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80">
            <Users size={32} className="mx-auto mb-2 text-stone-300 dark:text-stone-700" />
            <p className="text-sm font-bold text-stone-700 dark:text-stone-300">No staff members found.</p>
            <p className="text-xs text-stone-400 mt-1">Try adjusting your search criteria or add a new team member.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200 dark:border-stone-800">
                    <tr>
                      <th className="p-4">Staff Member</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Assigned Role</th>
                      <th className="p-4">Station / Department</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-150 dark:divide-stone-800">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-stone-900 dark:text-stone-100">{u.name}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-stone-500">{u.email}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 whitespace-nowrap">
                            {u.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-stone-600 dark:text-stone-400">
                          {u.station_name || u.outlet_name || 'All Outlets & Floor'}
                        </td>
                        <td className="p-4">
                          {u.is_active === 1 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px] whitespace-nowrap">
                              <CheckCircle size={13} />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-[11px] whitespace-nowrap">
                              <XCircle size={13} />
                              <span>Inactive</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                              u.is_active === 1
                                ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                            }`}
                          >
                            {u.is_active === 1 ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="md:hidden space-y-3">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block truncate">
                          {u.name}
                        </span>
                        <span className="text-xs font-mono text-stone-500 block truncate">{u.email}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 whitespace-nowrap shrink-0">
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                    <span>{u.station_name || 'Main Dining & Floor'}</span>
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        u.is_active === 1
                          ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {u.is_active === 1 ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ADD STAFF MEMBER MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Hospitality Staff Member"
        maxWidth="md"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              {formSuccess}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Staff Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. j.doe@hotel.com"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Initial Password *
            </label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Role & Department *
            </label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500"
            >
              <optgroup label="Leadership & Management">
                <option value="hotel_owner">Hotel Owner / GM</option>
                <option value="hotel_admin">Hotel Operations Admin</option>
                <option value="restaurant_manager">Restaurant Floor Manager</option>
              </optgroup>
              <optgroup label="Culinary & Kitchen">
                <option value="chef">Executive Head Chef</option>
                <option value="sous_chef">Sous Chef</option>
                <option value="kitchen_manager">Kitchen Manager</option>
                <option value="cook">Line Cook</option>
              </optgroup>
              <optgroup label="Front of House">
                <option value="cashier">Cashier / POS Terminal</option>
                <option value="waiter">Floor Waiter</option>
                <option value="food_runner">Food Runner</option>
                <option value="service_staff">General Service Staff</option>
              </optgroup>
              <optgroup label="Logistics & Events">
                <option value="delivery_driver">Delivery Driver</option>
                <option value="dispatch_manager">Delivery Dispatcher</option>
                <option value="catering_director">Catering Director</option>
                <option value="inventory_officer">Inventory Officer</option>
              </optgroup>
            </select>
          </div>

          {formRole.includes('chef') || formRole.includes('cook') || formRole.includes('kitchen') ? (
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Assigned Kitchen Station
              </label>
              <select
                value={formStationId}
                onChange={(e) => setFormStationId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500"
              >
                <option value="">All Kitchen Stations</option>
                {stations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
