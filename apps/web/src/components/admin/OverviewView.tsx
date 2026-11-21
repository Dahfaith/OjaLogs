import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Server,
  ArrowUpRight,
  ChevronRight,
  Activity
} from 'lucide-react';
import { Order, Product, AdminManagedUser, ServerClusterConfig, TelephonyProviderConfig } from '@ojalogs/shared';
import { AdminTabId } from './AdminSidebar';

interface OverviewViewProps {
  orders: Order[];
  products: Product[];
  users: AdminManagedUser[];
  servers: ServerClusterConfig[];
  telephonyConfigs: TelephonyProviderConfig[];
  smmStatus: { isConnected: boolean; balanceNgn: number };
  onSelectTab: (tab: AdminTabId) => void;
  onViewOrderDetails: (order: Order) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  orders,
  products,
  users,
  servers,
  telephonyConfigs,
  smmStatus,
  onSelectTab,
  onViewOrderDetails
}) => {
  // Real Database Operational Statistics
  const completedOrders = orders.filter(o => o.status === 'completed');
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
  const failedOrders = orders.filter(o => o.status === 'failed' || o.status === 'refunded');

  const totalRevenueNgn = completedOrders.reduce((sum, o) => sum + (o.totalNgn || 0), 0);
  const activeCustomersCount = users.filter(u => u.status !== 'suspended').length;
  const availableProductsCount = products.length;

  // Upstream Health count
  const serverUpCount = servers.filter(s => s.status === 'connected').length;
  const telephonyUpCount = telephonyConfigs.filter(t => t.status === 'connected').length;
  const totalApisCount = servers.length + telephonyConfigs.length + 1; // + Linkocial SMM
  const operationalApisCount = serverUpCount + telephonyUpCount + (smmStatus.isConnected ? 1 : 0);
  const apiHealthPercent = Math.round((operationalApisCount / (totalApisCount || 1)) * 100);

  const formatPrice = (amount: number) => {
    return '₦' + (amount || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 });
  };

  const recentOrders = orders.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-teal-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              {formatPrice(totalRevenueNgn)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            From {completedOrders.length} completed transactions
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-teal-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              {orders.length}
            </span>
            <span className="text-[11px] text-slate-500">all channels</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="text-emerald-600 font-medium">{completedOrders.length} completed</span>
            <span>•</span>
            <span className="text-amber-600 font-medium">{pendingOrders.length} pending</span>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-teal-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Customers</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              {activeCustomersCount}
            </span>
            <span className="text-[11px] text-slate-500">registered</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {users.length} total user accounts
          </p>
        </div>

        {/* API Health */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-teal-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">API Connection Health</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              {apiHealthPercent}%
            </span>
            <span className="text-[11px] text-slate-500">uptime</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {operationalApisCount} of {totalApisCount} upstream services active
          </p>
        </div>
      </div>

      {/* Second Row: Performance & API Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Breakdown / Performance Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                Operational Order Status
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Breakdown of current fulfillment queues and customer requests
              </p>
            </div>
            <button
              onClick={() => onSelectTab('orders')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View Orders <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4">
            <div className="p-3.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-medium text-emerald-900 dark:text-emerald-300">Completed</span>
              </div>
              <p className="mt-2 text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-400">
                {completedOrders.length}
              </p>
              <p className="text-[11px] text-emerald-700/80 mt-0.5">Delivered to customer vault</p>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-medium text-amber-900 dark:text-amber-300">Pending</span>
              </div>
              <p className="mt-2 text-2xl font-bold font-heading text-amber-700 dark:text-amber-400">
                {pendingOrders.length}
              </p>
              <p className="text-[11px] text-amber-700/80 mt-0.5">Awaiting upstream fulfillment</p>
            </div>

            <div className="p-3.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-xs font-medium text-rose-900 dark:text-rose-300">Failed / Refunded</span>
              </div>
              <p className="mt-2 text-2xl font-bold font-heading text-rose-700 dark:text-rose-400">
                {failedOrders.length}
              </p>
              <p className="text-[11px] text-rose-700/80 mt-0.5">Intercepted & safely recorded</p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Available Catalog Products: <strong className="text-slate-800 dark:text-slate-200">{availableProductsCount}</strong></span>
            <span>Customer Balances: <strong className="text-slate-800 dark:text-slate-200">{users.length > 0 ? formatPrice(users.reduce((s, u) => s + (u.balanceNgn || 0), 0)) : '₦0'}</strong></span>
          </div>
        </div>

        {/* API Health Widget */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                Upstream API Status
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live connectivity status
              </p>
            </div>
            <button
              onClick={() => onSelectTab('apis')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {servers.map((srv) => (
              <div key={srv.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{srv.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{srv.cluster} • {srv.markupPercent ?? 20}% markup</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                  srv.status === 'connected'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${srv.status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {srv.status === 'connected' ? 'Connected' : 'Offline'}
                </span>
              </div>
            ))}

            {/* SMM Engine */}
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Linkocial SMM Engine</p>
                <p className="text-[10px] text-slate-400 font-mono">Balance: {formatPrice(smmStatus.balanceNgn)}</p>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                smmStatus.isConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${smmStatus.isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {smmStatus.isConnected ? 'Connected' : 'Syncing'}
              </span>
            </div>

            {/* Telephony Hub */}
            {telephonyConfigs.slice(0, 1).map((tel) => (
              <div key={tel.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{tel.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Telephony • {tel.markupPercent}% markup</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                  tel.status === 'connected'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${tel.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {tel.status === 'connected' ? 'Connected' : 'Standby'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
              Recent Customer Orders
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest transactions across all service categories
            </p>
          </div>
          <button
            onClick={() => onSelectTab('orders')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            View All Orders ({orders.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Product / Service</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No orders recorded yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const isCompleted = order.status === 'completed';
                  const isPending = order.status === 'pending' || order.status === 'processing';
                  const item = order.items?.[0];
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {order.reference}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {order.customerEmail || 'Registered User'}
                      </td>
                      <td className="py-2.5 px-3 max-w-[200px] truncate font-medium text-slate-800 dark:text-slate-200">
                        {item?.product?.title || 'Digital Asset'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {item?.product?.serverCluster || 'Server 2'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {formatPrice(order.totalNgn)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : isPending
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'Today'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onViewOrderDetails(order)}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
