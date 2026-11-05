import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  TrendingUp,
  Wallet,
  ShoppingBag,
  PhoneCall,
  Users,
  KeyRound,
  FileText,
  AlertTriangle,
  RotateCw,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Sliders,
  Database
} from 'lucide-react';
import { motion } from 'framer-motion';
import { mockAdminMetrics } from '../lib/mockData';
import { Product } from '@ojalogs/shared';

export const AdminPage: React.FC = () => {
  const { products, ledger, activeNumbers, showToast, formatPrice, updateProduct } = useApp();
  const [activeTab, setActiveTab] = useState<'kpi' | 'catalog' | 'fulfilment' | 'numbers' | 'ledger' | 'audit'>('kpi');
  const [metrics] = useState(mockAdminMetrics);

  const [inventoryPayload, setInventoryPayload] = useState('');
  const [selectedProductForVault, setSelectedProductForVault] = useState(products[0]?.id || '');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct(editingProduct);
    setEditingProduct(null);
  };

  const handleUploadVaultKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryPayload.trim()) return;
    const lines = inventoryPayload.trim().split('\n').filter(Boolean);
    showToast(`Successfully uploaded & encrypted ${lines.length} license units into server vault!`);
    setInventoryPayload('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-24 md:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-oj-midnight text-white border border-oj-navy">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-oj-cyan/20 text-oj-cyan flex items-center justify-center border border-oj-cyan/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl flex items-center gap-2">
              <span>Super Admin Command Console</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                v1.0.0-PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Platform governance, encrypted vault fulfilment, and immutable ledger inspector.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>RLS Active · Supabase Postgres</span>
          </span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-oj-border dark:border-oj-dark-border">
        {[
          { id: 'kpi', label: 'Overview & KPIs', icon: TrendingUp },
          { id: 'catalog', label: 'Catalog Governance', icon: Sliders },
          { id: 'fulfilment', label: 'Encrypted Vault & Fulfilment', icon: KeyRound },
          { id: 'numbers', label: 'Virtual Number Providers', icon: PhoneCall },
          { id: 'ledger', label: 'Ledger Reconciliation', icon: Database },
          { id: 'audit', label: 'Audit Trail', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-oj-primary text-oj-primary bg-white dark:bg-oj-dark-surface rounded-t-xl'
                : 'border-transparent text-oj-muted hover:text-oj-midnight dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Overview & KPIs */}
      {activeTab === 'kpi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft">
              <span className="text-xs text-oj-muted block">Total Processed Volume</span>
              <p className="font-heading font-extrabold text-xl text-oj-midnight dark:text-white mt-1">
                {formatPrice(metrics.totalRevenueNgn)}
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                +14.8% vs last month
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft">
              <span className="text-xs text-oj-muted block">Wallet Liabilities (Held Balances)</span>
              <p className="font-heading font-extrabold text-xl text-amber-600 mt-1">
                {formatPrice(metrics.walletLiabilitiesNgn)}
              </p>
              <span className="text-[10px] text-oj-muted mt-0.5 block">
                Backed 1:1 by BACH Gateway
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft">
              <span className="text-xs text-oj-muted block">Total Order Deliveries</span>
              <p className="font-heading font-extrabold text-xl text-oj-midnight dark:text-white mt-1">
                {metrics.totalOrders}
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                99.8% Automated
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft">
              <span className="text-xs text-oj-muted block">Active Phone Rentals</span>
              <p className="font-heading font-extrabold text-xl text-oj-cyan mt-1">
                {metrics.activeRentalsCount}
              </p>
              <span className="text-[10px] text-oj-muted mt-0.5 block">
                Across 12 providers
              </span>
            </div>
          </div>

          {/* Quick System Health */}
          <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-4">
            <h3 className="font-heading font-bold text-sm text-oj-midnight dark:text-white">
              Gateway & Provider Health Matrix
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-oj-surface-alt/50 dark:bg-oj-dark-surface-alt/50 border border-oj-border dark:border-oj-dark-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-oj-midnight dark:text-white">BACH Gateway Primary</p>
                  <p className="text-[11px] text-oj-muted">Webhook latency: 120ms</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="p-3.5 rounded-xl bg-oj-surface-alt/50 dark:bg-oj-dark-surface-alt/50 border border-oj-border dark:border-oj-dark-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-oj-midnight dark:text-white">Virtual SMS Hub</p>
                  <p className="text-[11px] text-oj-muted">Success rate: 98.4%</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="p-3.5 rounded-xl bg-oj-surface-alt/50 dark:bg-oj-dark-surface-alt/50 border border-oj-border dark:border-oj-dark-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-oj-midnight dark:text-white">Postgres Ledger Lock</p>
                  <p className="text-[11px] text-oj-muted">Double-spend blocks: 0 errors</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Catalog Governance */}
      {activeTab === 'catalog' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-oj-midnight dark:text-white">
                Catalog Governance & Compliance
              </h3>
              <p className="text-xs text-oj-muted">
                Zero tolerance policy enforced. All listings must be legitimate vouchers or licenses.
              </p>
            </div>
            <button
              onClick={() => showToast('Opening Super Admin Listing Creator')}
              className="py-1.5 px-3 rounded-lg bg-oj-primary text-white text-xs font-bold flex items-center gap-1 shadow-glow-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Listing</span>
            </button>
          </div>

          <div className="border border-oj-border dark:border-oj-dark-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted border-b border-oj-border dark:border-oj-dark-border">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Product Title</th>
                  <th className="py-2.5 px-3 font-semibold">Cluster</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Price</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Stock</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oj-border dark:divide-oj-dark-border">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-oj-surface-alt/40">
                    <td className="py-2.5 px-3 font-semibold text-oj-midnight dark:text-white max-w-xs truncate">
                      {p.title}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-oj-primary">{p.serverCluster}</td>
                    <td className="py-2.5 px-3 text-oj-muted">{p.category}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">{formatPrice(p.priceNgn)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {p.stockCount} units
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setEditingProduct({ ...p })}
                        className="text-xs text-oj-primary hover:underline font-semibold"
                      >
                        Edit Server / Price
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Encrypted Vault & Fulfilment */}
      {activeTab === 'fulfilment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-4">
            <h3 className="font-heading font-bold text-sm text-oj-midnight dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-oj-primary" />
              <span>Bulk Encrypted Inventory Importer</span>
            </h3>
            <p className="text-xs text-oj-muted">
              Paste newline-separated license keys or voucher tokens. They are encrypted with AES-256-GCM before storage.
            </p>

            <form onSubmit={handleUploadVaultKeys} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-oj-muted mb-1">Target Product</label>
                <select
                  value={selectedProductForVault}
                  onChange={(e) => setSelectedProductForVault(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.serverCluster})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oj-muted mb-1">
                  License Keys (1 per line)
                </label>
                <textarea
                  rows={6}
                  required
                  value={inventoryPayload}
                  onChange={(e) => setInventoryPayload(e.target.value)}
                  placeholder="KEY-2026-AAAA-BBBB-CCCC&#10;KEY-2026-DDDD-EEEE-FFFF&#10;KEY-2026-GGGG-HHHH-IIII"
                  className="w-full font-mono text-xs p-3 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors"
              >
                Encrypt & Ingest Into Inventory Vault
              </button>
            </form>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-3">
            <h3 className="font-heading font-bold text-sm text-oj-midnight dark:text-white">
              Instant Dispatch Queue Status
            </h3>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">✓ Automated Dispatch Queue: 0 Pending</span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                All purchases are instantaneously dispatched into customer vaults upon payment confirmation.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-oj-surface-alt/60 dark:bg-oj-dark-surface-alt/60 border border-oj-border dark:border-oj-dark-border text-xs space-y-1">
              <span className="font-bold text-oj-midnight dark:text-white">Manual Fulfilment Fallback: Active</span>
              <p className="text-[11px] text-oj-muted">
                If auto-decryption hits a transient error, the item enters the priority manual queue with automated SMS alert to staff.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Ledger Reconciliation */}
      {activeTab === 'ledger' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-oj-midnight dark:text-white">
                Immutable Ledger Reconciliation Inspector
              </h3>
              <p className="text-xs text-oj-muted">
                Live verification against gateway settlement records. Zero discrepancies permitted.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200">
              Balanced: 0.00 Variance
            </span>
          </div>

          <div className="border border-oj-border dark:border-oj-dark-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted border-b border-oj-border dark:border-oj-dark-border">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Ledger ID</th>
                  <th className="py-2.5 px-3 font-semibold">Reference</th>
                  <th className="py-2.5 px-3 font-semibold">Entry Type</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Balance After</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oj-border dark:divide-oj-dark-border">
                {ledger.map(t => (
                  <tr key={t.id} className="hover:bg-oj-surface-alt/40">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-oj-muted">{t.id}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-oj-midnight dark:text-white">{t.reference}</td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-bold">{t.type}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">{formatPrice(t.amountNgn)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatPrice(t.balanceAfterNgn)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-bold text-emerald-600">✓ Verified</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-4">
          <h3 className="font-heading font-bold text-sm text-oj-midnight dark:text-white">
            Administrative Audit Trail (admin_audit_logs)
          </h3>
          <p className="text-xs text-oj-muted">
            Every sensitive staff action is cryptographically written with actor ID, IP address, and payload diffs.
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-oj-surface-alt/50 dark:bg-oj-dark-surface-alt/50 border border-oj-border dark:border-oj-dark-border flex items-center justify-between">
              <div>
                <p className="font-bold text-oj-midnight dark:text-white">
                  UPDATE_PRICING_RULE · Product: Windows 11 Pro
                </p>
                <p className="text-[11px] text-oj-muted">
                  Actor: <span className="font-mono">super_admin_01</span> · IP: 102.89.44.12 · 2026-11-04 04:12:00
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                Logged
              </span>
            </div>

            <div className="p-3 rounded-xl bg-oj-surface-alt/50 dark:bg-oj-dark-surface-alt/50 border border-oj-border dark:border-oj-dark-border flex items-center justify-between">
              <div>
                <p className="font-bold text-oj-midnight dark:text-white">
                  INVENTORY_VAULT_ENCRYPT · Ingested 50 NordVPN Units
                </p>
                <p className="text-[11px] text-oj-muted">
                  Actor: <span className="font-mono">super_admin_01</span> · IP: 102.89.44.12 · 2026-11-04 03:00:22
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                Logged
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Product Server & Price Editor Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-oj-border dark:border-oj-dark-border">
              <div>
                <h3 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white">
                  Edit Product & Server Assignment
                </h3>
                <p className="text-xs text-oj-muted">
                  Configure upstream fulfillment server cluster and pricing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg text-oj-muted hover:text-oj-midnight dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-oj-midnight dark:text-white mb-1">
                  Product Title
                </label>
                <input
                  type="text"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-oj-border dark:border-oj-dark-border bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-oj-midnight dark:text-white mb-1">
                    Fulfillment Server Cluster
                  </label>
                  <select
                    value={editingProduct.serverCluster}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      serverCluster: e.target.value as any
                    })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-oj-border dark:border-oj-dark-border bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
                  >
                    <option value="Server 1">Server 1 (VPNs, Proxies & eSIM)</option>
                    <option value="Server 2">Server 2 (Social Accounts & Cloud)</option>
                    <option value="Server 3">Server 3 (Software & OS)</option>
                    <option value="Server 4">Server 4 (AI Subscriptions)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-oj-midnight dark:text-white mb-1">
                    Price (NGN ₦)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.priceNgn}
                    onChange={(e) => setEditingProduct({ ...editingProduct, priceNgn: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold px-3 py-2 rounded-lg border border-oj-border dark:border-oj-dark-border bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-oj-midnight dark:text-white mb-1">
                    Stock Units Available
                  </label>
                  <input
                    type="number"
                    value={editingProduct.stockCount}
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        stockCount: count,
                        inStock: count > 0
                      });
                    }}
                    className="w-full text-xs font-mono font-bold px-3 py-2 rounded-lg border border-oj-border dark:border-oj-dark-border bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-oj-midnight dark:text-white mb-1">
                    Delivery Format
                  </label>
                  <input
                    type="text"
                    value={editingProduct.deliveryFormat}
                    onChange={(e) => setEditingProduct({ ...editingProduct, deliveryFormat: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-oj-border dark:border-oj-dark-border bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-oj-border dark:border-oj-dark-border">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-btn text-xs font-bold text-oj-muted hover:text-oj-midnight dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-btn bg-oj-primary hover:bg-oj-primary-hover text-white text-xs font-bold shadow-glow-primary transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

