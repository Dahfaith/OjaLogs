import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Moon,
  EyeOff,
  Bell,
  ShieldCheck,
  Smartphone,
  KeyRound,
  FileText,
  LogOut,
  CheckCircle2,
  Lock,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ProfilePage: React.FC = () => {
  const { user, setUser, theme, toggleTheme, hideBalance, toggleHideBalance, showToast, setIsSupportOpen, setIsAuthModalOpen } = useApp();
  const [transactionAlerts, setTransactionAlerts] = useState(user?.preferences?.transactionAlerts ?? true);
  const [fullName, setFullName] = useState(user?.name || '');
  const [isSaved, setIsSaved] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-oj-primary/10 text-oj-primary flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-extrabold text-2xl text-oj-midnight dark:text-white">
          Sign in to your account
        </h2>
        <p className="text-xs text-oj-muted max-w-xs mx-auto">
          Access your personal wallet, view purchased license vouchers, and manage your security preferences.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full py-3 rounded-btn bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white text-xs font-bold shadow-glow-primary transition-all"
        >
          Sign In with Email / OTP
        </button>
      </div>
    );
  }

  const handleToggleAlerts = () => {
    setTransactionAlerts(!transactionAlerts);
    setUser(prev => prev ? ({
      ...prev,
      preferences: { ...prev.preferences, transactionAlerts: !transactionAlerts }
    }) : null);
    showToast(`Transaction alerts ${!transactionAlerts ? 'enabled' : 'disabled'}`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUser(prev => prev ? ({
      ...prev,
      name: fullName,
      initials: fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }) : null);
    setIsSaved(true);
    showToast('Profile information updated.');
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold tracking-wider text-oj-muted dark:text-oj-dark-muted">
          YOUR ACCOUNT
        </p>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-oj-midnight dark:text-white mt-0.5">
          Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-oj-muted dark:text-oj-dark-muted mt-0.5">
          Make Ojalogs work your way.
        </p>
      </div>

      {/* User Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center font-heading font-extrabold text-lg text-amber-700 dark:text-amber-300">
          {user.initials}
        </div>
        <div>
          <h2 className="font-heading font-extrabold text-lg text-oj-midnight dark:text-white">
            {user.name}
          </h2>
          <p className="text-xs text-oj-muted dark:text-oj-dark-muted">{user.email}</p>
          <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Personal account · Verified Customer</span>
          </span>
        </div>
      </div>

      {/* Quick Settings Toggles */}
      <div className="rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft divide-y divide-oj-border dark:divide-oj-dark-border overflow-hidden">
        {/* Dark appearance */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt flex items-center justify-center text-oj-muted dark:text-oj-dark-muted">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-oj-midnight dark:text-white">Dark appearance</p>
              <p className="text-[11px] text-oj-muted">Choose a comfortable theme</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              theme === 'dark' ? 'bg-oj-primary' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <motion.div
              layout
              className={`w-5 h-5 rounded-full bg-white shadow-sm ${
                theme === 'dark' ? 'ml-auto' : ''
              }`}
            />
          </button>
        </div>

        {/* Hide wallet balance */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt flex items-center justify-center text-oj-muted dark:text-oj-dark-muted">
              <EyeOff className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-oj-midnight dark:text-white">Hide wallet balance</p>
              <p className="text-[11px] text-oj-muted">Keep your balance private on screen</p>
            </div>
          </div>
          <button
            onClick={toggleHideBalance}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              hideBalance ? 'bg-oj-primary' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <motion.div
              layout
              className={`w-5 h-5 rounded-full bg-white shadow-sm ${
                hideBalance ? 'ml-auto' : ''
              }`}
            />
          </button>
        </div>

        {/* Transaction alerts */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt flex items-center justify-center text-oj-muted dark:text-oj-dark-muted">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-oj-midnight dark:text-white">Transaction alerts</p>
              <p className="text-[11px] text-oj-muted">Get notified when payments are confirmed</p>
            </div>
          </div>
          <button
            onClick={handleToggleAlerts}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              transactionAlerts ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <motion.div
              layout
              className={`w-5 h-5 rounded-full bg-white shadow-sm ${
                transactionAlerts ? 'ml-auto' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Personal Information Form */}
      <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-4">
        <h3 className="font-heading font-bold text-sm text-oj-midnight dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-orange-500" />
          <span>Personal Information</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-oj-muted mb-1">FULL NAME</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-oj-muted mb-1">EMAIL ADDRESS</label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full text-xs p-2.5 rounded-input bg-oj-surface-alt/50 dark:bg-oj-dark-surface-alt/50 border border-oj-border dark:border-oj-dark-border text-oj-muted cursor-not-allowed"
            />
            <span className="text-[10px] text-emerald-600 mt-1 block">✓ Verified via Supabase Auth</span>
          </div>

          <button
            type="submit"
            className="py-2 px-4 rounded-btn bg-oj-primary hover:bg-oj-primary-hover text-white text-xs font-bold shadow-glow-primary transition-all"
          >
            Save Changes
          </button>
        </form>
      </div>

      {/* Acceptable Use & Legal Links */}
      <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-3 text-xs">
        <h3 className="font-heading font-bold text-sm text-oj-midnight dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Compliance & Trust</span>
        </h3>
        <p className="text-oj-muted leading-relaxed">
          Acceptable Use Agreement confirmed on <span className="font-mono text-oj-midnight dark:text-white">{new Date(user.acceptableUseAcceptedAt).toLocaleDateString()}</span>.
        </p>

        <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] font-semibold text-oj-primary">
          <button onClick={() => showToast('Terms of Service: Standard marketplace terms.')} className="text-left hover:underline">
            • Terms of Service
          </button>
          <button onClick={() => showToast('Privacy Policy: Zero data selling. AES-256 storage.')} className="text-left hover:underline">
            • Privacy Policy
          </button>
          <button onClick={() => showToast('Acceptable Use: No third-party accounts, bots or spam.')} className="text-left hover:underline">
            • Acceptable Use Policy
          </button>
          <button onClick={() => setIsSupportOpen(true)} className="text-left text-red-600 hover:underline">
            • Report an Abuse Case
          </button>
        </div>
      </div>
    </div>
  );
};

