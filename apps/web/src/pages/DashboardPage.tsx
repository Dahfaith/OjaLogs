import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, Plus, Wallet, ShoppingBag, ArrowUpRight, ShieldCheck, Sparkles, ArrowRight, PhoneCall, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FundWalletModal } from '../components/wallet/FundWalletModal';

export const DashboardPage: React.FC = () => {
  const { user, wallet, hideBalance, toggleHideBalance, orders, activeNumbers } = useApp();
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  const activeSessions = activeNumbers.filter(s => s.status === 'active' || s.status === 'sms_received');

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24 md:pb-12">
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
            <span>NGN Wallet</span>
          </span>
        </div>

        <div className="mb-4">
          <p className="text-xs text-slate-400 font-medium mb-1">
            Available balance
          </p>
          <div className="flex items-center gap-3">
            <span className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-white">
              {hideBalance ? '••••••••' : `₦${wallet.balanceNgn.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
              ₦{wallet.monthlySpendNgn.toLocaleString('en-NG')}
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

      {/* Recent Orders Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white">
            Recent Orders & Deliveries
          </h2>
          <Link
            to="/orders"
            className="text-xs font-semibold text-oj-primary dark:text-oj-cyan hover:underline"
          >
            View all
          </Link>
        </div>

        {orders.slice(0, 3).map((order) => (
          <div
            key={order.id}
            className="p-3.5 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-oj-surface-alt dark:bg-oj-dark-surface-alt flex items-center justify-center text-oj-primary">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-oj-midnight dark:text-white">
                  {order.items[0]?.product.title || 'Digital Order'}
                </p>
                <p className="text-[11px] text-oj-muted">
                  Ref: <span className="font-mono">{order.reference}</span> · {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-mono font-bold text-xs text-oj-midnight dark:text-white">
                ₦{order.totalNgn.toLocaleString()}
              </p>
              <Link
                to="/orders"
                className="text-[11px] font-semibold text-oj-primary hover:underline"
              >
                Reveal Code
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Fund Modal */}
      <FundWalletModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
      />
    </div>
  );
};

