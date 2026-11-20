import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  User,
  Clock,
  X,
  RotateCw,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ChevronDown,
  Shield,
  FileCode,
  Mail,
  Info,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandCoverBanner } from '../components/common/BrandCoverBanner';
import { WhatsAppSupportModal } from '../components/support/WhatsAppSupportModal';
import { SEO } from '../components/common/SEO';
import { SMMOrder, parseCredentialsPayload, SecretField, StructuredAccountPayload } from '@ojalogs/shared';
import { apiClient } from '../lib/apiClient';
import { Link } from 'react-router-dom';

function resolveVaultSecretDisplay(
  sec: any,
  productTitle: string = '',
  deliveryFormat: string = ''
): {
  isStructured: boolean;
  accounts: StructuredAccountPayload[];
  raw: string;
} {
  if (!sec) {
    return { isStructured: false, accounts: [], raw: '' };
  }

  // 1. If backend already supplied structured accounts
  if (Array.isArray(sec.accounts) && sec.accounts.length > 0) {
    const raw = sec.rawString || sec.value || '';
    return {
      isStructured: true,
      accounts: sec.accounts,
      raw
    };
  }

  // 2. If backend supplied structured fields
  if (Array.isArray(sec.structuredFields) && sec.structuredFields.length > 0) {
    const raw = sec.rawString || sec.value || '';
    return {
      isStructured: true,
      accounts: [
        {
          accountNumber: 1,
          title: 'Account Credentials',
          fields: sec.structuredFields,
          raw
        }
      ],
      raw
    };
  }

  // 3. Fallback: Parse raw payload using shared robust credential parser
  const rawCandidate = sec.rawString || sec.value || '';
  if (rawCandidate && !/^[•*.]+$/.test(rawCandidate.trim())) {
    const parsed = parseCredentialsPayload(rawCandidate, productTitle, deliveryFormat);
    return {
      isStructured: parsed.isStructured,
      accounts: parsed.accounts,
      raw: parsed.raw
    };
  }

  // 4. Truly unrevealed dots
  return {
    isStructured: false,
    accounts: [
      {
        accountNumber: 1,
        title: 'Access Credentials',
        fields: [
          {
            label: 'VAULT KEY / CREDENTIAL',
            value: rawCandidate || '••••••••••••••••••••••••••••••',
            type: 'key',
            isSensitive: true
          }
        ],
        raw: rawCandidate
      }
    ],
    raw: rawCandidate
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
  const { orders, showToast, formatPrice, currency, user, setIsAuthModalOpen, reloadOrders, revealSecret } = useApp();
  
  // Status Filter Tabs (All Orders, Completed, Pending, Failed / Cancelled)
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

  const toggleExpand = useCallback((itemId: string, orderId?: string, orderItemId?: string, hasDots?: boolean) => {
    setExpandedOrders(prev => {
      const nextState = !prev[itemId];
      if (nextState && hasDots && orderId && orderItemId && typeof revealSecret === 'function') {
        revealSecret(orderId, orderItemId).catch(() => {});
      }
      return { ...prev, [itemId]: nextState };
    });
  }, [revealSecret]);

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
      // 1. Status Filter
      if (statusTab === 'completed' && item.fulfillmentStatus !== 'completed') return false;
      if (statusTab === 'pending' && item.fulfillmentStatus !== 'processing') return false;
      if (statusTab === 'failed' && item.fulfillmentStatus !== 'refunded' && item.fulfillmentStatus !== 'cancelled') return false;

      // 2. Category Filter
      if (categoryFilter === 'account' && item.kind !== 'account') return false;
      if (categoryFilter === 'smm' && item.kind !== 'smm') return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = item.reference.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCluster = item.serverCluster.toLowerCase().includes(q);
        return matchesRef || matchesTitle || matchesCluster;
      }

      return true;
    });
  }, [unifiedOrders, statusTab, categoryFilter, searchQuery]);

  const handleCopyAccount = (acc: StructuredAccountPayload, copyId: string) => {
    const text = acc.fields.map(f => `${f.label}: ${f.value}`).join('\n');
    handleCopy(text, copyId, 'Account credentials');
  };

  const handleCopyAll = (order: any, item: any, payload: { accounts: StructuredAccountPayload[]; raw: string }, copyId: string) => {
    let content = `[OJALOGS ORDER ${order.reference}] - ${item.product?.title || item.title}\n`;
    payload.accounts.forEach((acc, idx) => {
      if (payload.accounts.length > 1) {
        content += `\n--- ${acc.title || `Account #${idx + 1}`} ---\n`;
      }
      acc.fields.forEach(f => {
        content += `${f.label}: ${f.value}\n`;
      });
    });
    if (payload.raw) {
      content += `\nRaw: ${payload.raw}`;
    }
    handleCopy(content.trim(), copyId, 'All credentials');
  };

  const handleDownloadTxt = (order: any, item: any, payload: { accounts: StructuredAccountPayload[]; raw: string }, instruction?: string) => {
    let content = `=======================================================\n`;
    content += `OJALOGS DIGITAL DELIVERY VAULT & RECEIPT\n`;
    content += `Order Reference:   ${order.reference}\n`;
    content += `Item ID:           ${item.id || item.productId || 'N/A'}\n`;
    content += `Product:           ${item.product?.title || item.title}\n`;
    content += `Server Cluster:    ${item.product?.serverCluster || 'Server 2'}\n`;
    content += `Quantity:          ${item.quantity || 1}\n`;
    content += `Purchase Date:     ${new Date(order.createdAt).toLocaleString()}\n`;
    content += `Payment Method:    ${order.paymentMethod === 'wallet' ? 'NGN Wallet' : 'BACH Gateway'}\n`;
    content += `Amount Paid:       NGN ${item.totalNgn || order.totalNgn}\n\n`;
    content += `-------------------------------------------------------\n`;
    content += `DIGITAL CREDENTIALS & ACCESS DETAILS:\n`;
    content += `-------------------------------------------------------\n`;

    payload.accounts.forEach((acc, idx) => {
      if (payload.accounts.length > 1) {
        content += `\n[ACCOUNT ${idx + 1}: ${acc.title || 'Credentials'}]\n`;
      }
      acc.fields.forEach(f => {
        content += `${f.label.padEnd(25)}: ${f.value}\n`;
      });
    });

    if (payload.raw) {
      content += `\nRAW SUPPLIER PAYLOAD:\n${payload.raw}\n`;
    }

    if (instruction) {
      content += `\n-------------------------------------------------------\n`;
      content += `USAGE INSTRUCTIONS:\n${instruction}\n`;
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
      {/* 1. Header Section (Ojalogs Brand Tokens & Typography)          */}
      {/* ============================================================== */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-oj-primary dark:text-oj-cyan flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-oj-primary dark:text-oj-cyan" />
            Order Reconciliation & Fulfillment
          </span>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-btn text-oj-muted hover:text-oj-midnight dark:hover:text-white hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt transition-all flex items-center gap-1.5 text-[11px] font-bold border border-oj-border/50 dark:border-oj-dark-border/50 shadow-xs"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-oj-primary dark:text-oj-cyan' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <h1 className="font-heading font-black text-2xl sm:text-3xl text-oj-midnight dark:text-white tracking-tight">
          Customer Orders & Vault
        </h1>
        <p className="text-xs sm:text-sm text-oj-muted dark:text-oj-dark-muted max-w-xl leading-relaxed">
          Track payment reconciliation, automated processing, and copy your delivered digital accounts and keys.
        </p>
      </div>

      {/* ============================================================== */}
      {/* 2. Primary Status Filter Tabs (Ojalogs Royal Blue Styling)     */}
      {/* ============================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setStatusTab('all')}
          className={`px-4 py-2 rounded-btn text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            statusTab === 'all'
              ? 'bg-oj-primary text-white shadow-glow-primary font-black'
              : 'bg-white dark:bg-oj-dark-surface text-oj-muted hover:text-oj-midnight dark:hover:text-white border border-oj-border dark:border-oj-dark-border'
          }`}
        >
          <span>All Orders</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            statusTab === 'all' ? 'bg-white/25 text-white' : 'bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted dark:text-oj-dark-muted'
          }`}>
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setStatusTab('completed')}
          className={`px-4 py-2 rounded-btn text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            statusTab === 'completed'
              ? 'bg-oj-primary text-white shadow-glow-primary font-black'
              : 'bg-white dark:bg-oj-dark-surface text-oj-muted hover:text-oj-midnight dark:hover:text-white border border-oj-border dark:border-oj-dark-border'
          }`}
        >
          <span>Completed</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            statusTab === 'completed' ? 'bg-white/25 text-white' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
          }`}>
            {counts.completed}
          </span>
        </button>

        <button
          onClick={() => setStatusTab('pending')}
          className={`px-4 py-2 rounded-btn text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            statusTab === 'pending'
              ? 'bg-oj-primary text-white shadow-glow-primary font-black'
              : 'bg-white dark:bg-oj-dark-surface text-oj-muted hover:text-oj-midnight dark:hover:text-white border border-oj-border dark:border-oj-dark-border'
          }`}
        >
          <span>Pending</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            statusTab === 'pending' ? 'bg-white/25 text-white' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50'
          }`}>
            {counts.pending}
          </span>
        </button>

        <button
          onClick={() => setStatusTab('failed')}
          className={`px-4 py-2 rounded-btn text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            statusTab === 'failed'
              ? 'bg-oj-primary text-white shadow-glow-primary font-black'
              : 'bg-white dark:bg-oj-dark-surface text-oj-muted hover:text-oj-midnight dark:hover:text-white border border-oj-border dark:border-oj-dark-border'
          }`}
        >
          <span>Failed / Cancelled</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            statusTab === 'failed' ? 'bg-white/25 text-white' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50'
          }`}>
            {counts.failed}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. Search Bar (Ojalogs Theme Focus and Borders)                */}
      {/* ============================================================== */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-oj-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by order ref or product..."
          className="w-full text-xs pl-10 pr-9 py-2.5 rounded-input bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white placeholder:text-oj-muted/70 focus:outline-none focus:border-oj-primary focus:ring-2 focus:ring-oj-primary/15 shadow-soft transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-oj-muted hover:text-oj-midnight dark:hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. Secondary Category Filter Chips (Unified without 0 silos)   */}
      {/* ============================================================== */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] text-oj-muted dark:text-oj-dark-muted font-bold mr-1 shrink-0">Filter By:</span>
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-btn text-xs font-bold transition-all shrink-0 ${
            categoryFilter === 'all'
              ? 'bg-oj-midnight dark:bg-white text-white dark:text-oj-midnight font-black shadow-soft'
              : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white bg-white/60 dark:bg-oj-dark-surface/60 border border-oj-border dark:border-oj-dark-border'
          }`}
        >
          All Items ({categoryCounts.all})
        </button>

        <button
          onClick={() => setCategoryFilter('account')}
          className={`px-3 py-1.5 rounded-btn text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            categoryFilter === 'account'
              ? 'bg-oj-primary text-white font-black shadow-glow-primary'
              : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white bg-white/60 dark:bg-oj-dark-surface/60 border border-oj-border dark:border-oj-dark-border'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Digital Accounts ({categoryCounts.account})</span>
        </button>

        <button
          onClick={() => setCategoryFilter('smm')}
          className={`px-3 py-1.5 rounded-btn text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            categoryFilter === 'smm'
              ? 'bg-gradient-to-r from-oj-primary to-blue-600 text-white font-black shadow-glow-primary'
              : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white bg-white/60 dark:bg-oj-dark-surface/60 border border-oj-border dark:border-oj-dark-border'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Social Boosts SMM ({categoryCounts.smm})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 5. Unified Orders Stream (Right Image & Ojalogs CSS)           */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {filteredOrders.map((item, index) => {
          const isExpanded = expandedOrders[item.id] !== undefined 
            ? expandedOrders[item.id] 
            : (item.fulfillmentStatus === 'processing' || index === 0);

          return (
            <div
              key={item.id}
              className="rounded-card bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft overflow-hidden transition-all hover:border-oj-primary/50 dark:hover:border-oj-cyan/40 hover:shadow-elevated"
            >
              {/* Card Container Padding */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* ------------------------------------------------ */}
                {/* Top Row: Server Cluster & Ref                    */}
                {/* ------------------------------------------------ */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-primary dark:text-oj-cyan border border-oj-border dark:border-oj-dark-border">
                    {item.serverCluster}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs font-mono text-oj-muted dark:text-oj-dark-muted">
                    <span className="font-semibold select-all">Ref: {item.reference}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.reference, `ref_${item.id}`, 'Order reference')}
                      className="p-1 rounded hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt text-oj-muted hover:text-oj-midnight dark:hover:text-white transition-colors"
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
                {/* Middle Row: Exact Product Image + Details        */}
                {/* ------------------------------------------------ */}
                <div className="flex items-start gap-3.5">
                  {/* Verified Brand Cover Banner / Vector Squircle Image */}
                  <BrandCoverBanner
                    product={item.accountItem?.product || { title: item.title, category: item.category }}
                    title={item.title}
                    category={item.category}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl shrink-0 shadow-sm"
                    showSubtitle={false}
                  />

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

                    {/* Dual Status Badges (Ojalogs Theme Badges) */}
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
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-500 animate-spin" />
                          <span>Delivery Awaiting Supplier</span>
                        </span>
                      ) : item.fulfillmentStatus === 'refunded' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
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
                {/* Bottom Row: Price & View Details Button          */}
                {/* ------------------------------------------------ */}
                <div className="pt-2 border-t border-oj-border/50 dark:border-oj-dark-border/50 flex items-center justify-between gap-3">
                  <div className="font-heading font-black text-lg sm:text-xl text-oj-midnight dark:text-white tracking-tight">
                    {formatPrice(item.totalNgn)}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const sec0 = item.accountItem?.deliveredSecrets?.[0];
                      const hasDots = Boolean(sec0 && (!sec0.rawString || /^[•*.]+$/.test(sec0.rawString || sec0.value || '')));
                      toggleExpand(item.id, item.orderId, item.accountItem?.id, hasDots);
                    }}
                    className="px-4 py-2 rounded-btn bg-oj-primary hover:bg-oj-primary-hover text-white text-xs font-bold transition-all shadow-glow-primary/40 flex items-center gap-1.5"
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
                          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2.5">
                            <span className="text-base leading-none">↩</span>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">Order Refunded to NGN Wallet</p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                                100% of {formatPrice(item.totalNgn)} was credited back to your account wallet. You can use your balance to purchase an in-stock alternative.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Processing / Awaiting Supplier Card (Ojalogs Blue Styling) */}
                        {item.fulfillmentStatus === 'processing' && (
                          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/60 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-100/60 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                                <Clock className="w-5 h-5 animate-spin" />
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="font-heading font-black text-sm text-oj-midnight dark:text-white">
                                  Order Confirmed · Account Credentials Being Prepared
                                </h4>
                                <p className="text-xs text-oj-muted dark:text-oj-dark-muted">
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
                              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
                                <span>2. Allocating</span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-400 font-medium flex items-center gap-1.5">
                                <span>3. Vault Reveal</span>
                              </div>
                            </div>

                            <div className="p-3 rounded-lg bg-white/80 dark:bg-oj-dark-surface/80 border border-blue-100 dark:border-blue-900/40 text-[11px] text-oj-muted dark:text-oj-dark-muted leading-relaxed">
                              Order verified & confirmed. Our operations desk is preparing and verifying your login credentials from the provider fleet. They will appear here in your vault shortly. For priority dispatch, contact support on WhatsApp (07069659752).
                            </div>

                            <a
                              href={`https://wa.me/2347069659752?text=${encodeURIComponent(`Hello Ojalogs Operations Desk, I placed order ${item.reference} for "${item.title}". Kindly expedite my credentials.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 px-4 rounded-btn bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Expedite on WhatsApp (07069659752)</span>
                            </a>
                          </div>
                        )}

                        {/* Delivered Digital Vault (When Completed) */}
                        {item.accountItem.deliveredSecrets && item.accountItem.deliveredSecrets.length > 0 && (
                          <div className="space-y-4">
                            {/* Section Category Header */}
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-oj-primary dark:text-oj-cyan flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-oj-primary dark:text-oj-cyan" />
                                Digital Credentials & Access Details
                              </span>
                              <span className="text-[11px] font-mono text-oj-muted dark:text-oj-dark-muted">
                                {item.quantity > 1 ? `${item.quantity} Accounts Allocated` : '1 Account Allocated'}
                              </span>
                            </div>

                            {item.accountItem.deliveredSecrets.map((sec: any, secIdx: number) => {
                              const secretVal = sec.value || '';
                              if (secretVal === 'PENDING_DISPATCH') return null;

                              const display = resolveVaultSecretDisplay(sec, item.title, item.accountItem?.product?.deliveryFormat);
                              const itemKey = `${item.id}_sec_${secIdx}`;
                              const isGuideOpen = guidesOpen[itemKey] !== false;
                              const isRawOpen = !!rawOpen[itemKey];
                              const isTrulyDots = Boolean(!display.raw || /^[•*.]+$/.test(display.raw.trim()));
                              const instructionText = sec.instruction || (sec.accounts?.[0]?.instructions?.join('\n'));

                              return (
                                <div
                                  key={secIdx}
                                  className="rounded-2xl bg-white dark:bg-[#12161f] border border-oj-border dark:border-oj-dark-border p-4 sm:p-5 shadow-sm space-y-4"
                                >
                                  {/* Vault Header Bar */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-oj-border dark:border-oj-dark-border">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-oj-primary/10 text-oj-primary dark:bg-oj-cyan/15 dark:text-oj-cyan flex items-center justify-center shrink-0 border border-oj-primary/20 dark:border-oj-cyan/30">
                                        <Shield className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <h4 className="font-heading font-black text-sm sm:text-base text-oj-midnight dark:text-white">
                                          Digital Delivery Vault
                                        </h4>
                                        <p className="text-[11px] text-oj-muted dark:text-oj-dark-muted">
                                          Verified Secure Access · Sensitive details masked by default
                                        </p>
                                      </div>
                                    </div>

                                    {/* Top Action Toolbar */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {instructionText && (
                                        <button
                                          type="button"
                                          onClick={() => toggleGuide(itemKey)}
                                          className={`py-1.5 px-3 rounded-btn text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs ${
                                            isGuideOpen
                                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                              : 'bg-white dark:bg-oj-dark-surface text-oj-muted hover:text-oj-midnight dark:hover:text-white border-oj-border dark:border-oj-dark-border'
                                          }`}
                                        >
                                          <Info className="w-3.5 h-3.5" />
                                          <span>Usage Guide</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleDownloadTxt(item.originalOrder, item.accountItem, display, instructionText)}
                                        className="py-1.5 px-3 rounded-btn bg-white dark:bg-oj-dark-surface hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-xs font-bold text-oj-midnight dark:text-white flex items-center gap-1.5 transition-all shadow-xs"
                                      >
                                        <Download className="w-3.5 h-3.5 text-oj-muted" />
                                        <span>Download .txt</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleCopyAll(item.originalOrder, item.accountItem, display, `copy_all_${itemKey}`)}
                                        className="py-1.5 px-3.5 rounded-btn bg-oj-primary hover:bg-oj-primary-hover text-white text-xs font-bold transition-all shadow-glow-primary flex items-center gap-1.5"
                                      >
                                        {copiedId === `copy_all_${itemKey}` ? (
                                          <>
                                            <Check className="w-3.5 h-3.5" />
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
                                  </div>

                                  {/* Usage Guide Box (Collapsible) */}
                                  {isGuideOpen && instructionText && (
                                    <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/60 text-xs text-blue-950 dark:text-blue-200 space-y-1.5">
                                      <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
                                        <Info className="w-4 h-4 shrink-0" />
                                        <span>Fulfillment Guidance & Setup</span>
                                      </div>
                                      <p className="text-[11px] leading-relaxed whitespace-pre-line text-blue-900/90 dark:text-blue-300/90 pl-6">
                                        {instructionText}
                                      </p>
                                    </div>
                                  )}

                                  {/* Accounts Breakdown */}
                                  {isTrulyDots ? (
                                    <div className="p-5 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-center space-y-3">
                                      <Lock className="w-8 h-8 text-oj-primary dark:text-oj-cyan mx-auto" />
                                      <div className="space-y-1">
                                        <h5 className="font-heading font-black text-sm text-oj-midnight dark:text-white">
                                          Credentials Encrypted with AES-256-GCM
                                        </h5>
                                        <p className="text-xs text-oj-muted dark:text-oj-dark-muted max-w-sm mx-auto">
                                          Click below to decrypt and load your verified email, password, and recovery keys directly into your vault.
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (typeof revealSecret === 'function') {
                                            revealSecret(item.orderId, item.accountItem.id);
                                          }
                                        }}
                                        className="px-5 py-2.5 rounded-btn bg-oj-primary hover:bg-oj-primary-hover text-white text-xs font-bold shadow-glow-primary transition-all inline-flex items-center gap-2"
                                      >
                                        <KeyRound className="w-4 h-4" />
                                        <span>Decrypt & View Credentials</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      {display.accounts.map((acc, aIdx) => (
                                        <div
                                          key={aIdx}
                                          className="rounded-xl border border-oj-border/80 dark:border-oj-dark-border/80 bg-oj-surface-alt/40 dark:bg-oj-dark-surface-alt/30 p-3.5 sm:p-4 space-y-3"
                                        >
                                          {/* Account Header */}
                                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-oj-border/60 dark:border-oj-dark-border/60">
                                            <div className="flex items-center gap-2">
                                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-oj-primary/10 dark:bg-oj-cyan/15 text-oj-primary dark:text-oj-cyan border border-oj-primary/20 dark:border-oj-cyan/30">
                                                CREDENTIALS & ACCESS
                                              </span>
                                              <span className="text-xs font-bold text-oj-midnight dark:text-white">
                                                {acc.title || `Account Credentials ${display.accounts.length > 1 ? `#${aIdx + 1}` : ''}`}
                                              </span>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => handleCopyAccount(acc, `copy_acc_${itemKey}_${aIdx}`)}
                                              className="py-1 px-2.5 rounded-md bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border hover:border-oj-primary dark:hover:border-oj-cyan text-[11px] font-bold text-oj-midnight dark:text-white flex items-center gap-1.5 transition-all shadow-xs"
                                            >
                                              {copiedId === `copy_acc_${itemKey}_${aIdx}` ? (
                                                <>
                                                  <Check className="w-3 h-3 text-emerald-500" />
                                                  <span>Copied!</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Copy className="w-3 h-3 text-oj-muted" />
                                                  <span>Copy Account</span>
                                                </>
                                              )}
                                            </button>
                                          </div>

                                          {/* Discrete Labeled Credential Rows */}
                                          <div className="space-y-2">
                                            {acc.fields.map((field, fIdx) => {
                                              const fieldKey = `${itemKey}_${aIdx}_${fIdx}`;
                                              const isSensitive = field.isSensitive ?? (field.type === 'password' || field.type === 'recovery_email' || field.type === 'backup_codes' || field.type === '2fa');
                                              const isRevealed = revealedPasswords[fieldKey];
                                              const isCopied = copiedId === fieldKey;

                                              return (
                                                <div
                                                  key={fIdx}
                                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-lg bg-white dark:bg-oj-dark-surface border border-oj-border/80 dark:border-oj-dark-border/80 gap-2 sm:gap-3 transition-colors hover:border-oj-primary/30"
                                                >
                                                  {/* Label & Icon */}
                                                  <div className="flex items-center gap-2 sm:w-44 shrink-0">
                                                    <span className="text-oj-primary dark:text-oj-cyan">
                                                      {field.type === 'email' && <Mail className="w-3.5 h-3.5" />}
                                                      {field.type === 'uid' && <User className="w-3.5 h-3.5" />}
                                                      {field.type === 'password' && <KeyRound className="w-3.5 h-3.5 text-amber-500" />}
                                                      {field.type === 'recovery_email' && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                                                      {field.type === 'backup_codes' && <FileCode className="w-3.5 h-3.5 text-purple-500" />}
                                                      {field.type === '2fa' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                                      {field.type === 'token' && <KeyRound className="w-3.5 h-3.5 text-indigo-500" />}
                                                      {field.type === 'key' && <KeyRound className="w-3.5 h-3.5 text-amber-500" />}
                                                    </span>
                                                    <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-oj-muted dark:text-oj-dark-muted uppercase">
                                                      {field.label}
                                                    </span>
                                                  </div>

                                                  {/* Value */}
                                                  <div className="flex-1 min-w-0 px-1 font-mono text-xs font-bold select-all text-oj-midnight dark:text-white truncate">
                                                    {isSensitive && !isRevealed ? '••••••••••••••••••••••••••••••' : field.value}
                                                  </div>

                                                  {/* Individual Actions */}
                                                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                                    {isSensitive && (
                                                      <button
                                                        type="button"
                                                        onClick={() => togglePasswordVisibility(fieldKey)}
                                                        className="p-1.5 rounded-md hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt text-oj-muted hover:text-oj-midnight dark:hover:text-white transition-colors"
                                                        title={isRevealed ? 'Mask' : 'Reveal'}
                                                      >
                                                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                      </button>
                                                    )}

                                                    <button
                                                      type="button"
                                                      onClick={() => handleCopy(field.value, fieldKey, field.label)}
                                                      className="px-2.5 py-1 rounded-md bg-oj-surface-alt/80 dark:bg-oj-dark-surface-alt/80 hover:bg-oj-primary hover:text-white text-[11px] font-bold text-oj-midnight dark:text-white border border-oj-border/60 dark:border-oj-dark-border/60 flex items-center gap-1 transition-all"
                                                      title={`Copy ${field.label}`}
                                                    >
                                                      {isCopied ? (
                                                        <>
                                                          <Check className="w-3 h-3 text-emerald-500" />
                                                          <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                                                        </>
                                                      ) : (
                                                        <>
                                                          <Copy className="w-3 h-3 text-oj-muted" />
                                                          <span>Copy</span>
                                                        </>
                                                      )}
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>

                                          {/* 2FA Live Helper */}
                                          {acc.fields.some(f => f.type === '2fa') && (
                                            <div className="pt-1 flex items-center justify-between text-[11px] px-1 text-oj-muted dark:text-oj-dark-muted">
                                              <span>Need a 6-digit verification code?</span>
                                              <a
                                                href="https://2fa.live"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 font-bold text-oj-primary dark:text-oj-cyan hover:underline"
                                              >
                                                <span>Open 2FA.Live Helper</span>
                                                <ExternalLink className="w-3 h-3" />
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Collapsible Original Supplier Raw Text */}
                                  <div className="pt-2 border-t border-oj-border dark:border-oj-dark-border">
                                    <button
                                      type="button"
                                      onClick={() => toggleRaw(itemKey)}
                                      className="text-[11px] font-bold text-oj-muted hover:text-oj-midnight dark:hover:text-white flex items-center gap-1.5 transition-colors"
                                    >
                                      <span>{isRawOpen ? 'Hide Original Supplier Raw Text' : 'View Original Supplier Raw Text'}</span>
                                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isRawOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isRawOpen && (
                                      <div className="mt-2.5 p-3 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-oj-muted">
                                            Raw Delimited Fulfillment String
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleCopy(display.raw, `raw_copy_${itemKey}`, 'Raw string')}
                                            className="text-[10px] font-bold text-oj-primary dark:text-oj-cyan hover:underline flex items-center gap-1"
                                          >
                                            <Copy className="w-3 h-3" />
                                            <span>Copy Raw</span>
                                          </button>
                                        </div>
                                        <div className="font-mono text-xs text-oj-midnight dark:text-white break-all select-all bg-white dark:bg-[#0c0f14] p-2.5 rounded-lg border border-oj-border/60 dark:border-oj-dark-border/60">
                                          {display.raw}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Quick Action Toolbar */}
                                  <div className="pt-2 border-t border-oj-border dark:border-oj-dark-border flex items-center justify-between gap-2 flex-wrap text-xs">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadTxt(item.originalOrder, item.accountItem, display, instructionText)}
                                        className="py-1.5 px-3 rounded-btn bg-oj-surface-alt dark:bg-oj-dark-surface-alt hover:bg-oj-primary hover:text-white border border-oj-border dark:border-oj-dark-border font-bold text-oj-midnight dark:text-white flex items-center gap-1.5 transition-all shadow-xs"
                                        title="Download .txt"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Download .txt</span>
                                      </button>

                                      <a
                                        href={getPlatformLoginUrl(item.title)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-1.5 px-3 rounded-btn bg-oj-surface-alt dark:bg-oj-dark-surface-alt hover:bg-oj-primary hover:text-white border border-oj-border dark:border-oj-dark-border font-bold text-oj-midnight dark:text-white flex items-center gap-1.5 transition-all shadow-xs"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 text-oj-primary dark:text-oj-cyan" />
                                        <span>Direct Login</span>
                                      </a>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => window.print()}
                                      className="py-1.5 px-3 rounded-btn bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-oj-muted hover:text-oj-midnight dark:hover:text-white font-bold flex items-center gap-1.5 transition-all shadow-xs"
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
                            <span className="font-bold text-oj-primary dark:text-oj-cyan capitalize">
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
                            className="py-2 px-3 rounded-btn bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-xs font-bold text-oj-midnight dark:text-white hover:border-oj-primary flex items-center gap-1.5 transition-all shadow-xs"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${syncingSmmId === item.smmOrder.id ? 'animate-spin text-oj-primary' : ''}`} />
                            <span>Check Live Progress</span>
                          </button>

                          <a
                            href={`https://wa.me/2347069659752?text=${encodeURIComponent(`Hello Ojalogs Operations, checking status for SMM order ${item.reference} (${item.title}).`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-3 rounded-btn bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all"
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
          <div className="p-10 sm:p-14 text-center bg-white dark:bg-oj-dark-surface rounded-card border border-oj-border dark:border-oj-dark-border shadow-soft space-y-3">
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
                className="py-2 px-4 rounded-btn bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-xs font-bold text-oj-midnight dark:text-white"
              >
                Clear Search
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Link
                  to="/storefront"
                  className="py-2 px-4 rounded-btn bg-oj-primary text-white text-xs font-bold shadow-glow-primary hover:opacity-95 transition-all"
                >
                  Explore Storefront
                </Link>
                <Link
                  to="/boost"
                  className="py-2 px-4 rounded-btn bg-gradient-to-r from-oj-primary to-blue-600 text-white text-xs font-bold shadow-glow-primary hover:opacity-95 transition-all"
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
