import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Trash2, ShieldCheck, ArrowRight, Wallet, CreditCard, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, wallet, checkoutWithWallet, checkoutWithGateway, formatPrice, currency, user, setIsAuthModalOpen, showToast } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleWalletCheckout = async () => {
    if (!user) {
      onClose();
      setIsAuthModalOpen(true);
      showToast('Please sign in or enter your email to complete checkout.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      await checkoutWithWallet();
      onClose();
      navigate('/orders');
    } catch (err: any) {
      setErrorMessage(err.message || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGatewayCheckout = async () => {
    if (!user) {
      onClose();
      setIsAuthModalOpen(true);
      showToast('Please sign in or enter your email to complete checkout.');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      await checkoutWithGateway();
      onClose();
      navigate('/orders');
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initiation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-oj-midnight/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-oj-dark-surface shadow-2xl flex flex-col border-l border-oj-border dark:border-oj-dark-border"
          >
            {/* Header */}
            <div className="p-4 border-b border-oj-border dark:border-oj-dark-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-lg text-oj-midnight dark:text-white">
                  Your Cart
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-oj-primary/10 text-oj-primary">
                  {cart.totalQuantity} items
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-oj-muted hover:text-oj-midnight dark:hover:text-white hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content / Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-oj-muted dark:text-oj-dark-muted">
                  <div className="w-16 h-16 rounded-2xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt flex items-center justify-center mb-3">
                    <Sparkles className="w-8 h-8 text-oj-muted" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white mb-1">
                    Your cart is empty
                  </h3>
                  <p className="text-xs max-w-xs mb-4">
                    Explore our verified digital licenses, VPN subscriptions, and virtual phone numbers.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/shop');
                    }}
                    className="px-4 py-2 bg-oj-primary text-white rounded-btn text-xs font-bold hover:bg-oj-primary-hover shadow-glow-primary transition-all"
                  >
                    Browse Marketplace
                  </button>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-xl border border-oj-border dark:border-oj-dark-border bg-oj-surface-alt/50 dark:bg-oj-dark-surface-alt/50 flex gap-3 items-center"
                  >
                    <img
                      src={item.product.coverImage}
                      alt={item.product.title}
                      className="w-16 h-16 rounded-lg object-cover border border-oj-border dark:border-oj-dark-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-oj-midnight dark:text-white truncate">
                        {item.product.title}
                      </p>
                      <p className="text-[11px] text-oj-muted dark:text-oj-dark-muted mb-1.5">
                        {item.product.serverCluster} · {item.product.deliveryFormat}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-oj-primary dark:text-oj-cyan">
                          {formatPrice(item.product.priceNgn)}
                        </span>
                        
                        {/* Stepper */}
                        <div className="flex items-center border border-oj-border dark:border-oj-dark-border rounded-lg bg-white dark:bg-oj-dark-surface">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs font-bold text-oj-muted hover:text-oj-midnight dark:hover:text-white"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-mono font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs font-bold text-oj-muted hover:text-oj-midnight dark:hover:text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-oj-muted hover:text-red-500 p-1"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mx-4 mb-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-600 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Footer Summary & Checkout Options */}
            {cart.items.length > 0 && (
              <div className="p-4 border-t border-oj-border dark:border-oj-dark-border bg-oj-surface-alt/30 dark:bg-oj-dark-surface-alt/30 space-y-3">
                <div className="flex items-center justify-between text-xs text-oj-muted dark:text-oj-dark-muted">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-oj-midnight dark:text-white">
                    {formatPrice(cart.totalAmountNgn)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-oj-midnight dark:text-white">
                  <span>Total Amount</span>
                  <span className="font-mono text-base text-oj-primary dark:text-oj-cyan">
                    {formatPrice(cart.totalAmountNgn)}
                  </span>
                </div>

                {/* Wallet Balance Status */}
                <div className="p-2.5 rounded-xl bg-oj-surface dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-oj-primary" />
                    <span className="text-oj-muted dark:text-oj-dark-muted">{currency} Wallet Balance:</span>
                  </div>
                  <span className="font-mono font-bold text-oj-midnight dark:text-white">
                    {formatPrice(wallet.balanceNgn)}
                  </span>
                </div>

                {/* Checkout Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    disabled={isProcessing}
                    onClick={handleWalletCheckout}
                    className="w-full py-3 px-4 rounded-btn bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white text-xs font-bold shadow-glow-primary flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Pay with NGN Wallet (Instant Delivery)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    disabled={isProcessing}
                    onClick={handleGatewayCheckout}
                    className="w-full py-2.5 px-4 rounded-btn border border-oj-border dark:border-oj-dark-border bg-white dark:bg-oj-dark-surface hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt text-oj-midnight dark:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Direct Payment via BACH Gateway</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-oj-muted text-center pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Encrypted 256-bit checkout · Immediate code reveal in your vault</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

