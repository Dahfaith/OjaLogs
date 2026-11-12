import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Moon, Sun, ShoppingBag, Bell, Shield, ChevronDown, Check, User, LogOut, PhoneCall, Mail, Zap, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SupportedCurrency, SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from '@ojalogs/shared';
import { Link, useLocation } from 'react-router-dom';

interface TopBarProps {
  onOpenCart: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenCart }) => {
  const { user, theme, toggleTheme, currency, setCurrency, role, setRole, cart, setIsAuthModalOpen, logout } = useApp();
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const currencySymbols = CURRENCY_SYMBOLS;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-oj-border dark:border-oj-dark-border px-4 py-2.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link to={isAdminRoute ? '/admin' : '/'} className="flex items-center gap-2.5 group">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-soft text-white font-heading font-extrabold text-lg tracking-wider border border-white/20 group-hover:scale-105 transition-transform duration-200 ${
              isAdminRoute
                ? 'bg-gradient-to-tr from-slate-900 via-oj-midnight to-emerald-600 shadow-emerald-500/10'
                : 'bg-gradient-to-tr from-oj-midnight via-oj-navy to-oj-primary'
            }`}
          >
            {isAdminRoute ? (
              <Shield className="w-5 h-5 text-emerald-400" />
            ) : (
              <span className="text-oj-cyan font-black">O</span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-xl tracking-tight text-oj-midnight dark:text-white">
                Oja<span className={isAdminRoute ? 'text-emerald-500 dark:text-emerald-400' : 'text-oj-primary'}>logs</span>
              </span>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-md border ${
                  isAdminRoute
                    ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30'
                    : 'hidden sm:inline-flex bg-oj-primary/10 text-oj-primary dark:bg-oj-primary/20 border-oj-primary/20'
                }`}
              >
                {isAdminRoute ? 'CONSOLE' : 'PRO'}
              </span>
            </div>
            <span className="text-[10px] text-oj-muted dark:text-oj-dark-muted hidden md:inline leading-none">
              {isAdminRoute ? 'Super Admin Command System' : 'Fintech Marketplace'}
            </span>
          </div>
        </Link>

        {/* Navigation Section: Executive Pill for Admin, Consumer Nav for Storefront */}
        {isAdminRoute ? (
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 font-medium shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">Enterprise Operations Active</span>
            <span className="text-emerald-400 dark:text-emerald-600">•</span>
            <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">PostgreSQL RLS Enforced</span>
          </div>
        ) : (
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {user && (
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
            )}
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
              to="/social-boost"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/social-boost'
                  ? 'bg-oj-primary/10 text-oj-primary font-semibold dark:bg-oj-primary/20'
                  : 'text-oj-muted hover:text-oj-midnight dark:text-oj-dark-muted dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Social Boost</span>
              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                SMM
              </span>
            </Link>
            {user && (
              <>
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
              </>
            )}
          </nav>
        )}

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Exit to Storefront OR Storefront Link to Admin Console */}
          {isAdminRoute ? (
            <Link
              to="/shop"
              className="px-3 py-1.5 rounded-lg bg-oj-surface-alt dark:bg-oj-dark-surface-alt hover:bg-oj-primary hover:text-white border border-oj-border dark:border-oj-dark-border text-xs font-semibold text-oj-midnight dark:text-white transition-all flex items-center gap-1.5 shadow-xs group"
              title="Open Public Customer Storefront"
            >
              <span>Storefront</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-oj-muted group-hover:text-white transition-colors" />
            </Link>
          ) : (
            (user?.role === 'administrator' ||
              (user as any)?.role === 'super_administrator' ||
              role === 'admin' ||
              (user?.email &&
                ['visioreach@gmail.com', 'ojalogs@gmail.com', 'dahfaith@gmail.com', 'iamdahfaith@gmail.com', 'admin@ojalogs.com'].includes(
                  user.email.toLowerCase().trim()
                ))) && (
              <Link
                to="/admin"
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 bg-oj-midnight text-oj-cyan border-oj-cyan/40 shadow-glow-cyan hover:bg-oj-navy"
                title="Go to Super Admin Command Console"
              >
                <Shield className="w-3.5 h-3.5 text-oj-cyan" />
                <span className="hidden sm:inline">Admin Console</span>
              </Link>
            )
          )}

          {/* Currency Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-xs font-semibold text-oj-midnight dark:text-white hover:border-oj-primary/50 transition-colors"
            >
              <span>{currencySymbols[currency].flag}</span>
              <span className="hidden sm:inline">{currency} ({currencySymbols[currency].symbol})</span>
              <span className="sm:hidden font-mono font-bold text-xs">{currencySymbols[currency].symbol}</span>
              <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-oj-muted" />
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
            className="hidden sm:flex w-9 h-9 rounded-btn items-center justify-center bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-muted dark:text-oj-dark-muted hover:text-oj-primary dark:hover:text-oj-cyan transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Cart Trigger Button (Only for Customer Storefront) */}
          {!isAdminRoute && (
            <button
              onClick={onOpenCart}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-btn flex items-center justify-center bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-muted dark:text-oj-dark-muted hover:text-oj-primary transition-colors shrink-0"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cart.totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-oj-primary text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center shadow-glow-primary animate-pulse-subtle">
                  {cart.totalQuantity}
                </span>
              )}
            </button>
          )}

          {/* User Profile Avatar & Menu OR Sign In CTA */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-btn border flex items-center justify-center text-xs font-bold hover:scale-105 transition-transform ${
                  isAdminRoute
                    ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                    : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300'
                }`}
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
                      {isAdminRoute ? (
                        <span className="inline-block mt-1 text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          ⚡ Super Administrator
                        </span>
                      ) : (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          ✓ Verified Account
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      {isAdminRoute ? (
                        <>
                          <Link
                            to="/shop"
                            onClick={() => setShowUserDropdown(false)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-oj-midnight dark:text-white rounded-lg hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt"
                          >
                            <ShoppingBag className="w-4 h-4 text-oj-muted" />
                            <span>Open Public Storefront</span>
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setShowUserDropdown(false)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-oj-midnight dark:text-white rounded-lg hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt"
                          >
                            <User className="w-4 h-4 text-oj-muted" />
                            <span>Admin Profile</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/profile"
                            onClick={() => setShowUserDropdown(false)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-oj-midnight dark:text-white rounded-lg hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt"
                          >
                            <User className="w-4 h-4 text-oj-muted" />
                            <span>Profile & Settings</span>
                          </Link>
                          <Link
                            to="/wallet"
                            onClick={() => setShowUserDropdown(false)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-oj-midnight dark:text-white rounded-lg hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt"
                          >
                            <ShoppingBag className="w-4 h-4 text-oj-muted" />
                            <span>My Wallet & Funds</span>
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setShowUserDropdown(false)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-oj-midnight dark:text-white rounded-lg hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt"
                          >
                            <Shield className="w-4 h-4 text-oj-muted" />
                            <span>My Orders & Vault Keys</span>
                          </Link>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 sm:px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white text-xs font-bold shadow-glow-primary transition-all flex items-center gap-1 shrink-0"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

