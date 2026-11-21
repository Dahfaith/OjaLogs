import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Search,
  PlusCircle,
  MinusCircle,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { AdminManagedUser } from '@ojalogs/shared';
import { apiClient } from '../../lib/apiClient';

interface WalletsLedgerViewProps {
  users: AdminManagedUser[];
  onUserBalanceUpdated: (userId: string, newBalance: number) => void;
  showToast: (msg: string) => void;
  adminEmail?: string;
}

export const WalletsLedgerView: React.FC<WalletsLedgerViewProps> = ({
  users,
  onUserBalanceUpdated,
  showToast,
  adminEmail = 'admin@ojalogs.com.ng'
}) => {
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminManagedUser | null>(null);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmAdjust, setShowConfirmAdjust] = useState(false);

  // Financial Stats
  const totalCustomerLiabilities = useMemo(() => {
    return users.reduce((sum, u) => sum + (u.balanceNgn || 0), 0);
  }, [users]);

  const activeAccountsCount = users.filter(u => (u.balanceNgn || 0) > 0).length;

  const formatPrice = (amount: number) => {
    return '₦' + (amount || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 });
  };

  const handleOpenAdjustment = (user?: AdminManagedUser) => {
    setSelectedCustomer(user || users[0] || null);
    setAdjustType('credit');
    setAdjustAmount('');
    setAdjustReason('');
    setIsAdjustModalOpen(true);
    setShowConfirmAdjust(false);
  };

  const handleExecuteAdjustment = async () => {
    if (!selectedCustomer) {
      showToast('Please select a customer');
      return;
    }
    const amt = Number(adjustAmount);
    if (!amt || amt <= 0) {
      showToast('Amount must be greater than zero');
      return;
    }
    if (!adjustReason.trim()) {
      showToast('A mandatory administrative reason is required');
      return;
    }
    if (adjustType === 'debit' && amt > (selectedCustomer.balanceNgn || 0)) {
      showToast('Debit amount exceeds customer wallet balance');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.adjustUserBalance(
        selectedCustomer.id,
        amt,
        adjustType,
        adjustReason.trim()
      );
      const newBal = res.balanceNgn ?? (adjustType === 'credit' ? selectedCustomer.balanceNgn + amt : selectedCustomer.balanceNgn - amt);
      onUserBalanceUpdated(selectedCustomer.id, newBal);
      showToast(`Successfully ${adjustType === 'credit' ? 'credited' : 'debited'} ${formatPrice(amt)} for ${selectedCustomer.email}. Reason: ${adjustReason.trim()}`);
      setIsAdjustModalOpen(false);
      setShowConfirmAdjust(false);
    } catch (err: any) {
      showToast(`Adjustment failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Customer Liabilities</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold font-heading text-slate-900 dark:text-white">
            {formatPrice(totalCustomerLiabilities)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Across {users.length} registered customer accounts
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Funded Accounts</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400">
            {activeAccountsCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Wallets currently holding positive balances
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Admin Actions</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
              Audited
            </span>
          </div>
          <div className="mt-2">
            <button
              onClick={() => handleOpenAdjustment()}
              className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Manual Balance Adjustment</span>
            </button>
          </div>
          <p className="mt-1 text-[10px] text-slate-400 text-center">
            Requires mandatory reason & recorded in audit log
          </p>
        </div>
      </div>

      {/* Customer Wallets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
              Customer Wallet Balances
            </h3>
            <p className="text-xs text-slate-500">
              Live balances and manual credit/debit adjustment actions
            </p>
          </div>

          <div className="relative max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customers..."
              value={ledgerSearch}
              onChange={(e) => setLedgerSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 font-semibold">Customer</th>
                <th className="py-2.5 px-4 font-semibold">User ID</th>
                <th className="py-2.5 px-4 font-semibold">Current Balance</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users
                .filter(u => {
                  const q = ledgerSearch.toLowerCase().trim();
                  if (!q) return true;
                  return (u.email || '').toLowerCase().includes(q) || (u.id || '').toLowerCase().includes(q);
                })
                .map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {user.email}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                      {user.id}
                    </td>
                    <td className="py-2.5 px-4 font-bold font-mono text-slate-900 dark:text-white">
                      {formatPrice(user.balanceNgn)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        user.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : user.status === 'frozen'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                      }`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenAdjustment(user)}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 transition-colors"
                      >
                        Adjust Balance
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Balance Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center border border-teal-500/20">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    Manual Customer Wallet Adjustment
                  </h3>
                  <p className="text-xs text-slate-500">Permanent audited balance modification</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Select Customer */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Target Customer</label>
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const u = users.find(x => x.id === e.target.value);
                    if (u) setSelectedCustomer(u);
                  }}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.email} (Balance: {formatPrice(u.balanceNgn)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Credit / Debit Buttons */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setAdjustType('credit')}
                    className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      adjustType === 'credit'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Credit (+) Customer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('debit')}
                    className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      adjustType === 'debit'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>Debit (-) Customer</span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Amount (NGN)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₦</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5000"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Mandatory Administrative Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Customer bank transfer verified manually, ref #tx_98234..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Calculation Preview */}
              {selectedCustomer && adjustAmount && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Balance:</span>
                    <span className="font-mono font-semibold">{formatPrice(selectedCustomer.balanceNgn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{adjustType === 'credit' ? 'Credit Added:' : 'Debit Deducted:'}</span>
                    <span className={`font-mono font-bold ${adjustType === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {adjustType === 'credit' ? '+' : '-'}{formatPrice(Number(adjustAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold">
                    <span>New Balance After Adjustment:</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400">
                      {formatPrice(
                        adjustType === 'credit'
                          ? selectedCustomer.balanceNgn + Number(adjustAmount)
                          : Math.max(0, selectedCustomer.balanceNgn - Number(adjustAmount))
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmAdjust(true)}
                disabled={!adjustAmount || !adjustReason.trim()}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors disabled:opacity-50"
              >
                Review & Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Step */}
      {showConfirmAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Confirm Wallet Adjustment
                </h3>
                <p className="text-xs text-slate-500">This action will be permanently audited</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Administrator:</span>
                <span className="font-bold text-slate-900 dark:text-white">{adminEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCustomer?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action:</span>
                <span className={`font-bold uppercase ${adjustType === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {adjustType} {formatPrice(Number(adjustAmount))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reason:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 italic">{adjustReason}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmAdjust(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleExecuteAdjustment}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Recording...' : 'Authorize & Execute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
