import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Shield,
  Wallet,
  RotateCw
} from 'lucide-react';
import { AdminManagedUser, UserRole } from '@ojalogs/shared';
import { apiClient } from '../../lib/apiClient';

interface CustomersViewProps {
  users: AdminManagedUser[];
  onUserUpdated: (user: AdminManagedUser) => void;
  showToast: (msg: string) => void;
  onRefreshUsers: () => void;
  isRefreshing: boolean;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  users,
  onUserUpdated,
  showToast,
  onRefreshUsers,
  isRefreshing
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const formatPrice = (amount: number) => {
    return '₦' + (amount || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 });
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesEmail = (u.email || '').toLowerCase().includes(q);
        const matchesId = (u.id || '').toLowerCase().includes(q);
        if (!matchesEmail && !matchesId) return false;
      }
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      return true;
    });
  }, [users, searchQuery, statusFilter, roleFilter]);

  const handleToggleFreeze = async (user: AdminManagedUser) => {
    const newStatus = user.status === 'frozen' ? 'active' : 'frozen';
    try {
      await apiClient.updateUserStatus(user.id, newStatus);
      onUserUpdated({ ...user, status: newStatus });
      showToast(`User ${user.email} is now ${newStatus}.`);
    } catch (err: any) {
      showToast(`Failed to update status: ${err.message || 'Unknown error'}`);
    }
  };

  const handleChangeRole = async (user: AdminManagedUser, newRole: UserRole) => {
    try {
      await apiClient.updateUserRole(user.id, newRole);
      onUserUpdated({ ...user, role: newRole });
      showToast(`Role updated to ${newRole} for ${user.email}`);
    } catch (err: any) {
      showToast(`Failed to update role: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer email or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="administrator">Administrator</option>
          </select>

          <button
            onClick={onRefreshUsers}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Refresh Users"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Wallet Balance</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Joined Date</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isFrozen = user.status === 'frozen';
                  const isAdmin = user.role === 'administrator' || user.role === 'super_administrator';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-500/20">
                            {user.email?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {user.email}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{user.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={user.role || 'customer'}
                          onChange={(e) => handleChangeRole(user, e.target.value as UserRole)}
                          className="py-1 px-2 text-[11px] font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                          <option value="customer">Customer</option>
                          <option value="administrator">Administrator</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {formatPrice(user.balanceNgn)}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          user.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : isFrozen
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}>
                          {user.status || 'active'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'Nov 2026'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleFreeze(user)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                            isFrozen
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {isFrozen ? 'Unfreeze' : 'Freeze'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
