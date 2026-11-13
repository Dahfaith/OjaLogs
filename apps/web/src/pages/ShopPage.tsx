import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  RotateCw,
  Search,
  Heart,
  ShoppingCart,
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Check,
  Shield,
  Layers,
  CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { APPROVED_CATEGORIES, Product, resolveProductCategory } from '@ojalogs/shared';
import { apiClient } from '../lib/apiClient';
import {
  BrandCoverBanner,
  getBrandConfig,
  ThreadsLogo
} from '../components/common/BrandCoverBanner';
import {
  InstagramIcon,
  FacebookIcon,
  TwitterXIcon,
  TikTokIcon,
  GmailIcon
} from '../components/common/BrandIcons';

export const resolveProductCover = (prod: Product): string => {
  return prod.coverImage || '';
};

// Platform Quick Filter Definitions
const PLATFORM_PILLS = [
  { id: 'All', label: 'All Categories', icon: null },
  { id: 'cards', label: 'Mastercard & Cards', icon: () => <CreditCard className="w-3.5 h-3.5 shrink-0 text-amber-500" /> },
  { id: 'threads', label: 'Threads', icon: () => <ThreadsLogo /> },
  { id: 'instagram', label: 'Instagram', icon: () => <InstagramIcon className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'facebook', label: 'Facebook', icon: () => <FacebookIcon className="w-3.5 h-3.5 shrink-0 text-[#1877f2]" /> },
  { id: 'twitter', label: 'Twitter (X)', icon: () => <TwitterXIcon className="w-3.5 h-3.5 shrink-0 text-slate-900 dark:text-white" /> },
  { id: 'tiktok', label: 'TikTok', icon: () => <TikTokIcon className="w-3.5 h-3.5 shrink-0 text-black dark:text-white" /> },
  { id: 'gmail', label: 'Gmail', icon: () => <GmailIcon className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'vpn', label: 'VPN & Security', icon: () => <Shield className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> },
  { id: 'ai', label: 'AI Subscriptions', icon: () => <Zap className="w-3.5 h-3.5 shrink-0 text-amber-500" /> }
];

export const ShopPage: React.FC = () => {
  const {
    products: localProducts,
    favourites,
    toggleFavourite,
    addToCart,
    formatPrice,
    user,
    setIsAuthModalOpen,
    showToast,
    refreshCatalog
  } = useApp();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedServer, setSelectedServer] = useState<string>(() => searchParams.get('server') || 'All');
  const [selectedPlatform, setSelectedPlatform] = useState<string>(() => searchParams.get('platform') || 'All');
  const [availabilityFilter, setAvailabilityFilter] = useState<'All' | 'in_stock' | 'out_of_stock'>('All');
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Quantities map for each product card
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedAnimation, setAddedAnimation] = useState<Record<string, boolean>>({});

  // Paginated Catalog State
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 4797,
    totalPages: 240,
    inStock: 4797,
    outOfStock: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync category param if user navigates via footer / deep link
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      const lower = cat.toLowerCase();
      if (['instagram', 'facebook', 'twitter', 'tiktok', 'gmail', 'vpn', 'ai', 'cards'].includes(lower)) {
        setSelectedPlatform(lower);
      }
    }
  }, [searchParams]);

  // Fetch paginated catalog from backend
  const fetchProducts = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      if (selectedServer === 'Favourites') {
        const favProducts = localProducts.filter(p => favourites.includes(p.id));
        setCatalogProducts(favProducts);
        setPagination({
          page: 1,
          limit: pageSize,
          total: favProducts.length,
          totalPages: Math.max(1, Math.ceil(favProducts.length / pageSize)),
          inStock: favProducts.filter(p => p.inStock).length,
          outOfStock: favProducts.filter(p => !p.inStock).length
        });
        return;
      }

      const res = await apiClient.getCatalogPaginated({
        page,
        limit: pageSize,
        search: searchQuery.trim() || undefined,
        category: selectedPlatform !== 'All' ? selectedPlatform : undefined,
        serverCluster: selectedServer !== 'All' ? selectedServer : undefined,
        availability: availabilityFilter !== 'All' ? availabilityFilter : undefined
      });

      if (res && res.products) {
        setCatalogProducts(res.products);
        if (res.pagination) {
          setPagination(res.pagination);
          setCurrentPage(res.pagination.page);
        }
      }
    } catch (err: any) {
      console.warn('[SHOP_CATALOG] Could not fetch paginated catalog:', err.message);
      // Fallback to local products with accurate category normalization
      let pool = localProducts.map(p => {
        const { category, categoryId } = resolveProductCategory(p.title, p.category, p.summary || p.descriptionHtml);
        return { ...p, category, categoryId };
      });
      if (selectedServer && selectedServer !== 'All') {
        pool = pool.filter(p => p.serverCluster === selectedServer);
      }
      if (selectedPlatform && selectedPlatform !== 'All') {
        const lowerCat = selectedPlatform.toLowerCase();
        pool = pool.filter(p => {
          if (p.categoryId === lowerCat || p.category.toLowerCase() === lowerCat) return true;
          const t = p.title.toLowerCase();
          if (lowerCat === 'cards' || lowerCat === 'gift-cards') return p.categoryId === 'gift-cards' || /\b(mastercard|visa|card|gift)\b/i.test(t);
          if (lowerCat === 'gmail' || lowerCat === 'email') return p.categoryId === 'email' || /\b(gmail|google\s*mail)\b/i.test(t);
          if (lowerCat === 'ai' || lowerCat === 'ai-tools') return p.categoryId === 'ai-tools' || /\b(ai|chatgpt|openai)\b/i.test(t);
          return t.includes(lowerCat);
        });
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        pool = pool.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
      }
      const fallback = pool.slice((page - 1) * pageSize, page * pageSize);
      setCatalogProducts(fallback);
      setPagination({
        page,
        limit: pageSize,
        total: pool.length,
        totalPages: Math.max(1, Math.ceil(pool.length / pageSize)),
        inStock: pool.filter(p => p.inStock).length,
        outOfStock: pool.filter(p => !p.inStock).length
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedServer, selectedPlatform, searchQuery, availabilityFilter, pageSize, localProducts, favourites]);

  // Trigger fetch when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
  }, [selectedServer, selectedPlatform, availabilityFilter, pageSize, fetchProducts]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const categoryDropdownValue = useMemo(() => {
    if (selectedPlatform === 'All') return 'All';
    if (['instagram', 'facebook', 'twitter', 'tiktok', 'threads', 'telegram', 'snapchat', 'reddit'].includes(selectedPlatform)) {
      return 'social-media';
    }
    if (selectedPlatform === 'cards') return 'gift-cards';
    if (selectedPlatform === 'gmail') return 'email';
    if (selectedPlatform === 'ai') return 'ai-tools';
    return selectedPlatform;
  }, [selectedPlatform]);

  const isPillActive = (pillId: string) => {
    if (pillId === selectedPlatform) return true;
    if (pillId === 'cards' && selectedPlatform === 'gift-cards') return true;
    if (pillId === 'gmail' && selectedPlatform === 'email') return true;
    if (pillId === 'ai' && selectedPlatform === 'ai-tools') return true;
    if (pillId === 'vpn' && selectedPlatform === 'vpn') return true;
    if (pillId === 'All' && selectedPlatform === 'All') return true;
    return false;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchProducts(newPage);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCatalog();
      await fetchProducts(currentPage);
      showToast('Marketplace catalog updated live from upstream suppliers.');
    } catch {
      showToast('Catalog refreshed.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getQty = (productId: string) => quantities[productId] || 1;
  const updateQty = (productId: string, delta: number, maxStock: number = 999) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(maxStock, current + delta));
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!user) {
      setIsAuthModalOpen(true);
      showToast('Please sign in or create an account to purchase products.');
      return;
    }
    const qty = getQty(product.id);
    addToCart(product, qty);
    setAddedAnimation(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedAnimation(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
    showToast(`Added ${qty} × "${product.title}" to cart`);
  };

  const serverTabs = [
    { id: 'All', label: 'All Sources & Tools' },
    { id: 'Favourites', label: `Favourites (${favourites.length})` },
    { id: 'Server 1', label: 'Server 1' },
    { id: 'Server 2', label: 'Server 2' },
    { id: 'Server 3', label: 'Server 3' },
    { id: 'Server 4', label: 'Server 4 (AI Tools)' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-28 md:pb-12">
      {/* Page Title & Real-time Upstream Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-oj-primary/10 text-oj-primary dark:bg-oj-primary/20 border border-oj-primary/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-oj-primary animate-pulse" />
              Instant Vault Delivery
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-oj-midnight dark:text-white">
            Digital Products & Accounts
          </h1>
          <p className="text-xs sm:text-sm text-oj-muted dark:text-oj-dark-muted mt-0.5">
            Verified social media profiles, software licenses, secure VPNs, and AI developer tools.
          </p>
        </div>

        {/* Live Ojalogs Counter & Sync Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt hover:bg-oj-primary hover:text-white border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-60"
            title="Sync catalog with live provider pools"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-oj-primary' : 'text-oj-muted'}`} />
            <span>Sync Catalog</span>
          </button>

          <span className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{pagination.inStock.toLocaleString()} IN STOCK</span>
          </span>

          <span className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white shadow-xs">
            PAGE {currentPage} OF {pagination.totalPages}
          </span>
        </div>
      </div>

      {/* Search & Top Filters Container */}
      <div className="space-y-3">
        {/* Main Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-oj-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, keyword, or service..."
            className="w-full text-xs sm:text-sm pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary shadow-soft"
          />
        </div>

        {/* Dropdowns Row: Categories, Availability, Items Per Page */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <select
            value={categoryDropdownValue}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary font-medium shadow-xs"
          >
            <option value="All">All Categories</option>
            {APPROVED_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value as any)}
            className="text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary font-medium shadow-xs"
          >
            <option value="All">All Availability</option>
            <option value="in_stock">In Stock Only</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary font-medium shadow-xs"
          >
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {/* Multi-Server Tabs (Source Clusters) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {serverTabs.map((tab) => {
          const isActive = selectedServer === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedServer(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-xs ${
                isActive
                  ? 'bg-oj-midnight text-white border-oj-midnight dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                  : 'bg-white dark:bg-oj-dark-surface border-oj-border dark:border-oj-dark-border text-oj-muted hover:text-oj-midnight dark:hover:text-white'
              }`}
            >
              {tab.id === 'Favourites' && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Platform Category Pills Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {PLATFORM_PILLS.map((pill) => {
          const isActive = isPillActive(pill.id);
          return (
            <button
              key={pill.id}
              onClick={() => setSelectedPlatform(pill.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border shadow-xs ${
                isActive
                  ? 'bg-oj-primary text-white border-oj-primary shadow-glow-primary dark:bg-oj-primary'
                  : 'bg-white dark:bg-oj-dark-surface border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white hover:border-oj-primary/50'
              }`}
            >
              {pill.icon && pill.icon()}
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* Discovery Section Header */}
      <div className="flex items-center justify-between text-xs text-oj-muted dark:text-oj-dark-muted pt-2 border-t border-oj-border/60 dark:border-oj-dark-border/60">
        <h2 className="font-heading font-extrabold text-sm sm:text-base text-oj-midnight dark:text-white">
          {selectedServer === 'All' ? 'Discover Products' : `${selectedServer} Catalog`}
        </h2>
        <span className="font-mono font-medium">
          {pagination.total.toLocaleString()} products found
        </span>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border p-4 h-96 animate-pulse flex flex-col justify-between"
            >
              <div className="w-full h-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="space-y-2 mt-4">
                <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="w-full h-9 bg-slate-200 dark:bg-slate-800 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      ) : catalogProducts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-oj-dark-surface rounded-2xl border border-oj-border dark:border-oj-dark-border shadow-soft">
          <Search className="w-10 h-10 text-oj-muted mx-auto mb-3" />
          <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white mb-1">
            No matching products found
          </h3>
          <p className="text-xs text-oj-muted max-w-sm mx-auto mb-4">
            Try adjusting your search terms, changing the server cluster, or selecting another platform.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedServer('All');
              setSelectedPlatform('All');
              setAvailabilityFilter('All');
            }}
            className="px-4 py-2 bg-oj-primary text-white text-xs font-bold rounded-btn shadow-glow-primary"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {catalogProducts.map((product) => {
            const isFav = favourites.includes(product.id);
            const qty = getQty(product.id);
            const isAdded = addedAnimation[product.id];
            const cleanTitle = product.title.replace(/^["']+|["']+$/g, '').trim();
            const resolved = resolveProductCategory(cleanTitle, product.category, product.summary || product.descriptionHtml);
            const displayCategory = resolved.category;

            return (
              <motion.div
                key={product.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border/80 hover:border-oj-primary/50 shadow-soft hover:shadow-elevated flex flex-col overflow-hidden group transition-all"
              >
                {/* Top Section: Sweet Ojalogs Branded Banner */}
                <div className="relative">
                  <BrandCoverBanner
                    product={product}
                    title={cleanTitle}
                    category={displayCategory}
                    className="h-44 sm:h-46"
                  />

                  {/* Top-Right Favorite Heart Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavourite(product.id);
                    }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-sm active:scale-90"
                    aria-label="Add to favourites"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                  </button>
                </div>

                {/* Card Body Container */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Product Clean Title */}
                    <Link
                      to={`/product/${product.slug}`}
                      className="font-heading font-bold text-xs sm:text-sm text-oj-midnight dark:text-white line-clamp-2 hover:text-oj-primary transition-colors min-h-[2.5rem] leading-snug"
                      title={cleanTitle}
                    >
                      {cleanTitle}
                    </Link>

                    {/* Tags Row: Category Tag, SERVER cluster, Stock Status, Instant Delivery */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[170px]" title={displayCategory}>
                        {displayCategory}
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-oj-primary/10 text-oj-primary dark:bg-oj-primary/20 border border-oj-primary/20 uppercase tracking-wide">
                        {product.serverCluster || 'Server 1'}
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{product.stockCount ? `${product.stockCount} in stock` : 'Available'}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-medium text-oj-muted bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border">
                        ⚡ Instant Key
                      </span>
                    </div>
                  </div>

                  {/* Price & Unit Label */}
                  <div className="pt-2 border-t border-oj-border/60 dark:border-oj-dark-border/60 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-heading font-black text-lg text-oj-midnight dark:text-white">
                        {formatPrice(product.priceNgn)}
                      </span>
                      <span className="text-[11px] text-oj-muted font-normal">
                        / unit
                      </span>
                    </div>
                  </div>

                  {/* Simple & Classic Action Flow */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-12 gap-2">
                      {/* Compact Stepper */}
                      <div className="col-span-5 flex items-center justify-between border border-oj-border dark:border-oj-dark-border rounded-xl bg-oj-surface-alt/70 dark:bg-oj-dark-surface-alt/70 px-2 py-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQty(product.id, -1, product.stockCount);
                          }}
                          className="w-6 h-6 rounded flex items-center justify-center text-oj-muted hover:text-oj-midnight dark:hover:text-white text-xs font-bold transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="text-xs font-mono font-bold text-oj-midnight dark:text-white">
                          {qty}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQty(product.id, 1, product.stockCount);
                          }}
                          className="w-6 h-6 rounded flex items-center justify-center text-oj-muted hover:text-oj-midnight dark:hover:text-white text-xs font-bold transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Add to Cart Button (Sweet Ojalogs Brand Gradient) */}
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, product)}
                        className={`col-span-7 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                          isAdded
                            ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                            : 'bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white shadow-glow-primary'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* View Details Link */}
                    <Link
                      to={`/product/${product.slug}`}
                      className="w-full py-2 rounded-xl bg-oj-surface-alt/60 dark:bg-oj-dark-surface-alt/50 hover:bg-oj-primary/10 hover:text-oj-primary border border-oj-border/80 dark:border-oj-dark-border/80 text-oj-muted hover:text-oj-primary dark:text-oj-dark-muted dark:hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Product Specs & Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls Footer */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-oj-border dark:border-oj-dark-border">
          <p className="text-xs text-oj-muted">
            Showing <strong className="text-oj-midnight dark:text-white">{((currentPage - 1) * pageSize) + 1}</strong> to{' '}
            <strong className="text-oj-midnight dark:text-white">
              {Math.min(currentPage * pageSize, pagination.total)}
            </strong>{' '}
            of <strong className="text-oj-midnight dark:text-white">{pagination.total.toLocaleString()}</strong> products
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-2 rounded-xl border border-oj-border dark:border-oj-dark-border bg-white dark:bg-oj-dark-surface text-xs font-bold text-oj-midnight dark:text-white hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Quick Page Jump Pills */}
            <div className="flex items-center gap-1">
              {[currentPage - 1, currentPage, currentPage + 1]
                .filter(p => p >= 1 && p <= pagination.totalPages)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                      currentPage === p
                        ? 'bg-oj-midnight text-white dark:bg-white dark:text-slate-900 shadow-sm'
                        : 'bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-oj-muted hover:text-oj-midnight dark:hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}

              {currentPage + 2 < pagination.totalPages && (
                <span className="text-xs text-oj-muted px-1">...</span>
              )}

              {currentPage + 1 < pagination.totalPages && (
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  className="w-8 h-8 rounded-xl text-xs font-bold bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-oj-muted hover:text-oj-midnight dark:hover:text-white transition-all"
                >
                  {pagination.totalPages}
                </button>
              )}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
              className="px-3 py-2 rounded-xl border border-oj-border dark:border-oj-dark-border bg-white dark:bg-oj-dark-surface text-xs font-bold text-oj-midnight dark:text-white hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
