import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet,
  Plus,
  FileSpreadsheet,
  ShieldCheck,
  RotateCw,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { FundWalletModal } from '../components/wallet/FundWalletModal';
import { StatementModal } from '../components/wallet/StatementModal';

export const WalletPage: React.FC = () => {
  const { user, isAuthLoading, wallet, ledger, orders, hideBalance, toggleHideBalance, formatPrice, currency, setIsAuthModalOpen, refreshWallet } = useApp();
  const [isFundOpen, setIsFundOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'deposit' | 'order_payment' | 'refund'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshWallet(user);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Unified Transaction History: Merges ledger transactions and customer store purchases
  const unifiedLedger = useMemo(() => {
    const list = [...ledger];
    if (Array.isArray(orders)) {
      for (const ord of orders) {
        const alreadyInLedger = list.some(
          l => l.reference === ord.reference || (l as any).relatedOrderReference === ord.reference
        );
        if (!alreadyInLedger) {
          const firstItem = ord.items?.[0];
          const title = firstItem?.product?.title || 'Store Digital Product';
          const count = ord.items?.length || 1;
          list.push({
            id: `ord_${ord.id}`,
            reference: ord.reference,
            type: 'debit',
            category: 'order_payment',
            amountNgn: ord.totalNgn,
            balanceAfterNgn: Math.max(0, (wallet?.balanceNgn || 0)),
            description: `${title} (${count} item${count === 1 ? '' : 's'})`,
            status: (ord.status === 'completed' || ord.status === 'processing')
              ? 'successful'
              : (ord.status === 'cancelled' || ord.status === 'refunded')
              ? 'refunded'
              : ord.status === 'failed'
              ? 'failed'
              : 'pending',
            timestamp: ord.createdAt
          });
        }
      }
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [ledger, orders, wallet?.balanceNgn]);

  const filteredLedger = unifiedLedger.filter(tx => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'deposit') return tx.category === 'deposit';
    if (selectedFilter === 'order_payment') return tx.category === 'order_payment' || tx.category === 'virtual_number_order';
    if (selectedFilter === 'refund') return tx.category === 'refund';
    return true;
  });

  if (isAuthLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-oj-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-oj-muted">Restoring your secure session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 pb-24 md:pb-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-soft">
          <Wallet className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-oj-midnight dark:text-white">
            Personal Multi-Currency Wallet
          </h1>
          <p className="text-xs sm:text-sm text-oj-muted dark:text-oj-dark-muted max-w-md mx-auto leading-relaxed">
            Fund your wallet securely via BACH Payment Gateway, manage multi-currency exchange balances, and review full immutable financial ledgers. Please sign in or register to access your wallet.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Bank-grade security · Dedicated dynamic accounts</span>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3 rounded-btn bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white text-xs font-bold shadow-glow-primary transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In or Open Wallet</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28 md:pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-oj-muted dark:text-oj-dark-muted">
            YOUR MONEY, SIMPLIFIED
          </p>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-oj-midnight dark:text-white mt-0.5">
            My Wallet
          </h1>
          <p className="text-xs sm:text-sm text-oj-muted dark:text-oj-dark-muted mt-0.5">
            Fund your balance and see every transaction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="w-9 h-9 rounded-xl border border-oj-border dark:border-oj-dark-border bg-white dark:bg-oj-dark-surface flex items-center justify-center text-oj-muted hover:text-oj-midnight dark:hover:text-white transition-colors"
            title="Refresh balance"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Secured</span>
          </span>
        </div>
      </div>

      {/* Dark Wallet Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="wallet-card-bg rounded-card border border-oj-navy/60 dark:border-white/10 p-5 sm:p-6 shadow-card-dark text-white relative"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-300">
            Personal NGN wallet
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{currency}</span>
          </span>
        </div>

        <div className="mb-4">
          <p className="text-xs text-slate-400 font-medium mb-1">
            Available balance
          </p>
          <div className="flex items-center gap-3">
            <span className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-white">
              {hideBalance ? '••••••••' : formatPrice(wallet.balanceNgn)}
            </span>
            <button
              onClick={toggleHideBalance}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
              title={hideBalance ? 'Show balance' : 'Hide balance'}
            >
              {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Available after verified payment · Zero hidden deduction</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsFundOpen(true)}
            className="py-2.5 px-4 rounded-btn bg-gradient-to-r from-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add money</span>
          </button>

          <button
            onClick={() => setIsStatementOpen(true)}
            className="py-2.5 px-4 rounded-btn bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <FileSpreadsheet className="w-4 h-4 text-oj-cyan" />
            <span>Statement</span>
          </button>
        </div>
      </motion.div>

      {/* Safe Funding Details Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-xs sm:text-sm text-oj-midnight dark:text-white">
            Safe, one-time funding details
          </h3>
          <p className="text-xs text-oj-muted dark:text-oj-dark-muted mt-0.5 leading-relaxed">
            A new temporary bank account is provided by the payment provider for each funding request. Funds are credited only after verification.
          </p>
        </div>
      </div>

      {/* How Funding Works 3-Step Guide */}
      <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-4">
        <h3 className="font-heading font-bold text-sm text-oj-midnight dark:text-white">
          How funding works
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-oj-surface-alt/50 dark:bg-oj-dark-surface-alt/50 border border-oj-border dark:border-oj-dark-border flex gap-3">
            <span className="font-mono font-bold text-xs text-orange-600 bg-orange-100 dark:bg-orange-950/60 dark:text-orange-400 px-2 py-1 rounded-md h-fit">
              01
            </span>
            <div>
              <p className="font-heading font-bold text-xs text-oj-midnight dark:text-white">Choose an amount</p>
              <p className="text-[11px] text-oj-muted mt-0.5">Enter the value you'd like to deposit.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-oj-surface-alt/50 dark:bg-oj-dark-surface-alt/50 border border-oj-border dark:border-oj-dark-border flex gap-3">
            <span className="font-mono font-bold text-xs text-orange-600 bg-orange-100 dark:bg-orange-950/60 dark:text-orange-400 px-2 py-1 rounded-md h-fit">
              02
            </span>
            <div>
              <p className="font-heading font-bold text-xs text-oj-midnight dark:text-white">Make transfer</p>
              <p className="text-[11px] text-oj-muted mt-0.5">Send funds to the temporary BACH bank account.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-oj-surface-alt/50 dark:bg-oj-dark-surface-alt/50 border border-oj-border dark:border-oj-dark-border flex gap-3">
            <span className="font-mono font-bold text-xs text-orange-600 bg-orange-100 dark:bg-orange-950/60 dark:text-orange-400 px-2 py-1 rounded-md h-fit">
              03
            </span>
            <div>
              <p className="font-heading font-bold text-xs text-oj-midnight dark:text-white">Instant credit</p>
              <p className="text-[11px] text-oj-muted mt-0.5">Automated webhook verification credits your wallet.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History & Filter Chips */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white">
              Immutable Transaction Ledger
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted dark:text-oj-dark-muted border border-oj-border dark:border-oj-dark-border">
              {filteredLedger.length} {filteredLedger.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${selectedFilter === 'all'
                  ? 'bg-oj-primary text-white shadow-sm'
                  : 'bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted hover:text-oj-midnight dark:hover:text-white'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('deposit')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${selectedFilter === 'deposit'
                  ? 'bg-oj-primary text-white shadow-sm'
                  : 'bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted hover:text-oj-midnight dark:hover:text-white'
                }`}
            >
              Deposits
            </button>
            <button
              onClick={() => setSelectedFilter('order_payment')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${selectedFilter === 'order_payment'
                  ? 'bg-oj-primary text-white shadow-sm'
                  : 'bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted hover:text-oj-midnight dark:hover:text-white'
                }`}
            >
              Purchases
            </button>
            <button
              onClick={() => setSelectedFilter('refund')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${selectedFilter === 'refund'
                  ? 'bg-oj-primary text-white shadow-sm'
                  : 'bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted hover:text-oj-midnight dark:hover:text-white'
                }`}
            >
              Refunds
            </button>
          </div>
        </div>

        {/* Ledger List */}
        <div className="space-y-2.5">
          {filteredLedger.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-center space-y-3 shadow-soft">
              <div className="w-12 h-12 rounded-2xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted mx-auto flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-oj-primary/60" />
              </div>
              <div className="space-y-1">
                <p className="font-heading font-bold text-sm text-oj-midnight dark:text-white">
                  No {selectedFilter === 'all' ? '' : selectedFilter.replace('_', ' ')} transactions found
                </p>
                <p className="text-xs text-oj-muted dark:text-oj-dark-muted max-w-sm mx-auto leading-relaxed">
                  {selectedFilter === 'all'
                    ? 'Your verified deposits, store checkouts, and system refunds are cryptographically tracked in this ledger.'
                    : `No records found under "${selectedFilter.replace('_', ' ')}". Switch to "All" to inspect your entire financial timeline.`}
                </p>
              </div>
              {selectedFilter !== 'all' ? (
                <button
                  onClick={() => setSelectedFilter('all')}
                  className="px-4 py-2 rounded-lg bg-oj-surface-alt dark:bg-oj-dark-surface-alt hover:bg-oj-border text-xs font-bold text-oj-midnight dark:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <span>View All Records</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsFundOpen(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-md hover:scale-[1.02] transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Fund Wallet</span>
                </button>
              )}
            </div>
          ) : (
            filteredLedger.map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft flex items-center justify-between gap-3 hover:border-oj-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'credit'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                      : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                    }`}>
                    {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-oj-midnight dark:text-white">
                        {tx.description}
                      </p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tx.category === 'deposit'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : tx.category === 'refund'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                        {tx.category === 'order_payment' ? 'Purchase' : tx.category.charAt(0).toUpperCase() + tx.category.slice(1)}
                      </span>
                    </div>
                    <p className="text-[11px] text-oj-muted mt-0.5">
                      Ref: <span className="font-mono">{tx.reference}</span> · {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={`font-mono font-extrabold text-xs sm:text-sm ${tx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-oj-midnight dark:text-white'
                    }`}>
                    {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amountNgn)}
                  </p>
                  <p className="text-[10px] font-mono text-oj-muted">
                    Balance: {formatPrice(tx.balanceAfterNgn)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <FundWalletModal
        isOpen={isFundOpen}
        onClose={() => setIsFundOpen(false)}
      />

      <StatementModal
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
      />
    </div>
  );
};

