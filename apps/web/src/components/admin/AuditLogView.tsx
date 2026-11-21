import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RotateCw,
  Clock,
  User,
  Sliders,
  Wallet,
  Cpu,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { AdminAuditEntry } from '@ojalogs/shared';
import { apiClient } from '../../lib/apiClient';

interface AuditLogViewProps {
  showToast: (msg: string) => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ showToast }) => {
  const [logs, setLogs] = useState<AdminAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getAdminAuditLogs(100);
      setLogs(data);
    } catch (err: any) {
      console.warn(`[AUDIT_VIEW] Fetch notice: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesActor = (l.actorEmail || '').toLowerCase().includes(q);
        const matchesAction = (l.action || '').toLowerCase().includes(q);
        const matchesTarget = (l.target || '').toLowerCase().includes(q);
        const matchesDetails = (l.details || '').toLowerCase().includes(q);
        if (!matchesActor && !matchesAction && !matchesTarget && !matchesDetails) return false;
      }
      if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
      return true;
    });
  }, [logs, searchQuery, categoryFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'MARKUP_CHANGED':
        return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300';
      case 'WALLET_ADJUSTMENT':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300';
      case 'API_CONFIG_UPDATED':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300';
      case 'MANUAL_DISPATCH':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by admin email, action type, target or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Categories</option>
            <option value="pricing">Pricing & Markup</option>
            <option value="wallets">Wallets & Ledger</option>
            <option value="apis">APIs & Suppliers</option>
            <option value="security">Security & Core</option>
          </select>

          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Refresh Audit Trail"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Responsible Admin</th>
                <th className="py-3 px-4 font-semibold">Target Resource</th>
                <th className="py-3 px-4 font-semibold">Details & Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    {isLoading ? 'Loading audit entries...' : 'No administrative actions recorded yet.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString('en-GB')}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${getActionBadge(entry.action)}`}>
                        {entry.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                      {entry.actorEmail}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300 max-w-[160px] truncate">
                      {entry.target}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-md">
                      <p className="line-clamp-2">{entry.details}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
