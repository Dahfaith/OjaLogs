import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  PackageCheck,
  Search,
  Eye,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Printer,
  ChevronDown,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OrdersPage: React.FC = () => {
  const { orders, revealSecret, showToast, formatPrice, currency, user, setIsAuthModalOpen } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const completedOrders = orders.filter(o => o.status === 'completed');
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'completed' && order.status !== 'completed') return false;
    if (activeTab === 'pending' && order.status !== 'pending' && order.status !== 'processing') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesRef = order.reference.toLowerCase().includes(q);
      const matchesProduct = order.items.some(i => i.product.title.toLowerCase().includes(q));
      if (!matchesRef && !matchesProduct) return false;
    }
    return true;
  });

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showToast('Vault secret copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 pb-24 md:pb-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-oj-primary/10 text-oj-primary dark:bg-oj-primary/20 dark:text-oj-cyan mx-auto flex items-center justify-center shadow-soft">
          <PackageCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-oj-midnight dark:text-white">
            Customer Orders & Vault Keys
          </h1>
          <p className="text-xs sm:text-sm text-oj-muted dark:text-oj-dark-muted max-w-md mx-auto leading-relaxed">
            Your delivered digital accounts, software license keys, and purchase receipts are encrypted and linked to your verified account. Please sign in or register to access your vault.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Zero password fatigue · Secure instant magic link / OTP</span>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3 rounded-btn bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white text-xs font-bold shadow-glow-primary transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In or Register with Email</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28 md:pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-oj-primary/10 text-oj-primary flex items-center justify-center">
            <PackageCheck className="w-4 h-4" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-oj-midnight dark:text-white">
            Customer Orders & Vault
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-oj-muted dark:text-oj-dark-muted">
          Access your delivered digital license keys, activation codes, and purchase invoices.
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-oj-surface-alt/60 dark:bg-oj-dark-surface-alt/60 border border-oj-border dark:border-oj-dark-border w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-oj-dark-surface text-oj-primary shadow-sm'
                : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-oj-dark-surface text-oj-primary shadow-sm'
                : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
            }`}
          >
            Completed ({completedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-oj-dark-surface text-oj-primary shadow-sm'
                : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
            }`}
          >
            Pending ({pendingOrders.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-oj-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ref or product..."
            className="w-full text-xs pl-8 pr-3 py-2 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-oj-dark-surface rounded-2xl border border-oj-border dark:border-oj-dark-border">
            <PackageCheck className="w-10 h-10 text-oj-muted mx-auto mb-2" />
            <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">
              No orders found
            </h3>
            <p className="text-xs text-oj-muted mt-0.5">
              Your purchased licenses and subscriptions will appear here.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-4"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-oj-border dark:border-oj-dark-border">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-oj-midnight dark:text-white">
                        {order.reference}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        ● Completed
                      </span>
                    </div>
                    <p className="text-[11px] text-oj-muted mt-0.5">
                      Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Method: {order.paymentMethod === 'wallet' ? `${currency} Wallet` : 'BACH Gateway'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-extrabold text-base text-oj-primary dark:text-oj-cyan">
                    {formatPrice(order.totalNgn)}
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-lg bg-oj-surface-alt dark:bg-oj-dark-surface-alt hover:bg-oj-border dark:hover:bg-oj-dark-border text-oj-muted hover:text-oj-midnight dark:hover:text-white transition-colors"
                    title="Print Invoice"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Order Items & Encrypted Vault Reveal */}
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-oj-surface-alt/40 dark:bg-oj-dark-surface-alt/40 border border-oj-border dark:border-oj-dark-border space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.coverImage}
                          alt={item.product.title}
                          className="w-12 h-12 rounded-lg object-cover border border-oj-border dark:border-oj-dark-border"
                        />
                        <div>
                          <p className="text-xs font-bold text-oj-midnight dark:text-white">{item.product.title}</p>
                          <p className="text-[11px] text-oj-muted font-mono">
                            Qty: {item.quantity} · {item.product.serverCluster} · {formatPrice(item.totalNgn)}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        ✓ Dispatched
                      </span>
                    </div>

                    {/* Vault Payload Box */}
                    {item.deliveredSecrets && item.deliveredSecrets.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-oj-midnight dark:bg-black/60 border border-oj-navy text-white space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Authorized License / Vault Key</span>
                          </span>
                          <span className="text-[10px] text-slate-400">Encrypted AES-256</span>
                        </div>

                        {item.deliveredSecrets.map((sec, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/40 border border-white/10">
                              <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-white">
                                {sec.revealed ? sec.value : '••••••••••••••••••••••••••••'}
                              </span>

                              <div className="flex items-center gap-1.5">
                                {!sec.revealed ? (
                                  <button
                                    onClick={() => revealSecret(order.id, item.id)}
                                    className="py-1 px-2.5 rounded-md bg-oj-primary text-white text-[11px] font-bold hover:bg-oj-primary-hover transition-colors flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Reveal Key</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleCopyKey(sec.value)}
                                    className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
                                    title="Copy Key"
                                  >
                                    {copiedKey === sec.value ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {sec.instruction}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

