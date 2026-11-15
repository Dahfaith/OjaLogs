import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  PackageCheck,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Printer,
  ChevronDown,
  KeyRound,
  ExternalLink,
  Download,
  FileText,
  User,
  Lock,
  Smartphone,
  Shield,
  Mail,
  Sparkles,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandCoverBanner } from '../components/common/BrandCoverBanner';

interface ParsedField {
  label: string;
  value: string;
  type: 'uid' | 'password' | '2fa' | 'email' | 'token' | 'key' | 'generic';
  isSensitive?: boolean;
}

function parseSecretValue(secret: string): { isStructured: boolean; fields: ParsedField[]; raw: string } {
  if (!secret) return { isStructured: false, fields: [], raw: '' };
  const raw = secret.trim();

  // Colon-separated credential parsing (e.g. UID:Password:2FA:Email:EmailPass)
  if (raw.includes(':') && !raw.startsWith('http://') && !raw.startsWith('https://')) {
    const parts = raw.split(':').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const fields: ParsedField[] = [];

      // Part 1: Typically UID or Username or Email
      if (parts[0].includes('@')) {
        fields.push({ label: 'Login Email', value: parts[0], type: 'email' });
      } else if (/^\d{6,25}$/.test(parts[0])) {
        fields.push({ label: 'User ID (UID)', value: parts[0], type: 'uid' });
      } else {
        fields.push({ label: 'Account Username / ID', value: parts[0], type: 'uid' });
      }

      // Part 2: Password
      if (parts[1]) {
        fields.push({ label: 'Account Password', value: parts[1], type: 'password', isSensitive: true });
      }

      // Part 3: 2FA Secret Key or Recovery Email
      if (parts[2]) {
        if (parts[2].includes('@')) {
          fields.push({ label: 'Recovery Email', value: parts[2], type: 'email' });
        } else if (parts[2].length >= 10) {
          fields.push({ label: '2FA Secret Key (for 2fa.live)', value: parts[2], type: '2fa' });
        } else {
          fields.push({ label: 'Security Key / 2FA', value: parts[2], type: '2fa' });
        }
      }

      // Part 4: Recovery Email or 2FA or Token
      if (parts[3]) {
        if (parts[3].includes('@')) {
          fields.push({ label: 'Recovery Email', value: parts[3], type: 'email' });
        } else if (fields.some(f => f.type === 'email')) {
          fields.push({ label: 'Email Password', value: parts[3], type: 'password', isSensitive: true });
        } else {
          fields.push({ label: 'Extra Info / Token', value: parts[3], type: 'token' });
        }
      }

      // Part 5: Email Password / Session Cookies
      if (parts[4]) {
        fields.push({ label: 'Email Password / Session', value: parts[4], type: 'password', isSensitive: true });
      }

      // Extra fields
      for (let i = 5; i < parts.length; i++) {
        fields.push({ label: `Field ${i + 1}`, value: parts[i], type: 'generic' });
      }

      return { isStructured: true, fields, raw };
    }
  }

  // Pipe-separated credential parsing (e.g. Username|Password|2FA)
  if (raw.includes('|')) {
    const parts = raw.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const fields: ParsedField[] = [
        { label: 'Username / UID', value: parts[0], type: 'uid' },
        { label: 'Account Password', value: parts[1], type: 'password', isSensitive: true }
      ];
      if (parts[2]) fields.push({ label: '2FA Secret Key (for 2fa.live)', value: parts[2], type: '2fa' });
      if (parts[3]) fields.push({ label: 'Recovery Email', value: parts[3], type: 'email' });
      return { isStructured: true, fields, raw };
    }
  }

  return {
    isStructured: false,
    fields: [{ label: 'License / Vault Key', value: raw, type: 'key' }],
    raw
  };
}

export const OrdersPage: React.FC = () => {
  const { orders, revealSecret, showToast, formatPrice, currency, user, setIsAuthModalOpen } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

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

  const handleCopy = (text: string, id: string, label: string = 'Credentials') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadTxt = (order: any, item: any, secretVal: string, instruction?: string) => {
    const parsed = parseSecretValue(secretVal);
    let content = `=======================================================\n`;
    content += `OJALOGS DIGITAL ORDER RECEIPT & CREDENTIALS VAULT\n`;
    content += `=======================================================\n\n`;
    content += `Order Reference:   ${order.reference}\n`;
    content += `Product:           ${item.product.title}\n`;
    content += `Server Cluster:    ${item.product.serverCluster || 'Server 2'}\n`;
    content += `Purchase Date:     ${new Date(order.createdAt).toLocaleString()}\n`;
    content += `Payment Method:    ${order.paymentMethod === 'wallet' ? 'NGN Wallet' : 'BACH Gateway'}\n`;
    content += `Amount Paid:       NGN ${item.totalNgn || order.totalNgn}\n\n`;
    content += `-------------------------------------------------------\n`;
    content += `DELIVERED ACCOUNT CREDENTIALS:\n`;
    content += `-------------------------------------------------------\n`;

    if (parsed.isStructured) {
      parsed.fields.forEach(f => {
        content += `${f.label.padEnd(25)}: ${f.value}\n`;
      });
      content += `\nFULL RAW STRING: ${parsed.raw}\n`;
    } else {
      content += `SECRET / KEY: ${parsed.raw}\n`;
    }

    if (instruction) {
      content += `\n-------------------------------------------------------\n`;
      content += `USAGE INSTRUCTIONS:\n`;
      content += `-------------------------------------------------------\n`;
      content += `${instruction}\n`;
    }

    content += `\nQUICK 2FA INSTRUCTIONS:\n`;
    content += `1. Go to https://2fa.live\n`;
    content += `2. Paste your 2FA Secret Key into the input box.\n`;
    content += `3. Click 'Submit' to receive your live 6-digit authentication code.\n\n`;
    content += `=======================================================\n`;
    content += `Verified & Delivered by Ojalogs Marketplace (ojalogs.com.ng)\n`;
    content += `=======================================================\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ojalogs-${order.reference}-${item.id.slice(-6)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Downloaded credentials backup file (.txt)!');
  };

  const getCopyAllText = (order: any, item: any, secretVal: string): string => {
    const parsed = parseSecretValue(secretVal);
    if (!parsed.isStructured) return parsed.raw;

    const lines = [
      `[OJALOGS ORDER ${order.reference}] - ${item.product.title}`,
      ...parsed.fields.map(f => `${f.label}: ${f.value}`),
      `Raw: ${parsed.raw}`
    ];
    return lines.join('\n');
  };

  const getPlatformLoginUrl = (title: string): string | null => {
    const t = title.toLowerCase();
    if (t.includes('facebook') || t.includes('fb') || t.includes('meta')) return 'https://facebook.com';
    if (t.includes('instagram')) return 'https://instagram.com';
    if (t.includes('twitter') || t.includes('x.com')) return 'https://x.com';
    if (t.includes('tiktok')) return 'https://tiktok.com';
    if (t.includes('gmail') || t.includes('google')) return 'https://mail.google.com';
    if (t.includes('telegram') || t.includes('tg')) return 'https://web.telegram.org';
    return null;
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
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-5 sm:py-6 space-y-6 pb-28 md:pb-12 overflow-x-hidden">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-oj-primary to-blue-600 text-white flex items-center justify-center shadow-md shadow-oj-primary/20">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-oj-midnight dark:text-white tracking-tight">
              Customer Orders & Vault
            </h1>
            <p className="text-[11px] sm:text-xs text-oj-muted dark:text-oj-dark-muted">
              Access and copy your delivered digital accounts, license keys, and purchase receipts.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-oj-surface-alt/70 dark:bg-oj-dark-surface-alt/70 border border-oj-border dark:border-oj-dark-border w-full sm:w-fit overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white dark:bg-oj-dark-surface text-oj-primary dark:text-white shadow-sm'
                : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-oj-dark-surface text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
            }`}
          >
            Completed ({completedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-oj-dark-surface text-amber-600 dark:text-amber-400 shadow-sm'
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
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary transition-all"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-10 sm:p-14 text-center bg-white dark:bg-oj-dark-surface rounded-2xl border border-oj-border dark:border-oj-dark-border shadow-soft">
            <PackageCheck className="w-12 h-12 text-oj-muted/60 mx-auto mb-3" />
            <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">
              No orders found
            </h3>
            <p className="text-xs text-oj-muted mt-1 max-w-sm mx-auto">
              Your purchased accounts, software licenses, and 2FA credentials will appear here automatically upon payment verification.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft overflow-hidden"
            >
              {/* Order Card Header */}
              <div className="p-4 sm:p-5 bg-oj-surface-alt/40 dark:bg-oj-dark-surface-alt/40 border-b border-oj-border dark:border-oj-dark-border flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-extrabold text-sm sm:text-base text-oj-midnight dark:text-white">
                      {order.reference}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Completed
                    </span>
                  </div>
                  <p className="text-[11px] text-oj-muted font-medium">
                    Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Method: {order.paymentMethod === 'wallet' ? `${currency} Wallet` : 'BACH Gateway'}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                  <span className="font-mono font-black text-base sm:text-lg text-oj-primary dark:text-oj-cyan">
                    {formatPrice(order.totalNgn)}
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border hover:border-oj-primary/50 text-oj-muted hover:text-oj-midnight dark:hover:text-white transition-all shadow-sm"
                    title="Print / Save Invoice"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Order Items & Encrypted Vault Reveal */}
              <div className="p-3.5 sm:p-5 space-y-4">
                {order.items.map((item) => {
                  const portalUrl = getPlatformLoginUrl(item.product.title);

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl bg-oj-surface-alt/30 dark:bg-oj-dark-surface-alt/30 border border-oj-border/80 dark:border-oj-dark-border/80 space-y-4"
                    >
                      {/* Product Header */}
                      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <BrandCoverBanner
                            product={item.product}
                            title={item.product.title}
                            category={item.product.category}
                            className="w-12 h-12 rounded-xl shrink-0 shadow-sm"
                            showSubtitle={false}
                          />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-oj-midnight dark:text-white leading-snug line-clamp-2">
                              {item.product.title}
                            </p>
                            <p className="text-[11px] text-oj-muted font-mono mt-0.5">
                              Qty: {item.quantity} · <span className="font-bold text-oj-primary">{item.product.serverCluster || 'Server 2'}</span> · {formatPrice(item.totalNgn)}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 shrink-0">
                          ✓ Dispatched to Vault
                        </span>
                      </div>

                      {/* Vault Payload Box */}
                      {item.deliveredSecrets && item.deliveredSecrets.length > 0 && (
                        <div className="space-y-3">
                          {item.deliveredSecrets.map((sec, idx) => {
                            const isRevealed = sec.revealed !== false;
                            const secretVal = sec.value || '';
                            const parsed = parseSecretValue(secretVal);
                            const has2FA = parsed.fields.some(f => f.type === '2fa') || /2fa/i.test(sec.instruction || '');

                            return (
                              <div
                                key={idx}
                                className="rounded-2xl bg-gradient-to-b from-[#0b101b] to-[#060910] border border-cyan-500/20 text-white p-4 sm:p-5 shadow-2xl relative overflow-hidden"
                              >
                                {/* Vault Header */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                      <KeyRound className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <span className="font-heading font-extrabold text-xs text-white block">
                                        Authorized License / Customer Vault Key
                                      </span>
                                      <span className="text-[10px] text-cyan-400/80 font-mono">
                                        Cryptographically Sealed · AES-256
                                      </span>
                                    </div>
                                  </div>

                                  {/* Quick Launch Links */}
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {has2FA && (
                                      <a
                                        href="https://2fa.live"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-1 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                                      >
                                        <Smartphone className="w-3 h-3 text-amber-400" />
                                        <span>Open 2FA.live</span>
                                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                      </a>
                                    )}

                                    {portalUrl && (
                                      <a
                                        href={portalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-1 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                                      >
                                        <span>Login Portal</span>
                                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                      </a>
                                    )}
                                  </div>
                                </div>

                                {/* Master Action Bar: Copy All & Save Backup */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(getCopyAllText(order, item, secretVal), `all_${order.id}_${item.id}`, 'All credentials')}
                                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                  >
                                    {copiedId === `all_${order.id}_${item.id}` ? (
                                      <>
                                        <Check className="w-4 h-4 text-emerald-200" />
                                        <span>✓ Copied All Details!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-4 h-4" />
                                        <span>Copy All Details</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDownloadTxt(order, item, secretVal, sec.instruction)}
                                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                  >
                                    <Download className="w-4 h-4 text-cyan-400" />
                                    <span>Download Backup (.txt)</span>
                                  </button>
                                </div>

                                {/* Structured Credentials List (Parsed UID / Password / 2FA) */}
                                {parsed.isStructured ? (
                                  <div className="space-y-2 mb-4">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">
                                      Credentials Breakdown (Tap to Copy Individual Fields)
                                    </span>

                                    <div className="space-y-2">
                                      {parsed.fields.map((field, fIdx) => {
                                        const fieldKey = `${order.id}_${item.id}_${fIdx}`;
                                        const isCopied = copiedId === fieldKey;
                                        const isPassword = field.type === 'password';
                                        const isRevealedPw = revealedPasswords[fieldKey];
                                        const is2FA = field.type === '2fa';

                                        return (
                                          <div
                                            key={fIdx}
                                            className="p-3 rounded-xl bg-black/50 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-cyan-500/40 transition-colors"
                                          >
                                            {/* Field Label Badge */}
                                            <div className="flex items-center gap-2 shrink-0">
                                              <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-slate-400">
                                                {field.type === 'uid' && <User className="w-3.5 h-3.5 text-cyan-400" />}
                                                {field.type === 'password' && <Lock className="w-3.5 h-3.5 text-rose-400" />}
                                                {field.type === '2fa' && <Shield className="w-3.5 h-3.5 text-amber-400" />}
                                                {field.type === 'email' && <Mail className="w-3.5 h-3.5 text-blue-400" />}
                                                {field.type === 'key' && <KeyRound className="w-3.5 h-3.5 text-emerald-400" />}
                                                {field.type === 'token' && <FileText className="w-3.5 h-3.5 text-purple-400" />}
                                              </div>
                                              <span className="text-[11px] font-bold text-slate-300">
                                                {field.label}:
                                              </span>
                                            </div>

                                            {/* Field Value */}
                                            <div className="flex-1 min-w-0 px-1">
                                              <span className="font-mono text-xs sm:text-sm font-bold text-white break-all select-all block">
                                                {isPassword && !isRevealedPw
                                                  ? '••••••••••••••••'
                                                  : field.value}
                                              </span>
                                            </div>

                                            {/* Action Buttons for this Field */}
                                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                              {isPassword && (
                                                <button
                                                  type="button"
                                                  onClick={() => togglePasswordVisibility(fieldKey)}
                                                  className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors"
                                                  title={isRevealedPw ? 'Hide password' : 'Show password'}
                                                >
                                                  {isRevealedPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                              )}

                                              {is2FA && (
                                                <a
                                                  href="https://2fa.live"
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  onClick={() => handleCopy(field.value, fieldKey, '2FA Secret')}
                                                  className="py-1.5 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-all"
                                                  title="Copy 2FA Key and open 2fa.live"
                                                >
                                                  <Smartphone className="w-3 h-3 text-amber-400" />
                                                  <span>Get Code</span>
                                                </a>
                                              )}

                                              <button
                                                type="button"
                                                onClick={() => handleCopy(field.value, fieldKey, field.label)}
                                                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                                  isCopied
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                                }`}
                                              >
                                                {isCopied ? (
                                                  <>
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>Copied!</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Copy className="w-3.5 h-3.5" />
                                                    <span>Copy</span>
                                                  </>
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  /* Raw Single License Key Card */
                                  <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-2 mb-4">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] font-bold text-slate-300">
                                        License / Activation Key:
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(secretVal, `raw_${order.id}_${item.id}`, 'License Key')}
                                        className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                                      >
                                        {copiedId === `raw_${order.id}_${item.id}` ? (
                                          <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Copied!</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy Key</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <div className="font-mono text-xs sm:text-sm font-bold text-white break-all select-all p-2 rounded-lg bg-black/60 border border-white/5">
                                      {secretVal}
                                    </div>
                                  </div>
                                )}

                                {/* Collapsible / Raw Full String View */}
                                {parsed.isStructured && (
                                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 mb-4">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Raw String (format: UID:Pass:2FA)
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(parsed.raw, `raw_full_${order.id}_${item.id}`, 'Raw string')}
                                        className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                      >
                                        {copiedId === `raw_full_${order.id}_${item.id}` ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-400" />
                                            <span>Copied Raw!</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>Copy Raw</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <p className="font-mono text-[11px] text-slate-300 break-all select-all leading-relaxed">
                                      {parsed.raw}
                                    </p>
                                  </div>
                                )}

                                {/* Instructions & 2FA Helper Guide */}
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                                  <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Quick Usage & Login Guide:</span>
                                  </div>

                                  {sec.instruction ? (
                                    <p className="text-[11px] text-slate-300 leading-relaxed break-words">
                                      {sec.instruction}
                                    </p>
                                  ) : (
                                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                                      <li>Log in using the User ID (UID) and Password provided above.</li>
                                      <li>When prompted for 2FA, open <strong>https://2fa.live</strong> and paste your 2FA Secret Key to get your 6-digit code.</li>
                                      <li>Always use a clean residential proxy or anti-detect browser for maximum lifespan.</li>
                                    </ul>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
