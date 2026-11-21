import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  KeyRound,
  Copy,
  Check,
  Send
} from 'lucide-react';
import { Order, OrderItem } from '@ojalogs/shared';
import { apiClient } from '../../lib/apiClient';

interface OrdersViewProps {
  orders: Order[];
  onOrderUpdated: (updatedOrder: Order) => void;
  showToast: (msg: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onOrderUpdated,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'processing' | 'failed' | 'refunded'>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Manual Dispatch state
  const [dispatchSecretInputs, setDispatchSecretInputs] = useState<Record<string, string>>({});
  const [dispatchInstructionsInputs, setDispatchInstructionsInputs] = useState<Record<string, string>>({});
  const [isDispatchingMap, setIsDispatchingMap] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const formatPrice = (amount: number) => {
    return '₦' + (amount || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDispatchSecret = async (order: Order, item: OrderItem) => {
    const key = `${order.id}_${item.id}`;
    const secretVal = dispatchSecretInputs[key]?.trim();
    if (!secretVal) {
      showToast('Please enter credentials to dispatch');
      return;
    }
    const instructionVal = dispatchInstructionsInputs[key]?.trim();
    setIsDispatchingMap(prev => ({ ...prev, [key]: true }));
    try {
      const updated = await apiClient.dispatchAdminOrderSecret(order.id, item.id, secretVal, instructionVal);
      onOrderUpdated(updated);
      setSelectedOrder(updated);
      showToast(`Credentials securely dispatched to customer vault for Order ${order.reference}!`);
    } catch (err: any) {
      showToast(`Dispatch failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDispatchingMap(prev => ({ ...prev, [key]: false }));
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesRef = (o.reference || '').toLowerCase().includes(query);
        const matchesEmail = (o.customerEmail || '').toLowerCase().includes(query);
        const matchesProduct = o.items?.some(it => (it.product?.title || '').toLowerCase().includes(query));
        if (!matchesRef && !matchesEmail && !matchesProduct) return false;
      }

      // Status
      if (statusFilter !== 'all') {
        if (o.status !== statusFilter) return false;
      }

      // Supplier / Cluster
      if (supplierFilter !== 'all') {
        const matchesCluster = o.items?.some(it => (it.product?.serverCluster || '').toLowerCase() === supplierFilter.toLowerCase());
        if (!matchesCluster) return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, supplierFilter]);

  return (
    <div className="space-y-5">
      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer Email, or Product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Statuses ({orders.length})</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Supplier Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">Supplier:</span>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Suppliers</option>
              <option value="Server 1">Server 1 (VPN/eSIM)</option>
              <option value="Server 2">Server 2 (Social Accounts)</option>
              <option value="Server 3">Server 3 (Software Keys)</option>
              <option value="Server 4">Server 4 (AI Tools)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Order ID</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Product / Service</th>
                <th className="py-3 px-4 font-semibold">Supplier</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Payment Status</th>
                <th className="py-3 px-4 font-semibold">Fulfillment Status</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No customer orders found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isCompleted = order.status === 'completed';
                  const isPending = order.status === 'pending';
                  const isProcessing = order.status === 'processing';

                  const item = order.items?.[0];
                  const supplierName = item?.product?.serverCluster || 'Server 2';
                  const productTitle = item?.product?.title || 'Digital Order';

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Order ID */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                        {order.reference}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">
                        {order.customerEmail || 'Registered User'}
                      </td>

                      {/* Product */}
                      <td className="py-3 px-4 max-w-[220px] truncate font-medium text-slate-800 dark:text-slate-200">
                        {productTitle}
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                          {supplierName}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {formatPrice(order.totalNgn)}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          order.status !== 'failed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${order.status !== 'failed' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {order.paymentMethod === 'bach_direct' ? 'Paid (Bachs)' : 'Paid (Wallet)'}
                        </span>
                      </td>

                      {/* Fulfillment Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isCompleted
                            ? 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300'
                            : isPending
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                            : isProcessing
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}>
                          {isCompleted ? 'Delivered' : isPending ? 'Pending' : isProcessing ? 'Processing' : order.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'Today'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 transition-colors"
                          >
                            {isCompleted ? 'View Delivery' : 'View Details'}
                          </button>
                          {/* CRITICAL SAFETY INVARIANT: ZERO REFUND BUTTON ON COMPLETED ORDERS */}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Delivery Vault Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Order Details & Digital Vault
                  </h3>
                  <p className="font-mono text-xs text-slate-500">{selectedOrder.reference}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Meta Information Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Customer</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {selectedOrder.customerEmail || 'Registered User'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Amount</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatPrice(selectedOrder.totalNgn)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Payment</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 capitalize">
                  {selectedOrder.paymentMethod === 'bach_direct' ? 'Bachs Gateway' : 'Wallet Debit'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Status</span>
                <p className="font-semibold text-teal-600 dark:text-teal-400 mt-0.5 capitalize">
                  {selectedOrder.status}
                </p>
              </div>
            </div>

            {/* Order Items & Credentials Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Purchased Digital Assets ({selectedOrder.items?.length || 0})
              </h4>

              {selectedOrder.items?.map((item, idx) => {
                const isPendingFulfillment = !item.deliveredSecrets || item.deliveredSecrets.length === 0 || item.deliveredSecrets.some((s: any) => s.value === 'PENDING_DISPATCH' || s.type === 'pending_fulfillment');
                const key = `${selectedOrder.id}_${item.id}`;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{item.product?.title || 'Product'}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Unit Cost: {formatPrice(item.unitPriceNgn)} • Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-800">
                        {item.product?.serverCluster || 'Server 2'}
                      </span>
                    </div>

                    {/* If item is pending fulfillment: Manual Dispatch Interface */}
                    {isPendingFulfillment ? (
                      <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Fulfillment — Manual Dispatch Required
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                          Enter digital keys or account credentials below. They will be encrypted via AES-256-GCM and delivered to the customer's vault.
                        </p>
                        <textarea
                          rows={2}
                          placeholder="Paste credential payload (e.g. email:pass:recovery or license key)..."
                          value={dispatchSecretInputs[key] || ''}
                          onChange={(e) => setDispatchSecretInputs(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full p-2.5 text-xs font-mono rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                        <input
                          type="text"
                          placeholder="Optional usage instructions for customer..."
                          value={dispatchInstructionsInputs[key] || ''}
                          onChange={(e) => setDispatchInstructionsInputs(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full p-2 text-xs rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                        <button
                          onClick={() => handleDispatchSecret(selectedOrder, item)}
                          disabled={isDispatchingMap[key]}
                          className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isDispatchingMap[key] ? 'Encrypting & Dispatching...' : 'Dispatch Credentials to Vault'}</span>
                        </button>
                      </div>
                    ) : (
                      /* Delivered Credentials List */
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Delivered Vault Credentials
                        </span>
                        {item.deliveredSecrets?.map((secret: any, sIdx: number) => {
                          const secretId = `${item.id}_secret_${sIdx}`;
                          return (
                            <div
                              key={sIdx}
                              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  {secret.label || secret.type || 'Credential Key'}
                                </span>
                                <p className="font-mono text-slate-900 dark:text-slate-100 font-semibold truncate select-all">
                                  {secret.value}
                                </p>
                              </div>
                              <button
                                onClick={() => handleCopy(secret.value, secretId)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                title="Copy credential"
                              >
                                {copiedKey === secretId ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Created on {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('en-GB') : 'Unknown'}
              </span>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
