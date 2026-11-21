import React, { useMemo } from 'react';
import {
  Download
} from 'lucide-react';
import { Order, Product } from '@ojalogs/shared';

interface ReportsViewProps {
  orders: Order[];
  products: Product[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ orders, products }) => {
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalNgn || 0), 0);

  // Group revenue by supplier cluster
  const clusterRevenue = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {
      'Server 1': { count: 0, revenue: 0 },
      'Server 2': { count: 0, revenue: 0 },
      'Server 3': { count: 0, revenue: 0 },
      'Server 4': { count: 0, revenue: 0 },
    };

    for (const o of completedOrders) {
      const cluster = o.items?.[0]?.product?.serverCluster || 'Server 2';
      if (!map[cluster]) {
        map[cluster] = { count: 0, revenue: 0 };
      }
      map[cluster].count += 1;
      map[cluster].revenue += (o.totalNgn || 0);
    }
    return map;
  }, [completedOrders]);

  const formatPrice = (amount: number) => {
    return '₦' + (amount || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 });
  };

  const handleExportCSV = () => {
    const headers = ['Order Reference', 'Customer', 'Product', 'Cluster', 'Amount NGN', 'Status', 'Date'];
    const rows = orders.map(o => [
      o.reference,
      o.customerEmail || 'Registered User',
      o.items?.[0]?.product?.title || 'Digital Product',
      o.items?.[0]?.product?.serverCluster || 'Server 2',
      o.totalNgn,
      o.status,
      o.createdAt ? new Date(o.createdAt).toISOString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ojalogs_orders_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
            Financial & Volume Reports
          </h3>
          <p className="text-xs text-slate-500">
            Export comprehensive sales audits, profit margin analyses, and supplier breakdowns
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Orders CSV</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Completed Order Volume</span>
          <p className="mt-2 text-2xl font-bold font-heading text-slate-900 dark:text-white">
            {formatPrice(totalRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            {completedOrders.length} fulfilled customer deliveries
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Average Order Value (AOV)</span>
          <p className="mt-2 text-2xl font-bold font-heading text-slate-900 dark:text-white">
            {completedOrders.length > 0 ? formatPrice(Math.round(totalRevenue / completedOrders.length)) : '₦0'}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Per fulfilled basket checkout
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Estimated Gross Margin</span>
          <p className="mt-2 text-2xl font-bold font-heading text-teal-600 dark:text-teal-400">
            ~24.5%
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Blended across all 4 servers & SMM engine
          </p>
        </div>
      </div>

      {/* Supplier Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading">
            Sales & Volume Breakdown by Supplier API
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 font-semibold">Supplier Cluster</th>
                <th className="py-2.5 px-4 font-semibold">Service Type</th>
                <th className="py-2.5 px-4 font-semibold">Orders Completed</th>
                <th className="py-2.5 px-4 font-semibold">Total Revenue</th>
                <th className="py-2.5 px-4 text-right font-semibold">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { id: 'Server 2', label: 'Server 2 (LogsPoll)', type: 'Social Media Accounts & Cloud' },
                { id: 'Server 1', label: 'Server 1 (VPN/eSIM)', type: 'VPNs, Proxies & Data Plans' },
                { id: 'Server 3', label: 'Server 3 (Keys/OS)', type: 'Software & Operating Systems' },
                { id: 'Server 4', label: 'Server 4 (AI Tools)', type: 'AI Subscriptions & Dev' },
              ].map(item => {
                const stat = clusterRevenue[item.id] || { count: 0, revenue: 0 };
                const sharePercent = totalRevenue > 0 ? Math.round((stat.revenue / totalRevenue) * 100) : 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white font-mono">
                      {item.label}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {item.type}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {stat.count}
                    </td>
                    <td className="py-3 px-4 font-bold font-mono text-slate-900 dark:text-white">
                      {formatPrice(stat.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-teal-600">
                      {sharePercent}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
