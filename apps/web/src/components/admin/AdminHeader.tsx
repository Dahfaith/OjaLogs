import React from 'react';
import { Menu, RotateCw, Bell, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminTabId } from './AdminSidebar';

interface AdminHeaderProps {
  activeTab: AdminTabId;
  onOpenMobileSidebar: () => void;
  onSyncAll: () => void;
  isSyncing: boolean;
  lastSyncedTime: string;
  unreadAlertsCount: number;
  onToggleAlerts: () => void;
}

const TAB_TITLES: Record<AdminTabId, { title: string; subtitle: string }> = {
  overview: {
    title: 'Dashboard Overview',
    subtitle: 'Operational health, revenue metrics, and real-time transaction activity'
  },
  orders: {
    title: 'Customer Orders',
    subtitle: 'Search, filter, inspect vault delivery secrets, and track fulfillment status'
  },
  products: {
    title: 'Product Catalog & Inventory',
    subtitle: 'Manage digital product accounts, licenses, stock availability, and batch ingestion'
  },
  apis: {
    title: 'APIs & Suppliers',
    subtitle: 'Configure supplier integrations, independent profit markups, and live diagnostics'
  },
  customers: {
    title: 'Customer Management',
    subtitle: 'Registered accounts, roles, access statuses, and live wallet balances'
  },
  wallets: {
    title: 'Wallets & Ledger',
    subtitle: 'Immutable platform transaction ledger, liabilities, and manual balance adjustments'
  },
  payments: {
    title: 'Payment Gateways & Banking',
    subtitle: 'Bachs Pay checkout sessions, NUBAN reserved accounts, and deposit reconciliations'
  },
  reports: {
    title: 'Financial Reports',
    subtitle: 'Volume breakdown by supplier, revenue channels, and profit margin analysis'
  },
  audit: {
    title: 'Administrative Audit Log',
    subtitle: 'Cryptographic audit trail of all staff adjustments, markup edits, and system events'
  },
  settings: {
    title: 'Platform Settings',
    subtitle: 'Admin alert notifications, Brevo email dispatches, and security policies'
  }
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onSyncAll,
  isSyncing,
  lastSyncedTime,
  unreadAlertsCount,
  onToggleAlerts
}) => {
  const current = TAB_TITLES[activeTab] || { title: 'Admin', subtitle: 'Platform Governance' };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile hamburger & Section Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate font-heading">
              {current.title}
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Auto-Sync Status */}
        <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Synced {lastSyncedTime}</span>
        </span>

        {/* Sync Button */}
        <button
          onClick={onSyncAll}
          disabled={isSyncing}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          title="Force immediate synchronization with backend and upstream APIs"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={onToggleAlerts}
          className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
          title="View Real-Time System Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
              {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
            </span>
          )}
        </button>

        {/* Storefront Link */}
        <Link
          to="/"
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 text-xs font-semibold transition-colors"
        >
          <span>Storefront</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </header>
  );
};
