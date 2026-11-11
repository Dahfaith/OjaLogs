import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  RotateCw,
  Search,
  Filter,
  Heart,
  ShoppingCart,
  Zap,
  CheckCircle2,
  XCircle,
  Sparkles,
  Shield,
  KeyRound,
  Server,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { APPROVED_CATEGORIES } from '@ojalogs/shared';

export const ShopPage: React.FC = () => {
  const { products, favourites, toggleFavourite, addToCart, formatPrice, user, setIsAuthModalOpen, showToast, refreshCatalog } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServer, setSelectedServer] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return searchParams.get('category') || 'All';
  });
  const [availabilityFilter, setAvailabilityFilter] = useState<'All' | 'in_stock' | 'out_of_stock'>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync category param if user navigates via footer / deep link
  React.useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Counters
  const totalCount = products.length;
  const inStockCount = products.filter(p => p.inStock).length;
  const outOfStockCount = totalCount - inStockCount;

  const serverTabs = [
    { id: 'All', label: 'All Sources & Tools', count: totalCount },
    { id: 'Favourites', label: 'Favourites', count: favourites.length },
    { id: 'Server 1', label: 'Server 1 (Enterprise & eSIM)', count: products.filter(p => p.serverCluster === 'Server 1').length },
    { id: 'Server 2', label: 'Server 2 (Social Accounts & Cloud)', count: products.filter(p => p.serverCluster === 'Server 2').length },
    { id: 'Server 3', label: 'Server 3 (Dev & OS)', count: products.filter(p => p.serverCluster === 'Server 3').length },
    { id: 'Server 4', label: 'Server 4 (AI Tools)', count: products.filter(p => p.serverCluster === 'Server 4').length },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCatalog();
      showToast('Marketplace catalog updated live from upstream suppliers.');
    } catch {
      showToast('Catalog refreshed.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Server / Source filter
      if (selectedServer === 'Favourites') {
        if (!favourites.includes(product.id)) return false;
      } else if (selectedServer !== 'All' && product.serverCluster !== selectedServer) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && product.categoryId !== selectedCategory) {
        return false;
      }

      // Availability filter
      if (availabilityFilter === 'in_stock' && !product.inStock) return false;
      if (availabilityFilter === 'out_of_stock' && product.inStock) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = product.title.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        const matchesSummary = product.summary.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory && !matchesSummary) return false;
      }

      return true;
    });
  }, [products, selectedServer, selectedCategory, availabilityFilter, searchQuery, favourites]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-28 md:pb-12">
      {/* Page Title & Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-oj-primary/10 text-oj-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-oj-midnight dark:text-white">
              Products Store
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-oj-muted dark:text-oj-dark-muted">
            Browse our multi-server catalog of verified digital vouchers, software licenses, and cloud tools.
          </p>
        </div>

        {/* Refresh & Live Metric Counters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Products</span>
          </button>

          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white">
            TOTAL {totalCount}
          </span>

          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>IN STOCK {inStockCount}</span>
          </span>

          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>OUT OF STOCK {outOfStockCount}</span>
          </span>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="p-3 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-oj-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, keyword, or service..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
          >
            <option value="All">All Categories</option>
            {APPROVED_CATEGORIES.filter(c => c.division === 'A').map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value as any)}
            className="text-xs px-3 py-2.5 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
          >
            <option value="All">All Availability</option>
            <option value="in_stock">In Stock Only</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Multi-Server Tabs (Source Clusters) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {serverTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedServer(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedServer === tab.id
                ? 'bg-oj-midnight text-white border-oj-midnight shadow-md dark:bg-oj-primary dark:border-oj-primary'
                : 'bg-white dark:bg-oj-dark-surface border-oj-border dark:border-oj-dark-border text-oj-muted hover:text-oj-midnight dark:hover:text-white'
            }`}
          >
            {tab.id === 'Favourites' && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />}
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedServer === tab.id ? 'bg-white/20 text-white' : 'bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Category Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategory === 'All'
              ? 'bg-oj-primary text-white shadow-glow-primary'
              : 'bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted hover:text-oj-midnight dark:hover:text-white'
          }`}
        >
          All Categories ({products.length})
        </button>

        {APPROVED_CATEGORIES.filter(c => c.division === 'A').map((cat) => {
          const count = products.filter(p => p.categoryId === cat.id).length;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-oj-primary text-white border-oj-primary shadow-glow-primary'
                  : 'bg-white dark:bg-oj-dark-surface border-oj-border dark:border-oj-dark-border text-oj-muted hover:text-oj-midnight dark:hover:text-white'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-[10px] font-mono opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between text-xs text-oj-muted dark:text-oj-dark-muted">
        <p className="font-semibold text-oj-midnight dark:text-white">
          {selectedServer === 'All' ? 'Discover Products' : `${selectedServer} Catalog`}
        </p>
        <span>{filteredProducts.length} products found</span>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-oj-dark-surface rounded-2xl border border-oj-border dark:border-oj-dark-border">
          <Search className="w-10 h-10 text-oj-muted mx-auto mb-3" />
          <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white mb-1">
            No matching products found
          </h3>
          <p className="text-xs text-oj-muted max-w-sm mx-auto mb-4">
            Try adjusting your search terms, changing the server cluster, or resetting your category filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedServer('All');
              setSelectedCategory('All');
              setAvailabilityFilter('All');
            }}
            className="px-4 py-2 bg-oj-primary text-white text-xs font-bold rounded-btn shadow-glow-primary"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isFav = favourites.includes(product.id);
            return (
              <motion.div
                key={product.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="rounded-card bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft hover:shadow-elevated flex flex-col overflow-hidden group"
              >
                {/* Product Cover Banner */}
                <div className="relative h-40 bg-slate-900 overflow-hidden">
                  <img
                    src={product.coverImage}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Server Cluster Pill */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-oj-midnight/90 text-oj-cyan border border-oj-cyan/30 backdrop-blur-sm">
                    {product.serverCluster}
                  </span>

                  {/* Favourite Heart */}
                  <button
                    onClick={() => toggleFavourite(product.id)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                    aria-label="Add to favourites"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                  </button>

                  {/* Stock Pill */}
                  <div className="absolute bottom-2.5 left-2.5">
                    {product.inStock ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/90 text-white backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>{product.stockCount} in stock</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600/90 text-white backdrop-blur-sm">
                        <span>Out of stock</span>
                      </span>
                    )}
                  </div>

                  {/* Category Pill */}
                  <span className="absolute bottom-2.5 right-2.5 text-[10px] text-slate-300 font-medium bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                    {product.category}
                  </span>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <Link
                      to={`/product/${product.slug}`}
                      className="font-heading font-bold text-sm text-oj-midnight dark:text-white line-clamp-2 hover:text-oj-primary transition-colors"
                    >
                      {product.title}
                    </Link>
                    <p className="text-xs text-oj-muted dark:text-oj-dark-muted line-clamp-2 mt-1">
                      {product.summary}
                    </p>
                  </div>

                  {/* Trust Specs Mini Row */}
                  <div className="pt-2 border-t border-oj-border dark:border-oj-dark-border flex items-center justify-between text-[11px] text-oj-muted">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="font-semibold text-oj-midnight dark:text-white">{product.rating}</span>
                      <span>(Verified)</span>
                    </div>
                    <span className="text-[10px] font-medium text-emerald-600">✓ Resale Auth</span>
                  </div>

                  {/* Price & CTA Button */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-oj-muted block">Price</span>
                      <span className="font-heading font-extrabold text-base text-oj-midnight dark:text-white">
                        {formatPrice(product.priceNgn)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            setIsAuthModalOpen(true);
                            showToast('Please sign in or create an account to purchase products.');
                            return;
                          }
                          addToCart(product, 1);
                        }}
                        className="p-2 rounded-btn bg-oj-surface-alt dark:bg-oj-dark-surface-alt hover:bg-oj-border dark:hover:bg-oj-dark-border text-oj-midnight dark:text-white transition-colors"
                        title={user ? "Add to Cart" : "Sign in to purchase"}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            setIsAuthModalOpen(true);
                            showToast('Please sign in or create an account to purchase products.');
                            return;
                          }
                          navigate(`/product/${product.slug}`);
                        }}
                        className="py-2 px-3 rounded-btn bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white text-xs font-bold shadow-glow-primary flex items-center gap-1 transition-all"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Buy</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

