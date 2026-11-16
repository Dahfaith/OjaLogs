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
  Printer,
  KeyRound,
  ExternalLink,
  Download,
  FileText,
  User,
  Lock,
  Smartphone,
  Shield,
  Mail,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  MessageCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandCoverBanner } from '../components/common/BrandCoverBanner';
import { WhatsAppSupportModal } from '../components/support/WhatsAppSupportModal';
import { SEO } from '../components/common/SEO';

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
        fields.push({ label: 'LOGIN EMAIL', value: parts[0], type: 'email' });
      } else if (/^\d{6,25}$/.test(parts[0])) {
        fields.push({ label: 'USERNAME', value: parts[0], type: 'uid' });
      } else {
        fields.push({ label: 'USERNAME', value: parts[0], type: 'uid' });
      }

      // Part 2: Password
      if (parts[1]) {
        fields.push({ label: 'PASSWORD', value: parts[1], type: 'password', isSensitive: true });
      }

      // Part 3: 2FA Secret Key or Recovery Email
      if (parts[2]) {
        if (parts[2].includes('@')) {
          fields.push({ label: 'RECOVERY EMAIL', value: parts[2], type: 'email' });
        } else {
          fields.push({ label: '2FA SECRET / RECOVERY', value: parts[2], type: '2fa', isSensitive: true });
        }
      }

      // Part 4: Recovery Email or 2FA or Token
      if (parts[3]) {
        if (parts[3].includes('@')) {
          fields.push({ label: 'RECOVERY EMAIL', value: parts[3], type: 'email' });
        } else if (fields.some(f => f.type === 'email')) {
          fields.push({ label: 'EMAIL PASSWORD', value: parts[3], type: 'password', isSensitive: true });
        } else {
          fields.push({ label: 'EXTRA INFO / TOKEN', value: parts[3], type: 'token' });
        }
      }

      // Part 5: Email Password / Session Cookies
      if (parts[4]) {
        fields.push({ label: 'SESSION COOKIES / EMAIL PASS', value: parts[4], type: 'password', isSensitive: true });
      }

      // Extra fields
      for (let i = 5; i < parts.length; i++) {
        fields.push({ label: `FIELD ${i + 1}`, value: parts[i], type: 'generic' });
      }

      return { isStructured: true, fields, raw };
    }
  }

  // Pipe-separated credential parsing (e.g. Username|Password|2FA)
  if (raw.includes('|')) {
    const parts = raw.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const fields: ParsedField[] = [
        { label: 'USERNAME', value: parts[0], type: 'uid' },
        { label: 'PASSWORD', value: parts[1], type: 'password', isSensitive: true }
      ];
      if (parts[2]) fields.push({ label: '2FA SECRET / RECOVERY', value: parts[2], type: '2fa', isSensitive: true });
      if (parts[3]) fields.push({ label: 'RECOVERY EMAIL', value: parts[3], type: 'email' });
      return { isStructured: true, fields, raw };
    }
  }

  return {
    isStructured: false,
    fields: [{ label: 'LICENSE / VAULT KEY', value: raw, type: 'key' }],
    raw
  };
}

export const OrdersPage: React.FC = () => {
  const { orders, showToast, formatPrice, currency, user, setIsAuthModalOpen, setIsSupportOpen } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [guidesOpen, setGuidesOpen] = useState<Record<string, boolean>>({});
  const [rawOpen, setRawOpen] = useState<Record<string, boolean>>({});
  const [selectedHelpOrder, setSelectedHelpOrder] = useState<any | null>(null);
  const [orderComplaintMessage, setOrderComplaintMessage] = useState('');

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

  const toggleGuide = (id: string) => {
    setGuidesOpen(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }));
  };

  const toggleRaw = (id: string) => {
    setRawOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadTxt = (order: any, item: any, secretVal: string, instruction?: string) => {
    const parsed = parseSecretValue(secretVal);
    let content = `=======================================================\n`;
    content += `OJALOGS DIGITAL DELIVERY VAULT & RECEIPT\n`;
    content += `=======================================================\n\n`;
    content += `Order Reference:   ${order.reference}\n`;
    content += `Product:           ${item.product.title}\n`;
    content += `Server Cluster:    ${item.product.serverCluster || 'Server 2'}\n`;
    content += `Purchase Date:     ${new Date(order.createdAt).toLocaleString()}\n`;
    content += `Payment Method:    ${order.paymentMethod === 'wallet' ? 'NGN Wallet' : 'BACH Gateway'}\n`;
    content += `Amount Paid:       NGN ${item.totalNgn || order.totalNgn}\n\n`;
    content += `-------------------------------------------------------\n`;
    content += `ACCOUNT CREDENTIALS & ACCESS:\n`;
    content += `-------------------------------------------------------\n`;

    if (parsed.isStructured) {
      parsed.fields.forEach(f => {
        content += `${f.label.padEnd(25)}: ${f.value}\n`;
      });
      content += `\nFULL RAW SUPPLIER STRING:\n${parsed.raw}\n`;
    } else {
      content += `SECRET / KEY:\n${parsed.raw}\n`;
    }

    if (instruction) {
      content += `\n-------------------------------------------------------\n`;
      content += `USAGE INSTRUCTIONS:\n`;
      content += `-------------------------------------------------------\n`;
      content += `${instruction}\n`;
    }

    content += `\nHOW TO USE 2FA (TWO-FACTOR AUTH):\n`;
    content += `1. Go to https://2fa.live in your browser.\n`;
    content += `2. Paste your 2FA Secret Key into the input box.\n`;
    content += `3. Click 'Submit' to receive your live 6-digit verification code.\n\n`;
    content += `=======================================================\n`;
    content += `Verified by Ojalogs Marketplace (https://ojalogs.com.ng)\n`;
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

  const getPlatformLoginUrl = (title: string): string => {
    const t = title.toLowerCase();
    if (t.includes('facebook') || t.includes('fb') || t.includes('meta')) return 'https://facebook.com';
    if (t.includes('instagram')) return 'https://instagram.com';
    if (t.includes('twitter') || t.includes('x.com')) return 'https://x.com';
    if (t.includes('tiktok')) return 'https://tiktok.com';
    if (t.includes('gmail') || t.includes('google')) return 'https://mail.google.com';
    if (t.includes('telegram') || t.includes('tg')) return 'https://web.telegram.org';
    return 'https://facebook.com';
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 pb-24 md:pb-12 text-center space-y-6">
        <SEO title="Customer Orders & Vault" noindex={true} />
        <div className="w-16 h-16 rounded-2xl bg-oj-primary/10 text-oj-primary dark:bg-oj-primary/20 dark:text-oj-cyan mx-auto flex items-center justify-center border border-oj-primary/20 shadow-soft">
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
      <SEO title="Customer Orders & Vault" noindex={true} />
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
                ? 'bg-white dark:bg-oj-dark-surface text-oj-primary dark:text-oj-cyan shadow-sm font-extrabold'
                : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-oj-dark-surface text-emerald-600 dark:text-emerald-400 shadow-sm font-extrabold'
                : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
            }`}
          >
            Completed ({completedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-oj-dark-surface text-amber-600 dark:text-amber-400 shadow-sm font-extrabold'
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
      <div className="space-y-5">
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
              {/* Order Card Top Bar */}
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
                  <span className="font-mono font-black text-base sm:text-lg text-oj-midnight dark:text-white">
                    {formatPrice(order.totalNgn)}
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border hover:border-oj-primary text-oj-muted hover:text-oj-midnight dark:hover:text-white transition-all shadow-sm"
                    title="Print / Save Invoice"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Order Items List */}
              <div className="p-3.5 sm:p-5 space-y-4">
                {order.items.map((item) => {
                  const portalUrl = getPlatformLoginUrl(item.product.title);

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl bg-oj-surface-alt/30 dark:bg-oj-dark-surface-alt/30 border border-oj-border/80 dark:border-oj-dark-border/80 space-y-4"
                    >
                      {/* Product Header Row */}
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
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-oj-primary dark:text-oj-cyan block mb-0.5">
                              {item.product.serverCluster || 'SERVER 2'}
                            </span>
                            <p className="text-xs sm:text-sm font-bold text-oj-midnight dark:text-white leading-snug line-clamp-2">
                              {item.product.title}
                            </p>
                            <p className="text-[11px] text-oj-muted font-mono mt-0.5">
                              Qty: {item.quantity} · {formatPrice(item.totalNgn)}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 shrink-0">
                          ✓ Dispatched
                        </span>
                      </div>

                      {/* Digital Delivery Vault Container (Exact match to reference screenshots) */}
                      {item.deliveredSecrets && item.deliveredSecrets.length > 0 && (
                        <div className="space-y-3">
                          {item.deliveredSecrets.map((sec, idx) => {
                            const secretVal = sec.value || '';
                            const parsed = parseSecretValue(secretVal);
                            const itemKey = `${order.id}_${item.id}_${idx}`;
                            const isGuideOpen = guidesOpen[itemKey] !== false; // default open
                            const isRawOpen = !!rawOpen[itemKey];

                            const isFacebook = item.product.title.toLowerCase().includes('facebook') || item.product.title.toLowerCase().includes('fb');
                            const isInstagram = item.product.title.toLowerCase().includes('instagram');
                            const isTwitter = item.product.title.toLowerCase().includes('twitter') || item.product.title.toLowerCase().includes('x');
                            const isEmail = item.product.title.toLowerCase().includes('gmail') || item.product.title.toLowerCase().includes('email');
                            const platformName = isFacebook ? 'FACEBOOK' : isInstagram ? 'INSTAGRAM' : isTwitter ? 'TWITTER (X)' : isEmail ? 'EMAIL' : 'DIGITAL';

                            return (
                              <div
                                key={idx}
                                className="rounded-2xl bg-white dark:bg-[#12161f] border border-oj-border dark:border-oj-dark-border p-4 sm:p-6 shadow-md space-y-4"
                              >
                                {/* Vault Header */}
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-oj-primary/10 dark:bg-oj-cyan/10 text-oj-primary dark:text-oj-cyan border border-oj-primary/20 flex items-center justify-center shrink-0">
                                    <Shield className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h3 className="font-heading font-black text-base sm:text-lg text-oj-midnight dark:text-white">
                                      Digital Delivery Vault
                                    </h3>
                                    <p className="text-[11px] sm:text-xs text-oj-muted dark:text-oj-dark-muted">
                                      Verified Secure Access · Sensitive details masked by default
                                    </p>
                                  </div>
                                </div>

                                {/* Top Action Buttons (Usage Guide, Download .txt, Copy All) */}
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleGuide(itemKey)}
                                    className="py-2 px-3.5 rounded-xl bg-oj-primary/10 dark:bg-oj-primary/20 hover:bg-oj-primary/15 dark:hover:bg-oj-primary/30 text-oj-primary dark:text-oj-cyan border border-oj-primary/20 text-xs font-bold flex items-center gap-1.5 transition-all"
                                  >
                                    <Info className="w-3.5 h-3.5 text-oj-primary dark:text-oj-cyan" />
                                    <span>{isGuideOpen ? 'Hide Guide' : 'Usage Guide'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDownloadTxt(order, item, secretVal, sec.instruction)}
                                    className="py-2 px-3.5 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt hover:bg-oj-border dark:hover:bg-oj-dark-border text-oj-midnight dark:text-white border border-oj-border dark:border-oj-dark-border text-xs font-bold flex items-center gap-1.5 transition-all"
                                  >
                                    <Download className="w-3.5 h-3.5 text-oj-muted" />
                                    <span>Download .txt</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleCopy(getCopyAllText(order, item, secretVal), `all_${itemKey}`, 'All credentials')}
                                    className="py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-oj-cyan hover:from-blue-700 hover:to-blue-600 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all active:scale-[0.98]"
                                  >
                                    {copiedId === `all_${itemKey}` ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-white" />
                                        <span>Copied All!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy All</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* How to Use Guide Box (Expandable / Collapsible with Ojalogs brand blue theme) */}
                                <AnimatePresence>
                                  {isGuideOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="border-l-4 border-oj-primary bg-blue-50/60 dark:bg-oj-midnight/50 rounded-r-2xl p-4 sm:p-5 border-y border-r border-blue-200/60 dark:border-blue-900/40 space-y-3"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-oj-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                          !
                                        </div>
                                        <h4 className="font-heading font-black text-xs sm:text-sm text-oj-midnight dark:text-white uppercase tracking-tight">
                                          HOW TO USE YOUR PURCHASED {platformName} ACCOUNT
                                        </h4>
                                      </div>

                                      <div className="space-y-2.5 text-xs text-oj-midnight/90 dark:text-slate-200">
                                        <div className="flex items-start gap-2.5">
                                          <span className="w-5 h-5 rounded-full bg-oj-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                            1
                                          </span>
                                          <p className="leading-relaxed">
                                            Navigate to <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline text-oj-primary dark:text-oj-cyan">{portalUrl}</a> using a dedicated browser profile or anti-detect browser with residential proxy.
                                          </p>
                                        </div>

                                        <div className="flex items-start gap-2.5">
                                          <span className="w-5 h-5 rounded-full bg-oj-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                            2
                                          </span>
                                          <p className="leading-relaxed">
                                            Log in using the <strong>User ID (UID) / Username</strong> and <strong>Password</strong> provided below.
                                          </p>
                                        </div>

                                        <div className="flex items-start gap-2.5">
                                          <span className="w-5 h-5 rounded-full bg-oj-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                            3
                                          </span>
                                          <p className="leading-relaxed">
                                            When 2FA is prompted, generate the 6-digit code via <a href="https://2fa.live" target="_blank" rel="noopener noreferrer" className="font-bold underline text-oj-primary dark:text-oj-cyan">https://2fa.live</a> using the <strong>2FA Secret Key</strong>.
                                          </p>
                                        </div>

                                        <div className="flex items-start gap-2.5">
                                          <span className="w-5 h-5 rounded-full bg-oj-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                            4
                                          </span>
                                          <p className="leading-relaxed">
                                            If access token or session cookies were provided, import them into your automation software or cookie extension.
                                          </p>
                                        </div>

                                        <div className="flex items-start gap-2.5">
                                          <span className="w-5 h-5 rounded-full bg-oj-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                            5
                                          </span>
                                          <p className="leading-relaxed">
                                            Warm up the account naturally by browsing before engaging in marketplace or advertising activities.
                                          </p>
                                        </div>
                                      </div>

                                      <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/50 text-[11px] text-oj-muted dark:text-slate-400 flex items-center gap-1.5">
                                        <span>🔒</span>
                                        <span>For maximum security, always access accounts from clean browser profiles or residential proxies. Never share credentials.</span>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Credentials & Access Section Card */}
                                <div className="rounded-2xl bg-oj-surface-alt/60 dark:bg-oj-dark-surface-alt/60 border border-oj-border dark:border-oj-dark-border p-4 sm:p-5 space-y-4">
                                  {/* Sub-Header */}
                                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-oj-border dark:border-oj-dark-border">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-oj-primary/10 text-oj-primary dark:text-oj-cyan border border-oj-primary/20">
                                        CREDENTIALS & ACCESS
                                      </span>
                                      <span className="text-xs font-bold text-oj-midnight dark:text-white hidden sm:inline">
                                        Account Credentials
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleCopy(getCopyAllText(order, item, secretVal), `sub_all_${itemKey}`, 'Account credentials')}
                                      className="py-1.5 px-3 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border hover:border-oj-primary text-xs font-bold text-oj-midnight dark:text-white flex items-center gap-1.5 transition-all shadow-sm"
                                    >
                                      {copiedId === `sub_all_${itemKey}` ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                                          <span>Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>Copy Account</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  {/* Fields Breakdown */}
                                  <div className="space-y-3">
                                    {parsed.fields.map((field, fIdx) => {
                                      const fieldKey = `${itemKey}_${fIdx}`;
                                      const isPassword = field.isSensitive || field.type === 'password' || field.type === '2fa';
                                      const isRevealedPw = revealedPasswords[fieldKey];
                                      const isCopied = copiedId === fieldKey;

                                      return (
                                        <div key={fIdx} className="space-y-1.5">
                                          <div className="flex items-center gap-1.5 px-1">
                                            {field.type === 'uid' && <User className="w-3.5 h-3.5 text-oj-primary" />}
                                            {field.type === 'password' && <Lock className="w-3.5 h-3.5 text-blue-500" />}
                                            {field.type === '2fa' && <Shield className="w-3.5 h-3.5 text-oj-cyan" />}
                                            {field.type === 'email' && <Mail className="w-3.5 h-3.5 text-sky-500" />}
                                            {field.type === 'key' && <KeyRound className="w-3.5 h-3.5 text-emerald-500" />}
                                            {field.type === 'token' && <FileText className="w-3.5 h-3.5 text-indigo-500" />}
                                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-oj-muted dark:text-slate-400">
                                              {field.label}
                                            </label>
                                          </div>

                                          <div className="px-3 py-2.5 rounded-xl bg-white dark:bg-oj-dark-surface border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs">
                                            <div className="min-w-0 flex-1 pr-1 overflow-hidden select-all">
                                              {isPassword && !isRevealedPw ? (
                                                <span className="font-mono text-base tracking-widest text-slate-400 dark:text-slate-500 font-extrabold select-none block truncate">
                                                  ••••••••••••
                                                </span>
                                              ) : (
                                                <span className="font-mono text-xs sm:text-sm font-bold text-oj-midnight dark:text-white break-all select-all block leading-tight">
                                                  {field.value}
                                                </span>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                              {isPassword && (
                                                <button
                                                  type="button"
                                                  onClick={() => togglePasswordVisibility(fieldKey)}
                                                  className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-oj-primary dark:hover:border-oj-cyan text-slate-500 hover:text-oj-primary dark:text-slate-400 dark:hover:text-oj-cyan flex items-center justify-center shrink-0 transition-all shadow-xs"
                                                  title={isRevealedPw ? 'Mask secret' : 'Reveal secret'}
                                                  aria-label={isRevealedPw ? 'Mask secret' : 'Reveal secret'}
                                                >
                                                  {isRevealedPw ? <EyeOff className="w-4 h-4 text-oj-primary dark:text-oj-cyan" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                              )}

                                              <button
                                                type="button"
                                                onClick={() => handleCopy(field.value, fieldKey, field.label)}
                                                className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-xs ${
                                                  isCopied
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                                                    : 'bg-white dark:bg-oj-dark-surface hover:border-oj-primary text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80'
                                                }`}
                                              >
                                                {isCopied ? (
                                                  <>
                                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span>Copied!</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                                    <span>Copy</span>
                                                  </>
                                                )}
                                              </button>
                                            </div>
                                          </div>

                                          {/* 2FA Helper Banner (Rendered cleanly below the row, preventing mobile button crowding) */}
                                          {field.type === '2fa' && (
                                            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-oj-muted dark:text-slate-400 pt-0.5">
                                              <span className="flex items-center gap-1.5 text-[11px]">
                                                <Smartphone className="w-3.5 h-3.5 text-oj-cyan shrink-0" />
                                                <span>Need 6-digit TOTP code?</span>
                                              </span>
                                              <a
                                                href="https://2fa.live"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => handleCopy(field.value, `${fieldKey}_totp`, '2FA Secret')}
                                                className="inline-flex items-center gap-1 font-bold text-oj-primary dark:text-oj-cyan hover:underline shrink-0 text-xs"
                                                title="Copy secret & open 2fa.live"
                                              >
                                                <span>Copy & 2fa.live</span>
                                                <ExternalLink className="w-3 h-3" />
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* View Original Supplier Raw Text Dropdown */}
                                  <div className="pt-2 border-t border-oj-border dark:border-oj-dark-border">
                                    <button
                                      type="button"
                                      onClick={() => toggleRaw(itemKey)}
                                      className="text-xs font-bold text-oj-muted hover:text-oj-midnight dark:hover:text-white flex items-center gap-1 transition-colors"
                                    >
                                      {isRawOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                      <span>View Original Supplier Raw Text</span>
                                    </button>

                                    <AnimatePresence>
                                      {isRawOpen && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="mt-2.5 p-3 rounded-xl bg-black text-slate-200 font-mono text-[11px] break-all select-all relative overflow-hidden"
                                        >
                                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">
                                              Raw Key Envelope
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleCopy(parsed.raw, `raw_box_${itemKey}`, 'Raw key')}
                                              className="text-xs text-oj-cyan hover:text-blue-400 flex items-center gap-1 font-bold"
                                            >
                                              <Copy className="w-3 h-3" />
                                              <span>Copy Raw</span>
                                            </button>
                                          </div>
                                          <p className="leading-relaxed">{parsed.raw}</p>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>

                                {/* Bottom Help & Status Bar (Matching Clean Action Row) */}
                                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-oj-border/60 dark:border-oj-dark-border/60">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedHelpOrder(order)}
                                      className="py-2 px-3.5 rounded-xl border border-oj-primary/30 hover:border-oj-primary bg-oj-primary/5 dark:bg-oj-primary/10 text-oj-primary dark:text-oj-cyan text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                                    >
                                      <HelpCircle className="w-3.5 h-3.5 text-oj-primary dark:text-oj-cyan" />
                                      <span>Need Help With This Order?</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedHelpOrder(order)}
                                      className="py-2 px-3.5 rounded-xl border border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      <span>Chat on WhatsApp</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => toggleRaw(itemKey)}
                                      className="py-2 px-3.5 rounded-xl border border-oj-border dark:border-oj-dark-border hover:border-oj-primary bg-white dark:bg-oj-dark-surface text-oj-midnight dark:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                                    >
                                      <Lock className="w-3.5 h-3.5 text-oj-primary dark:text-oj-cyan" />
                                      <span>Open Delivery Vault</span>
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>DELIVERED</span>
                                    </span>
                                  </div>
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

      {/* WhatsApp Official Support Modal */}
      <WhatsAppSupportModal
        isOpen={!!selectedHelpOrder}
        onClose={() => setSelectedHelpOrder(null)}
        orderReference={selectedHelpOrder?.reference}
      />
    </div>
  );
};
