import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { resolveProductCover } from './ShopPage';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  Zap,
  ShoppingCart,
  Heart,
  CheckCircle2,
  FileText,
  Sliders,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, favourites, toggleFavourite, addToCart, checkoutWithWallet, wallet, formatPrice, user, setIsAuthModalOpen, showToast } = useApp();

  const product = products.find(p => p.slug === slug) || products[0];
  const isFav = favourites.includes(product.id);

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'specifications'>('overview');
  const [isBuying, setIsBuying] = useState(false);

  const totalPrice = product.priceNgn * quantity;
  const relatedProducts = products.filter(p => p.serverCluster === product.serverCluster && p.id !== product.id).slice(0, 3);

  const handleBuyNow = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      showToast('Please sign in or register with your email to make a purchase.');
      return;
    }
    addToCart(product, quantity);
    navigate('/orders');
  };

  const handleAddToCartClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      showToast('Please sign in or register with your email to make a purchase.');
      return;
    }
    addToCart(product, quantity);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24 md:pb-12">
      {/* Back Link & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-oj-muted dark:text-oj-dark-muted">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 hover:text-oj-midnight dark:hover:text-white font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <span>/</span>
        <Link to="/shop" className="hover:text-oj-midnight dark:hover:text-white">Store</Link>
        <span>/</span>
        <span className="text-oj-midnight dark:text-white truncate font-medium">{product.title}</span>
      </div>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Product Hero Banner */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-oj-border dark:border-oj-dark-border aspect-video bg-slate-900 shadow-elevated">
            <img
              src={resolveProductCover(product)}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-oj-midnight/90 text-oj-cyan border border-oj-cyan/30 backdrop-blur-md">
              {product.serverCluster}
            </span>

            <button
              onClick={() => toggleFavourite(product.id)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md flex items-center justify-center text-white transition-colors"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
            </button>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
              <span className="font-semibold">{product.category}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/90 text-[10px] font-bold">
                ● {product.stockCount} Available
              </span>
            </div>
          </div>

          {/* Delivery Format Highlights Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-oj-border dark:border-oj-dark-border">
              <span className="text-oj-muted">DELIVERY FORMAT</span>
              <span className="font-bold text-oj-midnight dark:text-white">{product.deliveryFormat}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-oj-border dark:border-oj-dark-border">
              <span className="text-oj-muted">VALIDITY / DURATION</span>
              <span className="font-bold text-oj-midnight dark:text-white">{product.validityDuration}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-oj-border dark:border-oj-dark-border">
              <span className="text-oj-muted">SERVER CLUSTER</span>
              <span className="font-bold text-oj-primary dark:text-oj-cyan">{product.serverCluster}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-oj-muted">REGION</span>
              <span className="font-bold text-oj-midnight dark:text-white">{product.region}</span>
            </div>
          </div>
        </div>

        {/* Right: Pricing, Live Quantity & Action CTAs */}
        <div className="space-y-4">
          {/* Trust Row */}
          <div className="flex items-center gap-2 text-xs text-oj-muted dark:text-oj-dark-muted">
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span>5.0 (Verified)</span>
            </div>
            <span>•</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Resale</span>
            </span>
            <span>•</span>
            <span>Duration: {product.validityDuration}</span>
          </div>

          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-oj-midnight dark:text-white">
            {product.title}
          </h1>

          <p className="text-xs sm:text-sm text-oj-muted dark:text-oj-dark-muted leading-relaxed">
            {product.summary}
          </p>

          {/* Pricing Box */}
          <div className="p-4 rounded-2xl bg-oj-surface-alt/60 dark:bg-oj-dark-surface-alt/60 border border-oj-border dark:border-oj-dark-border space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-oj-muted block">Unit Price</span>
                <span className="font-heading font-extrabold text-2xl text-oj-midnight dark:text-white">
                  {formatPrice(product.priceNgn)}
                </span>
                <span className="text-xs text-oj-muted ml-1">/ unit</span>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                ● {product.stockCount} available now
              </span>
            </div>

            {/* Quantity Selector Stepper */}
            <div className="p-3 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-oj-midnight dark:text-white">Select Quantity</p>
                <p className="font-mono text-xs font-bold text-oj-primary dark:text-oj-cyan">
                  Total: {formatPrice(totalPrice)}
                </p>
              </div>

              <div className="flex items-center border border-oj-border dark:border-oj-dark-border rounded-lg bg-oj-surface-alt dark:bg-oj-dark-surface-alt">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-sm font-bold text-oj-muted hover:text-oj-midnight dark:hover:text-white"
                >
                  -
                </button>
                <span className="px-3 text-sm font-mono font-bold text-oj-midnight dark:text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                  className="px-3 py-1.5 text-sm font-bold text-oj-muted hover:text-oj-midnight dark:hover:text-white"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 rounded-btn bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Buy Now ({formatPrice(totalPrice)})</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleAddToCartClick}
                  className="flex-1 py-2.5 rounded-btn border border-oj-border dark:border-oj-dark-border bg-white dark:bg-oj-dark-surface hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt text-xs font-bold text-oj-midnight dark:text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4 text-oj-primary" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={() => toggleFavourite(product.id)}
                  className="w-11 h-10 rounded-btn border border-oj-border dark:border-oj-dark-border bg-white dark:bg-oj-dark-surface hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt flex items-center justify-center transition-colors"
                >
                  <Heart className={`w-4 h-4 ${isFav ? 'text-rose-500 fill-rose-500' : 'text-oj-muted'}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-oj-muted pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Instant automated dispatch to your account dashboard & email upon payment.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Overview & Description vs Specifications */}
      <div className="rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft overflow-hidden">
        <div className="flex border-b border-oj-border dark:border-oj-dark-border bg-oj-surface-alt/40 dark:bg-oj-dark-surface-alt/40">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-5 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-oj-primary text-oj-primary bg-white dark:bg-oj-dark-surface'
                : 'border-transparent text-oj-muted hover:text-oj-midnight dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Overview & Description</span>
          </button>

          <button
            onClick={() => setActiveTab('specifications')}
            className={`py-3 px-5 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'specifications'
                ? 'border-oj-primary text-oj-primary bg-white dark:bg-oj-dark-surface'
                : 'border-transparent text-oj-muted hover:text-oj-midnight dark:hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Specifications</span>
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'overview' ? (
            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-oj-midnight dark:text-slate-200 leading-relaxed space-y-3">
              {(product.descriptionHtml || product.summary || '')
                .replace(/<p>/gi, '')
                .replace(/<\/p>/gi, '\n\n')
                .replace(/<div>/gi, '')
                .replace(/<\/div>/gi, '\n')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/LogsPoll/gi, 'Ojalogs')
                .replace(/logspoll\.com/gi, 'ojalogs.com.ng')
                .split('\n\n')
                .map(p => p.trim())
                .filter(Boolean)
                .map((para, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {para}
                  </p>
                ))}
              <div className="p-3 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-xs">
                <span className="font-bold block mb-1">Key Feature Highlights:</span>
                <ul className="list-disc list-inside space-y-1 text-oj-muted dark:text-oj-dark-muted">
                  <li>Genuine authorized redemption key or voucher token</li>
                  <li>Bound to your personal provider account upon activation</li>
                  <li>Zero credential exchange: no password or session cookies handled</li>
                  <li>Automated immediate delivery into your encrypted customer vault</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="border border-oj-border dark:border-oj-dark-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-oj-border dark:divide-oj-dark-border">
                  <tr className="hover:bg-oj-surface-alt/40">
                    <td className="py-2.5 px-4 font-semibold text-oj-muted w-1/3">Product Title</td>
                    <td className="py-2.5 px-4 font-bold text-oj-midnight dark:text-white">{product.specifications.title}</td>
                  </tr>
                  <tr className="hover:bg-oj-surface-alt/40">
                    <td className="py-2.5 px-4 font-semibold text-oj-muted">Category</td>
                    <td className="py-2.5 px-4 text-oj-midnight dark:text-white">{product.specifications.category}</td>
                  </tr>
                  <tr className="hover:bg-oj-surface-alt/40">
                    <td className="py-2.5 px-4 font-semibold text-oj-muted">Server Origin</td>
                    <td className="py-2.5 px-4 font-mono font-medium text-oj-primary dark:text-oj-cyan">{product.specifications.serverOrigin}</td>
                  </tr>
                  <tr className="hover:bg-oj-surface-alt/40">
                    <td className="py-2.5 px-4 font-semibold text-oj-muted">Delivery Type</td>
                    <td className="py-2.5 px-4 text-oj-midnight dark:text-white">{product.specifications.deliveryType.replace('_', ' ')}</td>
                  </tr>
                  <tr className="hover:bg-oj-surface-alt/40">
                    <td className="py-2.5 px-4 font-semibold text-oj-muted">Duration</td>
                    <td className="py-2.5 px-4 text-oj-midnight dark:text-white">{product.specifications.validityDuration}</td>
                  </tr>
                  <tr className="hover:bg-oj-surface-alt/40">
                    <td className="py-2.5 px-4 font-semibold text-oj-muted">Fulfillment Speed</td>
                    <td className="py-2.5 px-4 font-semibold text-emerald-600">{product.specifications.fulfillmentSpeed}</td>
                  </tr>
                  <tr className="hover:bg-oj-surface-alt/40">
                    <td className="py-2.5 px-4 font-semibold text-oj-muted">Verification Status</td>
                    <td className="py-2.5 px-4 text-oj-midnight dark:text-white">{product.specifications.verificationStatus}</td>
                  </tr>
                  <tr className="hover:bg-oj-surface-alt/40">
                    <td className="py-2.5 px-4 font-semibold text-oj-muted">Stock Units</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-oj-midnight dark:text-white">{product.specifications.stockUnits} available</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white">
              Related Products in {product.serverCluster}
            </h3>
            <Link to="/shop" className="text-xs font-semibold text-oj-primary hover:underline">
              View all in category
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {relatedProducts.map(rel => (
              <div
                key={rel.id}
                onClick={() => navigate(`/product/${rel.slug}`)}
                className="p-3 rounded-xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft hover:border-oj-primary cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <img
                    src={rel.coverImage}
                    alt={rel.title}
                    className="w-full h-24 rounded-lg object-cover mb-2"
                  />
                  <p className="text-xs font-bold text-oj-midnight dark:text-white line-clamp-1">{rel.title}</p>
                  <p className="text-[11px] text-oj-muted line-clamp-1">{rel.summary}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-oj-border dark:border-oj-dark-border flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-oj-primary">{formatPrice(rel.priceNgn)}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">● In Stock</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

