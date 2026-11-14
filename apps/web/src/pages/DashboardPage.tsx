import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import {
  Eye,
  EyeOff,
  Plus,
  Wallet,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  PhoneCall,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FundWalletModal } from '../components/wallet/FundWalletModal';
import { apiClient } from '../lib/apiClient';

export const DashboardPage: React.FC = () => {
  const {
    user,
    isAuthLoading,
    wallet,
    ledger,
    hideBalance,
    toggleHideBalance,
    orders,
    activeNumbers,
    formatPrice,
    currency,
    setIsAuthModalOpen,
    refreshWallet,
    showToast
  } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<'all' | 'deposits' | 'orders'>('all');

  // Proactively refresh live wallet on dashboard mount
  useEffect(() => {
    if (user) {
      refreshWallet(user);
    }
  }, [user, refreshWallet]);

  // Handle Return from Payment Gateway (e.g. ?payment=success&checkout_id=...)
  useEffect(() => {
    const payment = searchParams.get('payment');
    const checkoutId = searchParams.get('checkout_id');

    if (payment === 'success' || checkoutId) {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      // Reconcile and refresh wallet from backend
      apiClient.reconcileWallet()
        .catch(() => {})
        .finally(() => {
          refreshWallet();
        });

      setPaymentNotice('Deposit confirmed! Your payment was verified and credited directly to your personal wallet.');
      showToast('Deposit successfully credited to your wallet!');

      // Remove query parameters from address bar cleanly without page reload
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('payment');
      nextParams.delete('checkout_id');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, refreshWallet, showToast, setSearchParams]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      setIsAuthModalOpen(true);
      navigate('/', { replace: true });
    }
  }, [isAuthLoading, user, navigate, setIsAuthModalOpen]);

  if (isAuthLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-oj-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-oj-muted">Restoring your secure session...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  const activeSessions = activeNumbers.filter(s => s.status === 'active' || s.status === 'sms_received');

  // Construct Unified Recent Activity Feed (Ledger Deposits + Store Orders)
  const activityItems = useMemo(() => {
    const items: Array<{
      id: string;
      category: 'deposit' | 'order' | 'refund';
      title: string;
      subtitle: string;
      reference: string;
      amountNgn: number;
      isCredit: boolean;
      timestamp: string;
      status: string;
      link: string;
      actionText?: string;
    }> = [];

    // 1. Add all ledger transactions (Deposits, Refunds, Payments)
    for (const tx of ledger) {
      const isDeposit = tx.category === 'deposit';
      const isRefund = tx.category === 'refund';
      items.push({
        id: `tx_${tx.id}`,
        category: isDeposit ? 'deposit' : isRefund ? 'refund' : 'order',
        title: tx.description,
        subtitle: `${isDeposit ? 'Wallet Deposit' : isRefund ? 'Wallet Refund' : 'Order Payment'} · ${new Date(tx.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`,
        reference: tx.reference,
        amountNgn: tx.amountNgn,
        isCredit: tx.type === 'credit',
        timestamp: tx.timestamp,
        status: tx.status || 'successful',
        link: '/wallet'
      });
    }

    // 2. Add store orders not already mirrored in ledger
    for (const ord of orders) {
      const alreadyInLedger = ledger.some(l => l.reference === ord.reference || (l as any).relatedOrderReference === ord.reference);
      if (!alreadyInLedger) {
        items.push({
          id: `ord_${ord.id}`,
          category: 'order',
          title: ord.items[0]?.product.title || 'Digital Product Order',
          subtitle: `Store Order (${ord.items.length} ${ord.items.length === 1 ? 'item' : 'items'}) · ${new Date(ord.createdAt).toLocaleDateString()}`,
          reference: ord.reference,
          amountNgn: ord.totalNgn,
          isCredit: false,
          timestamp: ord.createdAt,
          status: ord.status,
          link: '/orders',
          actionText: 'Reveal Key'
        });
      }
    }

    // Sort newest first
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [ledger, orders]);

  const filteredActivities = useMemo(() => {
    if (activityFilter === 'deposits') return activityItems.filter(i => i.category === 'deposit' || i.category === 'refund');
    if (activityFilter === 'orders') return activityItems.filter(i => i.category === 'order');
    return activityItems;
  }, [activityItems, activityFilter]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24 md:pb-12">
      {/* Payment Success Celebration Banner */}
      {paymentNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 text-xs font-bold shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{paymentNotice}</span>
          </div>
          <button
            onClick={() => setPaymentNotice(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-normal underline shrink-0"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Date & User Greeting */}
      <div>
        <p className="text-[11px] font-bold tracking-wider text-oj-muted dark:text-oj-dark-muted">
          {formattedDate}
        </p>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-oj-midnight dark:text-white mt-0.5 flex items-center gap-2">
          <span>Hello, {user.name.split(' ')[0]}</span>
          <span className="inline-block animate-bounce">👋</span>
        </h1>
        <p className="text-xs sm:text-sm text-oj-muted dark:text-oj-dark-muted mt-0.5">
          Here's what's happening with your Ojalogs account.
        </p>
      </div>

      {/* Hero Dark Wallet Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="wallet-card-bg rounded-card border border-oj-navy/60 dark:border-white/10 p-5 sm:p-6 shadow-card-dark text-white relative"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold tracking-wide text-slate-300">
            Ojalogs Personal Wallet
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{currency} Wallet</span>
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
              aria-label="Toggle balance visibility"
            >
              {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Only verified payments credit your wallet · Bank-grade security</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsFundModalOpen(true)}
            className="py-2.5 px-4 rounded-btn bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white text-xs font-bold shadow-glow-primary flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Fund wallet</span>
          </button>

          <Link
            to="/wallet"
            className="py-2.5 px-4 rounded-btn bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Wallet className="w-4 h-4 text-oj-cyan" />
            <span>View wallet</span>
          </Link>
        </div>
      </motion.div>

      {/* 2-Column KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-card bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-oj-muted dark:text-oj-dark-muted mb-1">
              Total orders
            </p>
            <p className="font-heading font-extrabold text-2xl text-oj-midnight dark:text-white">
              {wallet.lifetimePurchases}
            </p>
            <p className="text-[11px] text-oj-muted dark:text-oj-dark-muted mt-0.5">
              Lifetime purchases
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-card bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-oj-muted dark:text-oj-dark-muted mb-1">
              Monthly spend
            </p>
            <p className="font-heading font-extrabold text-2xl text-oj-midnight dark:text-white">
              {formatPrice(wallet.monthlySpendNgn)}
            </p>
            <p className="text-[11px] text-oj-muted dark:text-oj-dark-muted mt-0.5">
              Total verified spending
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-oj-primary/10 text-oj-primary dark:bg-oj-primary/20 dark:text-oj-cyan flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* Active Virtual Number Sessions Banner (Division B Live Tracker) */}
      {activeSessions.length > 0 && (
        <div className="p-4 rounded-card bg-gradient-to-r from-cyan-950/20 via-blue-950/20 to-oj-midnight/10 dark:from-cyan-950/40 dark:to-blue-950/40 border border-oj-cyan/30 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-oj-cyan animate-pulse" />
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-oj-midnight dark:text-white">
                Active Virtual SMS Listener
              </h3>
            </div>
            <Link
              to="/virtual-numbers"
              className="text-xs font-bold text-oj-primary dark:text-oj-cyan flex items-center gap-1 hover:underline"
            >
              <span>View details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeSessions.map((ses) => (
            <div
              key={ses.id}
              className="p-3 rounded-xl bg-white/80 dark:bg-oj-dark-surface/80 border border-oj-border dark:border-oj-dark-border flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{ses.country.flag}</span>
                <div>
                  <p className="font-mono font-bold text-xs text-oj-midnight dark:text-white">
                    {ses.phoneNumber}
                  </p>
                  <p className="text-[11px] text-oj-muted">
                    {ses.service.name} · {ses.status === 'sms_received' ? 'Code Received!' : 'Waiting for SMS'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                {ses.status === 'sms_received' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{ses.messages[0]?.code}</span>
                  </span>
                ) : (
                  <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                    {Math.floor(ses.timeRemainingSeconds / 60)}:{(ses.timeRemainingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discovery Promo Banner */}
      <Link
        to="/shop"
        className="block p-4 sm:p-5 rounded-card bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/20 hover:border-orange-500/40 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-oj-midnight dark:text-white">
                Find something new
              </h3>
              <p className="text-xs text-oj-muted dark:text-oj-dark-muted">
                Explore verified VPNs, AI tools, developer software & virtual numbers
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white dark:bg-oj-dark-surface shadow-sm flex items-center justify-center text-orange-600 group-hover:translate-x-1 transition-transform">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>

      {/* Recent Activity & Transactions Section */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white">
              Recent Activity & Transactions
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted dark:text-oj-dark-muted border border-oj-border dark:border-oj-dark-border">
              {filteredActivities.length} {filteredActivities.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-oj-surface-alt/70 dark:bg-oj-dark-surface-alt/70 border border-oj-border dark:border-oj-dark-border">
              <button
                onClick={() => setActivityFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  activityFilter === 'all'
                    ? 'bg-white dark:bg-oj-dark-surface text-oj-midnight dark:text-white shadow-xs'
                    : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActivityFilter('deposits')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  activityFilter === 'deposits'
                    ? 'bg-white dark:bg-oj-dark-surface text-oj-midnight dark:text-white shadow-xs'
                    : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
                }`}
              >
                Deposits
              </button>
              <button
                onClick={() => setActivityFilter('orders')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  activityFilter === 'orders'
                    ? 'bg-white dark:bg-oj-dark-surface text-oj-midnight dark:text-white shadow-xs'
                    : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
                }`}
              >
                Orders
              </button>
            </div>

            <Link
              to="/wallet"
              className="text-xs font-semibold text-oj-primary dark:text-oj-cyan hover:underline inline-flex items-center gap-0.5"
            >
              <span>Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-2.5">
          {filteredActivities.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-center space-y-3 shadow-soft">
              <div className="w-12 h-12 rounded-2xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted mx-auto flex items-center justify-center">
                <Clock className="w-6 h-6 text-oj-primary/60" />
              </div>
              <div className="space-y-1">
                <p className="font-heading font-bold text-sm text-oj-midnight dark:text-white">
                  No {activityFilter === 'all' ? 'recent' : activityFilter} activity yet
                </p>
                <p className="text-xs text-oj-muted dark:text-oj-dark-muted max-w-sm mx-auto leading-relaxed">
                  Your verified deposits, store purchases, and virtual number activities will appear here in real-time.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setIsFundModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-md hover:scale-[1.02] transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Fund Wallet</span>
                </button>
                <Link
                  to="/shop"
                  className="px-4 py-2 rounded-lg bg-oj-surface-alt dark:bg-oj-dark-surface-alt hover:bg-oj-border text-xs font-bold text-oj-midnight dark:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Explore Shop</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            filteredActivities.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft flex items-center justify-between gap-3 hover:border-oj-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.isCredit
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-blue-50 text-oj-primary dark:bg-blue-950/40 dark:text-oj-cyan'
                    }`}
                  >
                    {item.isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ShoppingBag className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-oj-midnight dark:text-white truncate">
                        {item.title}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                          item.isCredit
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.category === 'deposit' ? 'Deposit' : item.category === 'refund' ? 'Refund' : 'Order'}
                      </span>
                    </div>
                    <p className="text-[11px] text-oj-muted truncate mt-0.5">
                      {item.subtitle} · Ref: <span className="font-mono">{item.reference}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`font-mono font-extrabold text-xs sm:text-sm ${
                      item.isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-oj-midnight dark:text-white'
                    }`}
                  >
                    {item.isCredit ? '+' : '-'}{formatPrice(item.amountNgn)}
                  </p>
                  {item.actionText ? (
                    <Link
                      to={item.link}
                      className="text-[11px] font-bold text-oj-primary dark:text-oj-cyan hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>{item.actionText}</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Successful</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fund Modal */}
      <FundWalletModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
      />
    </div>
  );
};

