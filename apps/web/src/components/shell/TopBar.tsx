import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Moon, Sun, ShoppingBag, Bell, Shield, ChevronDown, Check, User, LogOut, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SupportedCurrency, SUPPORTED_CURRENCIES } from '@ojalogs/shared';
import { Link, useLocation } from 'react-router-dom';

interface TopBarProps {
  onOpenCart: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenCart }) => {
  const { user, theme, toggleTheme, currency, setCurrency, role, setRole, cart } = useApp();
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const location = useLocation();

  const currencySymbols: Record<SupportedCurrency, { flag: string; symbol: string }> = {
    NGN: { flag: '🇳🇬', symbol: '₦' },
    USD: { flag: '🇺🇸', symbol: '$' },
    EUR: { flag: '🇪🇺', symbol: '€' },
    GBP: { flag: '🇬🇧', symbol: '£' },
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-oj-border dark:border-oj-dark-border px-4 py-2.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-oj-midnight via-oj-navy to-oj-primary flex items-center justify-center shadow-soft text-white font-heading font-extrabold text-lg tracking-wider border border-white/20 group-hover:scale-105 transition-transform duration-200">
            <span className="text-oj-cyan font-black">O</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-xl tracking-tight text-oj-midnight dark:text-white">
                Oja<span className="text-oj-primary">logs</span>
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-oj-primary/10 text-oj-primary dark:bg-oj-primary/20 rounded-md border border-oj-primary/20">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-oj-muted dark:text-oj-dark-muted hidden md:inline leading-none">
              Fintech Marketplace
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            to="/dashboard"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              location.pathname === '/dashboard'
                ? 'bg-oj-primary/10 text-oj-primary font-semibold dark:bg-oj-primary/20'
                : 'text-oj-muted hover:text-oj-midnight dark:text-oj-dark-muted dark:hover:text-white'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/shop"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              location.pathname === '/shop'
                ? 'bg-oj-primary/10 text-oj-primary font-semibold dark:bg-oj-primary/20'
                : 'text-oj-muted hover:text-oj-midnight dark:text-oj-dark-muted dark:hover:text-white'
            }`}
          >
            Storefront
          </Link>
          <Link
            to="/virtual-numbers"
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              location.pathname === '/virtual-numbers'
                ? 'bg-oj-primary/10 text-oj-primary font-semibold dark:bg-oj-primary/20'
                : 'text-oj-muted hover:text-oj-midnight dark:text-oj-dark-muted dark:hover:text-white'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-oj-cyan" />
            <span>Virtual Numbers</span>
          </Link>
          <Link
            to="/wallet"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              location.pathname === '/wallet'
                ? 'bg-oj-primary/10 text-oj-primary font-semibold dark:bg-oj-primary/20'
                : 'text-oj-muted hover:text-oj-midnight dark:text-oj-dark-muted dark:hover:text-white'
            }`}
          >
            Wallet
          </Link>
          <Link
            to="/orders"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              location.pathname === '/orders'
                ? 'bg-oj-primary/10 text-oj-primary font-semibold dark:bg-oj-primary/20'
                : 'text-oj-muted hover:text-oj-midnight dark:text-oj-dark-muted dark:hover:text-white'
            }`}
          >
            Orders
          </Link>
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Switcher Pill (Customer vs Admin preview) */}
          <button
            onClick={() => setRole(role === 'customer' ? 'admin' : 'customer')}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              role === 'admin'
                ? 'bg-oj-midnight text-oj-cyan border-oj-cyan/40 shadow-glow-cyan'
                : 'bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted dark:text-oj-dark-muted border-oj-border dark:border-oj-dark-border hover:border-oj-primary/40'
            }`}
            title="Toggle between Customer Storefront and Super Admin View"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{role === 'admin' ? 'Admin Mode' : 'Customer'}</span>
          </button>

          {/* Currency Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-xs font-semibold text-oj-midnight dark:text-white hover:border-oj-primary/50 transition-colors"
            >
              <span>{currencySymbols[currency].flag}</span>
              <span>{currency} ({currencySymbols[currency].symbol})</span>
              <ChevronDown className="w-3 h-3 text-oj-muted" />
            </button>

            <AnimatePresence>
              {showCurrencyDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-36 bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border rounded-xl shadow-elevated py-1.5 z-50 overflow-hidden"
                >
                  {SUPPORTED_CURRENCIES.map((cur) => (
                    <button
                      key={cur}
                      onClick={() => {
                        setCurrency(cur);
                        setShowCurrencyDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt text-oj-midnight dark:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <span>{currencySymbols[cur].flag}</span>
                        <span>{cur}</span>
                      </div>
                      {currency === cur && <Check className="w-3.5 h-3.5 text-oj-primary" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-btn flex items-center justify-center bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-muted dark:text-oj-dark-muted hover:text-oj-primary dark:hover:text-oj-cyan transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Cart Trigger Button */}
          <button
            onClick={onOpenCart}
            className="relative w-9 h-9 rounded-btn flex items-center justify-center bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-muted dark:text-oj-dark-muted hover:text-oj-primary transition-colors"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cart.totalQuantity > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-oj-primary text-white text-[11px] font-bold flex items-center justify-center shadow-glow-primary animate-pulse-subtle">
                {cart.totalQuantity}
              </span>
            )}
          </button>

          {/* User Profile Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="w-9 h-9 rounded-btn bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300 hover:scale-105 transition-transform"
            >
              {user.initials}
            </button>

            <AnimatePresence>
              {showUserDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border rounded-xl shadow-elevated p-2 z-50"
                >
                  <div className="px-3 py-2 border-b border-oj-border dark:border-oj-dark-border">
                    <p className="text-sm font-bold text-oj-midnight dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-oj-muted dark:text-oj-dark-muted truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      ✓ Verified Customer
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserDropdown(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-oj-midnight dark:text-white rounded-lg hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt"
                    >
                      <User className="w-4 h-4 text-oj-muted" />
                      <span>Profile & Settings</span>
                    </Link>
                    <Link
                      to="/admin"
                      onClick={() => setShowUserDropdown(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-oj-midnight dark:text-white rounded-lg hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt"
                    >
                      <Shield className="w-4 h-4 text-oj-primary" />
                      <span>Admin Console</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

