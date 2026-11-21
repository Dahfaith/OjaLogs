import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Cpu,
  Users,
  Wallet,
  CreditCard,
  BarChart3,
  ShieldCheck,
  Settings,
  X,
  ExternalLink,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

export type AdminTabId =
  | 'overview'
  | 'orders'
  | 'products'
  | 'apis'
  | 'customers'
  | 'wallets'
  | 'payments'
  | 'reports'
  | 'audit'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  adminEmail?: string;
  adminRole?: string;
}

const NAV_ITEMS: { id: AdminTabId; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'apis', label: 'APIs & Suppliers', icon: Cpu },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'wallets', label: 'Wallets & Ledger', icon: Wallet },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'audit', label: 'Audit Log', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  adminEmail = 'admin@ojalogs.com.ng',
  adminRole = 'Administrator'
}) => {
  const content = (
    <div className="flex flex-col h-full bg-[#0a2323] text-slate-200 border-r border-[#133737] select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#133737]">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/40 group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-base tracking-tight text-white">
                Ojalogs
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Admin
              </span>
            </div>
            <p className="text-[10px] text-teal-400/80 -mt-0.5">Enterprise Management</p>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-teal-400/70">
          Main Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-[#144242] text-white font-semibold shadow-sm border-l-2 border-teal-400'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-300' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-teal-400/70">
          Shortcuts
        </div>
        <Link
          to="/"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ExternalLink className="w-4 h-4 shrink-0 text-slate-500" />
          <span>View Storefront</span>
        </Link>
      </nav>

      {/* Admin User Footer */}
      <div className="p-3.5 border-t border-[#133737] bg-[#081d1d]">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-black/20">
          <div className="w-8 h-8 rounded-full bg-teal-600/30 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-500/30">
            {adminEmail.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{adminEmail}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-teal-300/80 font-mono capitalize truncate">
                {adminRole}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 fixed inset-y-0 left-0 z-30">
        {content}
      </aside>

      {/* Mobile drawer with backdrop */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
