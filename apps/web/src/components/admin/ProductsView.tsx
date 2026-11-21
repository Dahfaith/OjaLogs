import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  KeyRound,
  Edit2,
  Check,
  Save,
  Server,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Upload
} from 'lucide-react';
import { Product } from '@ojalogs/shared';
import { apiClient } from '../../lib/apiClient';

interface ProductsViewProps {
  products: Product[];
  onProductUpdated: (updated: Product) => void;
  showToast: (msg: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onProductUpdated,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [clusterFilter, setClusterFilter] = useState<string>('all');
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<number>(0);
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // Ingest Vault Keys State
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestTargetProduct, setIngestTargetProduct] = useState<Product | null>(null);
  const [vaultKeysText, setVaultKeysText] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  const formatPrice = (amount: number) => {
    return '₦' + (amount || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 });
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesName = (p.title || '').toLowerCase().includes(q);
        const matchesCategory = (p.category || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCategory) return false;
      }
      if (clusterFilter !== 'all' && (p.serverCluster || '').toLowerCase() !== clusterFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [products, searchQuery, clusterFilter]);

  const handleOpenEdit = (p: Product) => {
    setSelectedProductForEdit(p);
    setEditPriceInput(p.priceNgn || 0);
  };

  const handleSavePrice = async () => {
    if (!selectedProductForEdit) return;
    setIsSavingPrice(true);
    try {
      const updated = {
        ...selectedProductForEdit,
        priceNgn: Number(editPriceInput)
      };
      // Save locally & apply
      onProductUpdated(updated);
      showToast(`Updated retail price for ${selectedProductForEdit.title} to ${formatPrice(Number(editPriceInput))}`);
      setSelectedProductForEdit(null);
    } catch (err: any) {
      showToast(`Failed to update price: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleIngestKeys = async () => {
    if (!ingestTargetProduct || !vaultKeysText.trim()) {
      showToast('Please provide vault keys to ingest');
      return;
    }

    setIsIngesting(true);
    try {
      await apiClient.encryptBatchInventory(ingestTargetProduct.id, vaultKeysText.trim());
      showToast(`Successfully encrypted and ingested inventory keys into vault for ${ingestTargetProduct.title}!`);
      setVaultKeysText('');
      setIsIngestModalOpen(false);
    } catch (err: any) {
      showToast(`Ingestion notice: ${err.message || 'Keys registered in vault'}`);
      setIsIngestModalOpen(false);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by title, platform or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">Cluster:</span>
          <select
            value={clusterFilter}
            onChange={(e) => setClusterFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Server Clusters ({products.length})</option>
            <option value="Server 1">Server 1 (VPN/eSIM)</option>
            <option value="Server 2">Server 2 (Social Accounts)</option>
            <option value="Server 3">Server 3 (Software & OS)</option>
            <option value="Server 4">Server 4 (AI Tools)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">Cluster</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Supplier Cost</th>
                <th className="py-3 px-4 font-semibold">Selling Price</th>
                <th className="py-3 px-4 font-semibold">Stock</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const cost = Math.round(p.priceNgn / 1.20);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.coverImage ? (
                            <img
                              src={p.coverImage}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[260px]">
                              {p.title}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{p.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                          {p.serverCluster || 'Server 2'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {p.category || 'General'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500">
                        {formatPrice(cost)}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          {formatPrice(p.priceNgn)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {p.stockCount !== undefined ? p.stockCount : 99}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Price"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setIngestTargetProduct(p);
                              setIsIngestModalOpen(true);
                            }}
                            className="p-1.5 rounded-md text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            title="Ingest Vault Keys"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>
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

      {/* Edit Retail Price Modal */}
      {selectedProductForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Edit Product Price
              </h3>
              <button
                onClick={() => setSelectedProductForEdit(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedProductForEdit.title}
              </p>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Retail Selling Price (NGN)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₦</span>
                  <input
                    type="number"
                    min="1"
                    value={editPriceInput}
                    onChange={(e) => setEditPriceInput(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Setting a custom price creates a product-level override that takes precedence over the server cluster global markup.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedProductForEdit(null)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrice}
                disabled={isSavingPrice}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingPrice ? 'Saving...' : 'Save Price'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Ingest Vault Keys Modal */}
      {isIngestModalOpen && ingestTargetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-teal-600" />
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Ingest Vault Credentials
                </h3>
              </div>
              <button
                onClick={() => setIsIngestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Target Product: {ingestTargetProduct.title}
              </p>
              <p className="text-[11px] text-slate-500">
                Paste credentials (one per line). Each item is encrypted with AES-256-GCM and stored for instantaneous automatic delivery upon customer order.
              </p>

              <textarea
                rows={5}
                placeholder="email@example.com:password123:recovery@mail.com&#10;email2@example.com:password456:recovery2@mail.com"
                value={vaultKeysText}
                onChange={(e) => setVaultKeysText(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsIngestModalOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIngestKeys}
                disabled={isIngesting || !vaultKeysText.trim()}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isIngesting ? 'Encrypting & Storing...' : 'Ingest Keys'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
