import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../lib/apiClient';
import { SMMService, SMMOrder, SMMPlatform } from '@ojalogs/shared';
import {
  Zap,
  Flame,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Info,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  ShoppingBag,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SocialBoostPage: React.FC = () => {
  const { user, wallet, formatPrice, setIsAuthModalOpen, showToast, refreshWallet } = useApp();

  const [services, setServices] = useState<SMMService[]>([]);
  const [orders, setOrders] = useState<SMMOrder[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [targetLink, setTargetLink] = useState('');
  const [quantity, setQuantity] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [activeTab, setActiveTab] = useState<'order' | 'history'>('order');

  const platforms: { id: string; label: string; icon: string }[] = [
    { id: 'all', label: 'All Services', icon: '🌐' },
    { id: 'instagram', label: 'Instagram', icon: '📸' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵' },
    { id: 'youtube', label: 'YouTube', icon: '▶️' },
    { id: 'twitter', label: 'X / Twitter', icon: '🐦' },
    { id: 'telegram', label: 'Telegram', icon: '✈️' },
    { id: 'spotify', label: 'Spotify', icon: '🎧' },
    { id: 'facebook', label: 'Facebook', icon: '👥' },
  ];

  // Auto-prompt sign-in modal if visitor is not logged in
  useEffect(() => {
    if (!user) {
      setIsAuthModalOpen(true);
    }
  }, [user, setIsAuthModalOpen]);

  // Fetch Services (only if user is authenticated)
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.getSMMServices();
        if (isMounted && data && data.length > 0) {
          setServices(data);
          if (!selectedServiceId) {
            setSelectedServiceId(data[0].id);
            setQuantity(data[0].minQuantity || 1000);
          }
        }
      } catch (err: any) {
        console.warn('Could not fetch SMM services:', err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchServices();
    return () => { isMounted = false; };
  }, [user]);

  // Fetch User SMM Orders
  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try {
        const data = await apiClient.getSMMOrders();
        if (data) setOrders(data);
      } catch {}
    };
    fetchOrders();
  }, [user]);

  const filteredServices = services.filter(s => {
    if (selectedPlatform === 'all') return true;
    return s.platform === selectedPlatform;
  });

  const selectedService = services.find(s => s.id === selectedServiceId) || filteredServices[0] || services[0];

  // Auto-align quantity with minQuantity if user changes service
  useEffect(() => {
    if (selectedService && quantity < selectedService.minQuantity) {
      setQuantity(selectedService.minQuantity);
    }
  }, [selectedServiceId]);

  const calculatedTotalNgn = selectedService
    ? Math.round((selectedService.retailRateNgn / 1000) * (quantity || 0))
    : 0;

  // Authentication Gate: Require user to sign in before seeing the products & catalog
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 pb-24 md:pb-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/10 text-amber-500 mx-auto flex items-center justify-center shadow-soft border border-amber-500/20">
          <Flame className="w-8 h-8 fill-amber-500" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Member Authentication Required</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-oj-midnight dark:text-white">
            Social Media Boost (SMM) Services
          </h1>
          <p className="text-xs sm:text-sm text-oj-muted dark:text-oj-dark-muted max-w-md mx-auto leading-relaxed">
            Our private catalog of wholesale SMM services (Instagram, TikTok, YouTube, X & Telegram) is reserved for authenticated members. Please sign in or register with your email to unlock all services and rates.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft max-w-md mx-auto space-y-4">
          <div className="space-y-2.5 text-left text-xs">
            <div className="flex items-center gap-2.5 text-oj-midnight dark:text-white font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Instant access to 100+ Instagram, TikTok & YouTube services</span>
            </div>
            <div className="flex items-center gap-2.5 text-oj-midnight dark:text-white font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Real-time price calculator & live delivery tracking</span>
            </div>
            <div className="flex items-center gap-2.5 text-oj-midnight dark:text-white font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Instant automated checkout with your verified NGN wallet</span>
            </div>
            <div className="flex items-center gap-2.5 text-oj-midnight dark:text-white font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Reseller API keys for automated bulk orders</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Instant sign-in · No password fatigue with Magic Link / OTP</span>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3.5 rounded-btn bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105"
          >
            <Lock className="w-4 h-4" />
            <span>Sign In or Register with Email</span>
          </button>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast('Please sign in with your email to place an SMM order');
      setIsAuthModalOpen(true);
      return;
    }

    if (!selectedService) {
      showToast('Please select a valid service');
      return;
    }

    if (!targetLink || !targetLink.trim()) {
      showToast('Please input your target profile or post link');
      return;
    }

    if (quantity < selectedService.minQuantity || quantity > selectedService.maxQuantity) {
      showToast(`Quantity must be between ${selectedService.minQuantity.toLocaleString()} and ${selectedService.maxQuantity.toLocaleString()}`);
      return;
    }

    if (wallet.balanceNgn < calculatedTotalNgn) {
      showToast(`Insufficient wallet balance. Please add at least ${formatPrice(calculatedTotalNgn - wallet.balanceNgn)} to your wallet.`);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const order = await apiClient.placeSMMOrder(
        selectedService.id,
        targetLink.trim(),
        quantity,
        `idemp_smm_${Date.now()}`
      );

      setOrders(prev => [order, ...prev]);
      setTargetLink('');
      refreshWallet();

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast(`🚀 SMM Boost Order ${order.reference} placed successfully!`);
      setActiveTab('history');
    } catch (err: any) {
      showToast(err.message || 'Failed to place SMM order. Please check wallet balance.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleSyncOrder = async (orderId: string) => {
    try {
      const updated = await apiClient.syncSMMOrder(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      showToast(`Order ${updated.reference} status: ${updated.status.toUpperCase()}`);
    } catch {
      showToast('Could not sync status with provider');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-28 md:pb-12">
      {/* Hero Header */}
      <div className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-oj-midnight via-oj-navy to-oj-midnight border border-oj-border dark:border-oj-dark-border shadow-2xl overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>High-Speed SMM Social Boost Hub</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl tracking-tight">
            Grow Your Social Media Presence & Authority
          </h1>
          <p className="text-xs sm:text-sm text-oj-muted dark:text-slate-300 leading-relaxed max-w-2xl">
            Instant organic engagement, high-retention followers, views, and algorithmic boosts across Instagram, TikTok, YouTube, X, and Telegram. Automated high-speed server fulfillment.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Safe Delivery Engine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Instant Server Dispatch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RotateCw className="w-4 h-4 text-oj-cyan" />
              <span>Automatic Cancellation Refund</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation View Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-oj-border dark:border-oj-dark-border pb-3">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('order')}
            className={`justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'order'
                ? 'bg-oj-primary text-white shadow-soft'
                : 'bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted hover:text-oj-midnight dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>New Boost Order</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-oj-primary text-white shadow-soft'
                : 'bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted hover:text-oj-midnight dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>My Orders ({orders.length})</span>
          </button>
        </div>

        {user && (
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs bg-oj-surface-alt/70 dark:bg-oj-dark-surface-alt/70 sm:bg-transparent px-3.5 py-2 sm:p-0 rounded-xl border border-oj-border/50 dark:border-oj-dark-border/50 sm:border-0 w-full sm:w-auto">
            <span className="text-oj-muted text-xs whitespace-nowrap">Your Wallet Balance:</span>
            <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
              {formatPrice(wallet.balanceNgn)}
            </span>
          </div>
        )}
      </div>

      {activeTab === 'order' ? (
        <div className="space-y-8">
          {/* Platform Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {platforms.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPlatform(p.id);
                  const matching = services.filter(s => p.id === 'all' || s.platform === p.id);
                  if (matching.length > 0) {
                    setSelectedServiceId(matching[0].id);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  selectedPlatform === p.id
                    ? 'bg-oj-midnight text-white border-oj-midnight dark:bg-white dark:text-oj-midnight shadow-sm'
                    : 'bg-white dark:bg-oj-dark-surface border-oj-border dark:border-oj-dark-border text-oj-muted hover:text-oj-midnight dark:hover:text-white'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Main Order Form Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Form */}
            <form onSubmit={handlePlaceOrder} className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-oj-border dark:border-oj-dark-border">
                <h3 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Configure Your SMM Boost</span>
                </h3>
                <span className="text-[10px] font-mono text-oj-muted font-bold">
                  {filteredServices.length} Services Available
                </span>
              </div>

              {/* Service Selector */}
              <div>
                <label className="block text-xs font-bold text-oj-midnight dark:text-white mb-1.5">
                  Select Service *
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-oj-border dark:border-oj-dark-border bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-xs font-medium text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
                >
                  {filteredServices.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.category}] {s.name} — ₦{s.retailRateNgn.toLocaleString()} / 1k
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Link */}
              <div>
                <label className="block text-xs font-bold text-oj-midnight dark:text-white mb-1.5">
                  Target Link (Profile / Post URL) *
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-oj-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={targetLink}
                    onChange={(e) => setTargetLink(e.target.value)}
                    placeholder="https://instagram.com/your_username or post URL"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-oj-border dark:border-oj-dark-border bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-xs font-medium text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
                  />
                </div>
                <p className="text-[11px] text-oj-muted mt-1">
                  Ensure the account or post is set to <strong>Public</strong> before placing order.
                </p>
              </div>

              {/* Quantity */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-oj-midnight dark:text-white">
                    Quantity *
                  </label>
                  {selectedService && (
                    <span className="text-[10px] font-mono text-oj-muted">
                      Min: {selectedService.minQuantity.toLocaleString()} | Max: {selectedService.maxQuantity.toLocaleString()}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  min={selectedService?.minQuantity || 10}
                  max={selectedService?.maxQuantity || 500000}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-oj-border dark:border-oj-dark-border bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-xs font-mono font-bold text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
                />

                {/* Quick select pills */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  {[500, 1000, 2500, 5000, 10000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuantity(amt)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        quantity === amt
                          ? 'bg-oj-primary text-white border-oj-primary'
                          : 'bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted border-oj-border dark:border-oj-dark-border hover:text-oj-midnight dark:hover:text-white'
                      }`}
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="p-4 rounded-xl bg-oj-surface-alt/70 dark:bg-oj-dark-surface-alt/70 border border-oj-border dark:border-oj-dark-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-oj-muted block">Estimated Investment</span>
                  <p className="font-heading font-extrabold text-xl text-oj-primary dark:text-oj-cyan mt-0.5">
                    {formatPrice(calculatedTotalNgn)}
                  </p>
                  <span className="text-[10px] text-oj-muted">
                    Rate: ₦{selectedService?.retailRateNgn.toLocaleString()} per 1,000 units
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isPlacingOrder}
                  className="px-6 py-3 rounded-xl bg-oj-primary hover:bg-oj-primary-hover text-white font-bold text-xs shadow-glow-primary transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isPlacingOrder ? 'Submitting Boost...' : `Boost Now (${formatPrice(calculatedTotalNgn)})`}</span>
                </button>
              </div>
            </form>

            {/* Right 5 Columns: Service Spec & Live Details */}
            <div className="lg:col-span-5 space-y-4">
              {selectedService ? (
                <div className="p-6 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-oj-border dark:border-oj-dark-border">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-oj-primary/10 text-oj-primary dark:bg-oj-primary/20">
                      {selectedService.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      ● Active High Speed
                    </span>
                  </div>

                  <div>
                    <h4 className="font-heading font-bold text-sm text-oj-midnight dark:text-white">
                      {selectedService.name}
                    </h4>
                    {selectedService.description && (
                      <p className="text-xs text-oj-muted mt-2 leading-relaxed">
                        {selectedService.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-oj-border dark:border-oj-dark-border">
                    <div className="p-3 rounded-xl bg-oj-surface-alt/50 dark:bg-oj-dark-surface-alt/50 border border-oj-border dark:border-oj-dark-border">
                      <span className="text-[10px] text-oj-muted block">Retail Rate / 1k</span>
                      <span className="font-mono font-bold text-sm text-oj-midnight dark:text-white">
                        ₦{selectedService.retailRateNgn.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-oj-surface-alt/50 dark:bg-oj-dark-surface-alt/50 border border-oj-border dark:border-oj-dark-border">
                      <span className="text-[10px] text-oj-muted block">Refill Guarantee</span>
                      <span className="font-bold text-xs text-emerald-600">
                        {selectedService.refillSupported ? '✓ 30 Days Refill' : 'Standard Delivery'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[11px]">
                      Orders begin processing within seconds of confirmation. Progress updates sync directly to your account.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Developer / Reseller API Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-oj-surface-alt to-white dark:from-oj-dark-surface-alt dark:to-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-oj-primary" />
                  <h4 className="font-heading font-bold text-xs text-oj-midnight dark:text-white">
                    Looking for SMM API for Your Bot or Panel?
                  </h4>
                </div>
                <p className="text-xs text-oj-muted leading-relaxed">
                  Ojalogs supports the industry-standard SMM protocol. Resellers can connect directly via <span className="font-mono text-oj-primary">/api/v1/smm/api</span> using standard actions (<code className="text-[10px]">services</code>, <code className="text-[10px]">add</code>, <code className="text-[10px]">status</code>, <code className="text-[10px]">balance</code>).
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* Order Guide & General Rules (Crucial User Specification)   */}
          {/* ========================================================== */}
          <div className="p-6 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 shadow-soft space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-heading font-extrabold text-sm sm:text-base">
                Order Guide & General Rules
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
              <div className="space-y-2">
                <p>
                  • <strong>Account Must Be Public:</strong> Do not set your profile or posts to private while your order is active. Private profiles cannot receive engagements.
                </p>
                <p>
                  • <strong>No Duplicate Orders:</strong> Never place a second order on the exact same link until the first order has finished processing to avoid count collisions.
                </p>
                <p>
                  • <strong>Accurate URL Format:</strong> Double check that you supply the full direct URL (e.g. <code>https://instagram.com/p/...</code>) rather than just a handle.
                </p>
              </div>

              <div className="space-y-2">
                <p className="p-2.5 rounded-xl bg-amber-100/70 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-800 font-semibold text-amber-950 dark:text-amber-100">
                  ⚠️ <strong>Important Notice:</strong> Engagement is not guaranteed. Cheap services may slow down during peak load.
                </p>
                <p>
                  • <strong>Automated Refund Protection:</strong> If a service is rejected or canceled upstream, 100% of the funds are refunded directly back to your Ojalogs wallet.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* My SMM Boost Orders View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white">
              My SMM Boost Orders History
            </h3>
            <span className="text-xs font-mono text-oj-muted font-bold">
              Total Orders: {orders.length}
            </span>
          </div>

          {/* Mobile Card List (Phones) */}
          <div className="sm:hidden space-y-3">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-oj-muted bg-white dark:bg-oj-dark-surface rounded-2xl border border-oj-border dark:border-oj-dark-border shadow-soft">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-30 text-oj-primary" />
                <p className="font-bold text-xs text-oj-midnight dark:text-white">No SMM orders yet.</p>
                <p className="text-[11px] text-oj-muted mt-1">Configure a boost above to accelerate your social media growth.</p>
              </div>
            ) : (
              orders.map(o => (
                <div key={o.id} className="p-4 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-oj-midnight dark:text-white">{o.reference}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      o.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : o.status === 'canceled'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      {o.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-oj-midnight dark:text-white">{o.serviceName}</p>

                  <a
                    href={o.targetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-oj-primary hover:underline font-mono text-[11px] flex items-center gap-1 truncate"
                  >
                    <span className="truncate">{o.targetLink}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>

                  <div className="pt-2 border-t border-oj-border/50 dark:border-oj-dark-border/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-oj-muted block">Quantity</span>
                      <span className="font-mono font-bold text-oj-midnight dark:text-white">{o.quantity.toLocaleString()}</span>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] text-oj-muted block">Total Cost</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(o.totalNgn)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSyncOrder(o.id)}
                      className="p-1.5 rounded-lg border border-oj-border dark:border-oj-dark-border bg-oj-surface-alt dark:bg-oj-dark-surface-alt hover:bg-oj-border text-oj-midnight dark:text-white transition-colors"
                      title="Refresh status"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop & Tablet Table */}
          <div className="hidden sm:block border border-oj-border dark:border-oj-dark-border rounded-xl overflow-x-auto bg-white dark:bg-oj-dark-surface shadow-soft">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted border-b border-oj-border dark:border-oj-dark-border">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Reference</th>
                  <th className="py-2.5 px-3 font-semibold">Service</th>
                  <th className="py-2.5 px-3 font-semibold">Target Link</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Qty</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oj-border dark:divide-oj-dark-border">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-oj-muted">
                      <Zap className="w-8 h-8 mx-auto mb-2 opacity-30 text-oj-primary" />
                      <p className="font-semibold text-xs">No SMM orders yet.</p>
                      <p className="text-[11px] text-oj-muted mt-0.5">
                        Configure a boost above to rapidly accelerate your social media growth.
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map(o => (
                    <tr key={o.id} className="hover:bg-oj-surface-alt/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-oj-midnight dark:text-white">
                        {o.reference}
                      </td>
                      <td className="py-3 px-3 font-medium text-oj-midnight dark:text-white max-w-xs truncate">
                        {o.serviceName}
                      </td>
                      <td className="py-3 px-3">
                        <a
                          href={o.targetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-oj-primary hover:underline font-mono text-[11px] flex items-center gap-1 max-w-[180px] truncate"
                        >
                          <span className="truncate">{o.targetLink}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {o.quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-oj-midnight dark:text-white">
                        {formatPrice(o.totalNgn)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : o.status === 'canceled'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {o.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSyncOrder(o.id)}
                          className="p-1.5 rounded-lg border border-oj-border dark:border-oj-dark-border bg-oj-surface-alt dark:bg-oj-dark-surface-alt hover:bg-oj-border text-oj-midnight dark:text-white transition-colors"
                          title="Refresh status from provider"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

