import React, { useState, useEffect, useMemo } from 'react';
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
  MessageCircle,
  Clock,
  X,
  RotateCw,
  Zap,
  Sparkles,
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WhatsAppSupportModal } from '../components/support/WhatsAppSupportModal';
import { SEO } from '../components/common/SEO';
import { SMMOrder } from '@ojalogs/shared';
import { apiClient } from '../lib/apiClient';
import { Link } from 'react-router-dom';

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

  // Tab-separated credential parsing (common in bulk exports)
  if (raw.includes('\t')) {
    const parts = raw.split('\t').map(p => p.trim()).filter(Boolean);
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

interface UnifiedOrderItem {
  id: string;
  orderId: string;
  reference: string;
  createdAt: string;
  kind: 'account' | 'smm' | 'telephony';
  serverCluster: string;
  title: string;
  category: string;
  quantity: number;
  totalNgn: number;
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending';
  fulfillmentStatus: 'completed' | 'processing' | 'refunded' | 'cancelled';
  // Associated payloads
  accountItem?: any;
  smmOrder?: SMMOrder;
  originalOrder: any;
}

export const OrdersPage: React.FC = () => {
  const { orders, showToast, formatPrice, currency, user, setIsAuthModalOpen, reloadOrders } = useApp();
  
  // Status Filter Tabs (Matches LogsPoll: All Orders, Completed, Pending, Failed / Cancelled)
  const [statusTab, setStatusTab] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  
  // Secondary Category Filter Chips
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'account' | 'smm'>('all');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [guidesOpen, setGuidesOpen] = useState<Record<string, boolean>>({});
  const [rawOpen, setRawOpen] = useState<Record<string, boolean>>({});
  const [selectedHelpOrder, setSelectedHelpOrder] = useState<any | null>(null);
  const [syncingSmmId, setSyncingSmmId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Accordion Expand/Collapse Map for Cards
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // SMM Orders State
  const [smmOrders, setSmmOrders] = useState<SMMOrder[]>(() => {
    try {
      const saved = localStorage.getItem('oj_smm_user_orders');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const fetchLiveSMMOrders = () => {
    if (!user) return;
    apiClient.getSMMOrders()
      .then(data => {
        if (data && Array.isArray(data)) {
          setSmmOrders(data);
          try { localStorage.setItem('oj_smm_user_orders', JSON.stringify(data)); } catch {}
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchLiveSMMOrders();
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (typeof reloadOrders === 'function') await reloadOrders();
      await fetchLiveSMMOrders();
      showToast('Orders & Vault updated!');
    } catch {
      showToast('Orders synchronized.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleSyncSMM = async (orderId: string) => {
    setSyncingSmmId(orderId);
    try {
      const updated = await apiClient.syncSMMOrder(orderId);
      setSmmOrders(prev => {
        const next = prev.map(o => o.id === orderId ? updated : o);
        try { localStorage.setItem('oj_smm_user_orders', JSON.stringify(next)); } catch {}
        return next;
      });
      showToast(`Updated ${updated.reference}: ${updated.status.toUpperCase()}`);
    } catch {
      showToast('Status check complete.');
    } finally {
      setSyncingSmmId(null);
    }
  };

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

  const toggleExpand = (itemId: string) => {
    setExpandedOrders(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // -------------------------------------------------------------
  // Build Unified Stream of All Orders (Chronologically Sorted)
  // -------------------------------------------------------------
  const unifiedOrders = useMemo<UnifiedOrderItem[]>(() => {
    const list: UnifiedOrderItem[] = [];

    // 1. Digital Account Orders
    orders.forEach(order => {
      let fStatus: UnifiedOrderItem['fulfillmentStatus'] = 'completed';
      if (order.status === 'processing' || order.status === 'pending') {
        fStatus = 'processing';
      } else if (order.status === 'refunded') {
        fStatus = 'refunded';
      } else if (order.status === 'cancelled') {
        fStatus = 'cancelled';
      }

      order.items.forEach((item, idx) => {
        list.push({
          id: `${order.id}_${item.id || idx}`,
          orderId: order.id,
          reference: order.reference,
          createdAt: order.createdAt,
          kind: 'account',
          serverCluster: item.product?.serverCluster || 'Server 2',
          title: item.product?.title || 'Digital Account Product',
          category: item.product?.category || 'Marketplace Item',
          quantity: item.quantity || 1,
          totalNgn: item.totalNgn || order.totalNgn,
          paymentMethod: order.paymentMethod === 'wallet' ? 'NGN Wallet' : 'BACH Gateway',
          paymentStatus: order.status === 'pending' && order.paymentMethod === 'bach_direct' ? 'pending' : 'paid',
          fulfillmentStatus: fStatus,
          accountItem: item,
          originalOrder: order
        });
      });
    });

    // 2. SMM Boost Orders
    smmOrders.forEach(smm => {
      let fStatus: UnifiedOrderItem['fulfillmentStatus'] = 'completed';
      if (smm.status === 'in_progress' || smm.status === 'pending') {
        fStatus = 'processing';
      } else if (smm.status === 'refunded') {
        fStatus = 'refunded';
      } else if (smm.status === 'canceled' || smm.status === 'partial') {
        fStatus = smm.status === 'partial' ? 'processing' : 'cancelled';
      }

      list.push({
        id: `smm_${smm.id}`,
        orderId: smm.id,
        reference: smm.reference,
        createdAt: smm.createdAt,
        kind: 'smm',
        serverCluster: 'SMM Boost',
        title: smm.serviceName || 'Social Media Boost Campaign',
        category: 'Social Media Engagement',
        quantity: smm.quantity,
        totalNgn: smm.totalNgn,
        paymentMethod: 'NGN Wallet',
        paymentStatus: 'paid',
        fulfillmentStatus: fStatus,
        smmOrder: smm,
        originalOrder: smm
      });
    });

    // Sort strictly newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, smmOrders]);

  // Overall Counts for Primary Tabs (Mathematically exact: Completed + Pending + Failed === All)
  const counts = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let failed = 0;

    unifiedOrders.forEach(item => {
      if (item.fulfillmentStatus === 'completed') completed++;
      else if (item.fulfillmentStatus === 'processing') pending++;
      else if (item.fulfillmentStatus === 'refunded' || item.fulfillmentStatus === 'cancelled') failed++;
    });

    return {
      all: unifiedOrders.length,
      completed,
      pending,
      failed
    };
  }, [unifiedOrders]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const account = unifiedOrders.filter(i => i.kind === 'account').length;
    const smm = unifiedOrders.filter(i => i.kind === 'smm').length;
    return { all: unifiedOrders.length, account, smm };
  }, [unifiedOrders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return unifiedOrders.filter(item => {
      // 1. Status Filter Tab
      if (statusTab === 'completed' && item.fulfillmentStatus !== 'completed') return false;
      if (statusTab === 'pending' && item.fulfillmentStatus !== 'processing') return false;
      if (statusTab === 'failed' && item.fulfillmentStatus !== 'refunded' && item.fulfillmentStatus !== 'cancelled') return false;

      // 2. Category Filter Chip
      if (categoryFilter !== 'all' && item.kind !== categoryFilter) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = item.reference.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCluster = item.serverCluster.toLowerCase().includes(q);
        const matchesLink = item.smmOrder?.targetLink?.toLowerCase().includes(q);
        if (!matchesRef && !matchesTitle && !matchesCluster && !matchesLink) return false;
      }

      return true;
    });
  }, [unifiedOrders, statusTab, categoryFilter, searchQuery]);

  // Helper to get brand icon and styling
  const getBrandVisual = (title: string, kind: string) => {
    const t = title.toLowerCase();
    if (kind === 'smm') {
      return {
        icon: Zap,
        bgClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/20'
      };
    }
    if (t.includes('outlook') || t.includes('microsoft') || t.includes('hotmail') || t.includes('email') || t.includes('mail')) {
      return {
        icon: Mail,
        bgClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400'
      };
    }
    if (t.includes('instagram') || t.includes('threads')) {
      return {
        icon: Camera,
        bgClass: 'bg-gradient-to-br from-purple-500/15 via-pink-500/15 to-orange-500/15 text-pink-600 border-pink-500/20 dark:text-pink-400'
      };
    }
    if (t.includes('twitter') || t.includes(' x ') || t.startsWith('x ')) {
      return {
        icon: Lock,
        bgClass: 'bg-slate-900/10 text-slate-900 border-slate-900/20 dark:bg-white/10 dark:text-white dark:border-white/20'
      };
    }
    if (t.includes('facebook') || t.includes('fb') || t.includes('meta')) {
      return {
        icon: Shield,
        bgClass: 'bg-blue-600/10 text-blue-600 border-blue-600/20 dark:bg-blue-600/20 dark:text-blue-400'
      };
    }
    return {
      icon: KeyRound,
      bgClass: 'bg-oj-primary/10 text-oj-primary border-oj-primary/20 dark:bg-oj-cyan/15 dark:text-oj-cyan'
    };
  };

  const handleDownloadTxt = (order: any, item: any, secretVal: string, instruction?: string) => {
    const parsed = parseSecretValue(secretVal);
    let content = `=======================================================\n`;
    content += `OJALOGS DIGITAL DELIVERY VAULT & RECEIPT\n`;
    content += `=======================================================\n\n`;
    content += `Order Reference:   ${order.reference}\n`;
    content += `Product:           ${item.product?.title || item.title}\n`;
    content += `Server Cluster:    ${item.product?.serverCluster || 'Server 2'}\n`;
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
    link.download = `ojalogs-${order.reference}-${item.id?.slice(-6) || 'receipt'}.txt`;
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
      `[OJALOGS ORDER ${order.reference}] - ${item.product?.title || item.title}`,
      ...parsed.fields.map(f => `${f.label}: ${f.value}`),
      `Raw: ${parsed.raw}`
    ];
    return lines.join('\n');
  };

  const getPlatformLoginUrl = (title: string): string => {
    const t = title.toLowerCase();
    if (t.includes('facebook') || t.includes('fb') || t.includes('meta')) return 'https://facebook.com';
    if (t.includes('instagram')) return 'https://instagram.com';
    if (t.includes('twitter') || t.includes(' x ') || t.startsWith('x ')) return 'https://x.com';
    if (t.includes('tiktok')) return 'https://tiktok.com';
    if (t.includes('outlook') || t.includes('microsoft') || t.includes('hotmail')) return 'https://outlook.live.com';
    if (t.includes('gmail') || t.includes('google')) return 'https://mail.google.com';
    if (t.includes('telegram') || t.includes('tg')) return 'https://web.telegram.org';
    return 'https://facebook.com';
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 pb-24 md:pb-12 text-center space-y-6">
        <SEO title="My Orders & Vault" noindex={true} />
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
    <div className="max-w-3xl mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-6 pb-28 md:pb-16 overflow-x-hidden">
      <SEO title="My Orders & Vault" noindex={true} />

      {/* ============================================================== */}
      {/* 1. Header Section (Directly aligned with LogsPoll Reference)   */}
      {/* ============================================================== */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-mono font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            ORDER RECONCILIATION & FULFILLMENT
          </span>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-oj-muted hover:text-oj-midnight dark:hover:text-white hover:bg-oj-surface-alt transition-all flex items-center gap-1 text-[11px] font-bold"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-oj-primary' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <h1 className="font-heading font-black text-2xl sm:text-3xl text-oj-midnight dark:text-white tracking-tight">
          My Orders
        </h1>
        <p className="text-xs sm:text-sm text-oj-muted dark:text-oj-dark-muted max-w-xl leading-relaxed">
          Track payment reconciliation, automated processing, and order fulfillment status.
        </p>
      </div>

      {/* ============================================================== */}
      {/* 2. Primary Status Filter Tabs (Matches LogsPoll in Image 3)     */}
      {/* ============================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setStatusTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            statusTab === 'all'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md font-extrabold'
              : 'bg-white dark:bg-oj-dark-surface text-oj-muted hover:text-oj-midnight dark:hover:text-white border border-oj-border dark:border-oj-dark-border'
          }`}
        >
          <span>All Orders</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            statusTab === 'all' ? 'bg-white/25 text-white' : 'bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted'
          }`}>
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setStatusTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            statusTab === 'completed'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md font-extrabold'
              : 'bg-white dark:bg-oj-dark-surface text-oj-muted hover:text-oj-midnight dark:hover:text-white border border-oj-border dark:border-oj-dark-border'
          }`}
        >
          <span>Completed</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            statusTab === 'completed' ? 'bg-white/25 text-white' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
          }`}>
            {counts.completed}
          </span>
        </button>

        <button
          onClick={() => setStatusTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            statusTab === 'pending'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md font-extrabold'
              : 'bg-white dark:bg-oj-dark-surface text-oj-muted hover:text-oj-midnight dark:hover:text-white border border-oj-border dark:border-oj-dark-border'
          }`}
        >
          <span>Pending</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            statusTab === 'pending' ? 'bg-white/25 text-white' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
          }`}>
            {counts.pending}
          </span>
        </button>

        <button
          onClick={() => setStatusTab('failed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            statusTab === 'failed'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md font-extrabold'
              : 'bg-white dark:bg-oj-dark-surface text-oj-muted hover:text-oj-midnight dark:hover:text-white border border-oj-border dark:border-oj-dark-border'
          }`}
        >
          <span>Failed / Cancelled</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            statusTab === 'failed' ? 'bg-white/25 text-white' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
          }`}>
            {counts.failed}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. Search Bar (Exact LogsPoll layout)                           */}
      {/* ============================================================== */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-oj-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by order ref or product..."
          className="w-full text-xs pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white placeholder:text-oj-muted/70 focus:outline-none focus:border-amber-500 shadow-soft transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-oj-muted hover:text-oj-midnight dark:hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. Secondary Category Filter Chips (Unified without 0 silos)   */}
      {/* ============================================================== */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] text-oj-muted font-bold mr-1 shrink-0">Filter By:</span>
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
            categoryFilter === 'all'
              ? 'bg-oj-midnight dark:bg-white text-white dark:text-oj-midnight font-extrabold'
              : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
          }`}
        >
          All Items ({categoryCounts.all})
        </button>

        <button
          onClick={() => setCategoryFilter('account')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
            categoryFilter === 'account'
              ? 'bg-oj-primary text-white font-extrabold'
              : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
          }`}
        >
          <KeyRound className="w-3 h-3" />
          <span>Digital Accounts ({categoryCounts.account})</span>
        </button>

        <button
          onClick={() => setCategoryFilter('smm')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
            categoryFilter === 'smm'
              ? 'bg-amber-500 text-white font-extrabold'
              : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
          }`}
        >
          <Zap className="w-3 h-3 text-amber-300" />
          <span>Social Boosts SMM ({categoryCounts.smm})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 5. Unified Orders Stream (Direct Card Match to Image 3)        */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {filteredOrders.map((item, index) => {
          const isExpanded = expandedOrders[item.id] !== undefined 
            ? expandedOrders[item.id] 
            : (item.fulfillmentStatus === 'processing' || index === 0);
          
          const visual = getBrandVisual(item.title, item.kind);
          const VisualIcon = visual.icon;

          return (
            <div
              key={item.id}
              className="rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft overflow-hidden transition-all hover:border-amber-500/40"
            >
              {/* Card Container Padding */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* ------------------------------------------------ */}
                {/* Top Row: Server Cluster & Ref (Matches LogsPoll) */}
                {/* ------------------------------------------------ */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {item.serverCluster}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs font-mono text-oj-muted dark:text-oj-dark-muted">
                    <span className="font-semibold select-all">Ref: {item.reference}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.reference, `ref_${item.id}`, 'Order reference')}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-oj-muted hover:text-oj-midnight dark:hover:text-white transition-colors"
                      title="Copy Order Reference"
                    >
                      {copiedId === `ref_${item.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ------------------------------------------------ */}
                {/* Middle Row: Icon + Date + Product Title + Status */}
                {/* ------------------------------------------------ */}
                <div className="flex items-start gap-3.5">
                  {/* Brand Visual Icon Box */}
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${visual.bgClass}`}>
                    <VisualIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-oj-muted dark:text-oj-dark-muted font-medium">
                      <Clock className="w-3 h-3 text-oj-muted/70 shrink-0" />
                      <span>
                        {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="font-heading font-black text-sm sm:text-base text-oj-midnight dark:text-white leading-snug line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Dual Status Pills (Matches LogsPoll in Image 3) */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {/* 1. Payment Pill */}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Paid</span>
                      </span>

                      {/* 2. Fulfillment Pill */}
                      {item.fulfillmentStatus === 'completed' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Delivered</span>
                        </span>
                      ) : item.fulfillmentStatus === 'processing' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                          <span>Delivery Awaiting Supplier</span>
                        </span>
                      ) : item.fulfillmentStatus === 'refunded' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          ↩ Refunded to Wallet
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          ❌ Failed / Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------ */}
                {/* Bottom Row: Price & View Details Button (Image 3) */}
                {/* ------------------------------------------------ */}
                <div className="pt-2 border-t border-oj-border/50 dark:border-oj-dark-border/50 flex items-center justify-between gap-3">
                  <div className="font-heading font-black text-lg sm:text-xl text-oj-midnight dark:text-white tracking-tight">
                    {formatPrice(item.totalNgn)}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="px-4 py-2 rounded-xl bg-oj-midnight hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* ============================================================== */}
              {/* Collapsible Digital Vault / Fulfillment Details Area           */}
              {/* ============================================================== */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-oj-border dark:border-oj-dark-border bg-oj-surface-alt/40 dark:bg-oj-dark-surface-alt/30 p-4 sm:p-5 space-y-4"
                  >
                    {/* CASE A: Digital Account Orders */}
                    {item.kind === 'account' && item.accountItem && (
                      <div className="space-y-4">
                        {/* Refunded Notice Card */}
                        {item.fulfillmentStatus === 'refunded' && (
                          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                            <span className="text-base leading-none">↩</span>
                            <div>
                              <p className="font-bold text-amber-950 dark:text-amber-100">Order Refunded to NGN Wallet</p>
                              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                                100% of {formatPrice(item.totalNgn)} was credited back to your account wallet. You can use your balance to purchase an in-stock alternative.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Processing / Awaiting Supplier Card */}
                        {item.fulfillmentStatus === 'processing' && (
                          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 dark:from-amber-950/30 dark:via-oj-dark-surface dark:to-amber-950/10 border border-amber-200/80 dark:border-amber-800/80 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                                <Clock className="w-5 h-5 animate-spin" />
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="font-heading font-black text-sm text-amber-950 dark:text-amber-100">
                                  Order Confirmed · Account Credentials Being Prepared
                                </h4>
                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                  Your payment of {formatPrice(item.totalNgn)} was verified. Our operations fleet is securing and verifying your account credentials and 2FA keys.
                                </p>
                              </div>
                            </div>

                            {/* 3-Step Milestone Progression */}
                            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>1. Paid</span>
                              </div>
                              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />
                                <span>2. Allocating</span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-400 font-medium flex items-center gap-1.5">
                                <span>3. Vault Reveal</span>
                              </div>
                            </div>

                            <a
                              href={`https://wa.me/2347069659752?text=${encodeURIComponent(`Hello Ojalogs Operations Desk, I placed order ${item.reference} for "${item.title}". Kindly expedite my credentials.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Expedite on WhatsApp (07069659752)</span>
                            </a>
                          </div>
                        )}

                        {/* Delivered Digital Vault (When Completed) */}
                        {item.accountItem.deliveredSecrets && item.accountItem.deliveredSecrets.length > 0 && (
                          <div className="space-y-4">
                            {item.accountItem.deliveredSecrets.map((sec: any, secIdx: number) => {
                              const secretVal = sec.value || '';
                              if (secretVal === 'PENDING_DISPATCH') return null;

                              const parsed = parseSecretValue(secretVal);
                              const itemKey = `${item.id}_sec_${secIdx}`;
                              const isGuideOpen = guidesOpen[itemKey] !== false;
                              const isRawOpen = !!rawOpen[itemKey];

                              return (
                                <div
                                  key={secIdx}
                                  className="rounded-xl bg-white dark:bg-[#12161f] border border-oj-border dark:border-oj-dark-border p-4 sm:p-5 shadow-sm space-y-4"
                                >
                                  {/* Vault Header */}
                                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-oj-border dark:border-oj-dark-border">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-lg bg-oj-primary/10 text-oj-primary dark:bg-oj-cyan/15 dark:text-oj-cyan flex items-center justify-center shrink-0">
                                        <Shield className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <h4 className="font-heading font-black text-sm text-oj-midnight dark:text-white">
                                          Digital Delivery Vault
                                        </h4>
                                        <p className="text-[10px] text-oj-muted dark:text-oj-dark-muted">
                                          AES-256 Encrypted Storage · Masked Credentials
                                        </p>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleCopy(getCopyAllText(item.originalOrder, item.accountItem, secretVal), `sub_all_${itemKey}`, 'Account credentials')}
                                      className="py-1 px-2.5 rounded-lg bg-oj-surface-alt dark:bg-oj-dark-surface-alt hover:bg-oj-primary hover:text-white border border-oj-border dark:border-oj-dark-border text-xs font-bold text-oj-midnight dark:text-white flex items-center gap-1.5 transition-all shadow-xs"
                                    >
                                      {copiedId === `sub_all_${itemKey}` ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                                          <span>Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>Copy All</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  {/* Fields Breakdown */}
                                  <div className="space-y-2.5">
                                    {parsed.fields.map((field, fIdx) => {
                                      const fieldKey = `${itemKey}_${fIdx}`;
                                      const isPassword = field.isSensitive || field.type === 'password' || field.type === '2fa';
                                      const isRevealedPw = revealedPasswords[fieldKey];
                                      const isCopied = copiedId === fieldKey;

                                      return (
                                        <div key={fIdx} className="space-y-1">
                                          <div className="flex items-center gap-1.5 px-1">
                                            {field.type === 'uid' && <User className="w-3 h-3 text-oj-primary" />}
                                            {field.type === 'password' && <Lock className="w-3 h-3 text-blue-500" />}
                                            {field.type === '2fa' && <Shield className="w-3 h-3 text-oj-cyan" />}
                                            {field.type === 'email' && <Mail className="w-3 h-3 text-sky-500" />}
                                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-oj-muted dark:text-slate-400">
                                              {field.label}
                                            </label>
                                          </div>

                                          <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-oj-dark-surface-alt/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-xs">
                                            <div className="min-w-0 flex-1 pr-1 overflow-hidden select-all">
                                              {isPassword && !isRevealedPw ? (
                                                <span className="font-mono text-sm tracking-widest text-slate-400 dark:text-slate-500 font-extrabold select-none block truncate">
                                                  ••••••••••••
                                                </span>
                                              ) : (
                                                <span className="font-mono text-xs sm:text-sm font-bold text-oj-midnight dark:text-white break-all select-all block leading-tight">
                                                  {field.value}
                                                </span>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                              {isPassword && (
                                                <button
                                                  type="button"
                                                  onClick={() => togglePasswordVisibility(fieldKey)}
                                                  className="h-7 w-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-oj-primary text-slate-500 hover:text-oj-primary flex items-center justify-center shrink-0 transition-all shadow-xs"
                                                  title={isRevealedPw ? 'Mask secret' : 'Reveal secret'}
                                                >
                                                  {isRevealedPw ? <EyeOff className="w-3.5 h-3.5 text-oj-primary" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                              )}

                                              <button
                                                type="button"
                                                onClick={() => handleCopy(field.value, fieldKey, field.label)}
                                                className={`h-7 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all shadow-xs ${
                                                  isCopied
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300'
                                                    : 'bg-white dark:bg-slate-800 hover:border-oj-primary text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                                                }`}
                                              >
                                                {isCopied ? (
                                                  <>
                                                    <Check className="w-3 h-3 text-emerald-500" />
                                                    <span>Copied!</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Copy className="w-3 h-3 text-slate-500" />
                                                    <span>Copy</span>
                                                  </>
                                                )}
                                              </button>
                                            </div>
                                          </div>

                                          {/* 2FA Helper Helper link */}
                                          {field.type === '2fa' && (
                                            <div className="flex items-center justify-between px-1 text-[11px] text-oj-muted dark:text-slate-400 pt-0.5">
                                              <span className="flex items-center gap-1">
                                                <Smartphone className="w-3 h-3 text-oj-cyan shrink-0" />
                                                <span>Need 6-digit TOTP code?</span>
                                              </span>
                                              <a
                                                href="https://2fa.live"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => handleCopy(field.value, `${fieldKey}_totp`, '2FA Secret')}
                                                className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 hover:underline"
                                              >
                                                <span>Copy & open 2fa.live</span>
                                                <ExternalLink className="w-3 h-3" />
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Action Bar (Download .txt, Direct Platform Login, Print Receipt) */}
                                  <div className="pt-2 border-t border-oj-border dark:border-oj-dark-border flex items-center justify-between gap-2 flex-wrap text-xs">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadTxt(item.originalOrder, item.accountItem, secretVal, sec.instruction)}
                                        className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-oj-border dark:border-slate-700 text-oj-midnight dark:text-white hover:border-oj-primary font-bold flex items-center gap-1.5 transition-all shadow-xs"
                                      >
                                        <Download className="w-3.5 h-3.5 text-oj-primary" />
                                        <span>Download .TXT</span>
                                      </button>

                                      <a
                                        href={getPlatformLoginUrl(item.title)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-oj-border dark:border-slate-700 text-oj-midnight dark:text-white hover:border-oj-primary font-bold flex items-center gap-1.5 transition-all shadow-xs"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Direct Login</span>
                                      </a>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => window.print()}
                                      className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-oj-border dark:border-slate-700 text-oj-muted hover:text-oj-midnight dark:hover:text-white font-bold flex items-center gap-1.5 transition-all shadow-xs"
                                      title="Print Receipt"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      <span>Receipt</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* CASE B: SMM Boost Order Details */}
                    {item.kind === 'smm' && item.smmOrder && (
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-oj-muted block">
                            Target Link (Profile / Post URL)
                          </span>
                          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-[#12161f] border border-oj-border dark:border-oj-dark-border text-xs">
                            <a
                              href={item.smmOrder.targetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-oj-primary dark:text-oj-cyan hover:underline truncate"
                            >
                              {item.smmOrder.targetLink}
                            </a>
                            <a
                              href={item.smmOrder.targetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-oj-muted hover:text-oj-midnight dark:hover:text-white"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Metric Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-white dark:bg-[#12161f] border border-oj-border dark:border-oj-dark-border">
                            <span className="text-[10px] text-oj-muted block">Quantity</span>
                            <span className="font-mono font-black text-oj-midnight dark:text-white">
                              {item.smmOrder.quantity.toLocaleString()} units
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-[#12161f] border border-oj-border dark:border-oj-dark-border">
                            <span className="text-[10px] text-oj-muted block">Start Count</span>
                            <span className="font-mono font-black text-oj-midnight dark:text-white">
                              {item.smmOrder.startCount?.toLocaleString() || '0'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-[#12161f] border border-oj-border dark:border-oj-dark-border">
                            <span className="text-[10px] text-oj-muted block">Remains</span>
                            <span className="font-mono font-black text-oj-midnight dark:text-white">
                              {item.smmOrder.remains !== undefined ? item.smmOrder.remains.toLocaleString() : 'In Delivery'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-[#12161f] border border-oj-border dark:border-oj-dark-border">
                            <span className="text-[10px] text-oj-muted block">Status</span>
                            <span className="font-bold text-amber-500 capitalize">
                              {item.smmOrder.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Sync & Support Controls */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSyncSMM(item.smmOrder!.id)}
                            disabled={syncingSmmId === item.smmOrder.id}
                            className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-oj-border dark:border-slate-700 text-xs font-bold text-oj-midnight dark:text-white hover:border-oj-primary flex items-center gap-1.5 transition-all shadow-xs"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${syncingSmmId === item.smmOrder.id ? 'animate-spin text-oj-primary' : ''}`} />
                            <span>Check Live Progress</span>
                          </button>

                          <a
                            href={`https://wa.me/2347069659752?text=${encodeURIComponent(`Hello Ojalogs Operations, checking status for SMM order ${item.reference} (${item.title}).`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Support</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Empty State when zero orders match filter */}
        {filteredOrders.length === 0 && (
          <div className="p-10 sm:p-14 text-center bg-white dark:bg-oj-dark-surface rounded-2xl border border-oj-border dark:border-oj-dark-border shadow-soft space-y-3">
            <PackageCheck className="w-12 h-12 text-oj-muted/40 mx-auto" />
            <h3 className="font-heading font-black text-base text-oj-midnight dark:text-white">
              No orders found in this view
            </h3>
            <p className="text-xs text-oj-muted max-w-sm mx-auto">
              {searchQuery
                ? `No orders matching "${searchQuery}". Clear your search or change status filter.`
                : 'Your confirmed purchases and active campaign orders will appear here automatically.'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="py-2 px-4 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-xs font-bold text-oj-midnight dark:text-white"
              >
                Clear Search
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Link
                  to="/storefront"
                  className="py-2 px-4 rounded-xl bg-oj-primary text-white text-xs font-bold shadow-soft hover:opacity-95 transition-all"
                >
                  Explore Storefront
                </Link>
                <Link
                  to="/boost"
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-soft hover:opacity-95 transition-all"
                >
                  Social Boosts
                </Link>
              </div>
            )}
          </div>
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
