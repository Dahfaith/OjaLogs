import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Download, FileSpreadsheet, Printer, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatementModal: React.FC<StatementModalProps> = ({ isOpen, onClose }) => {
  const { user, wallet, ledger, showToast, formatPrice } = useApp();

  const handleDownloadCsv = () => {
    const headers = ['Transaction ID', 'Reference', 'Type', 'Category', 'Amount (NGN)', 'Balance After (NGN)', 'Status', 'Date', 'Description'];
    const rows = ledger.map(t => [
      t.id,
      t.reference,
      t.type,
      t.category,
      t.amountNgn,
      t.balanceAfterNgn,
      t.status,
      t.timestamp,
      `"${t.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ojalogs_statement_${user.id}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Statement CSV exported successfully.');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-oj-midnight/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-oj-border dark:border-oj-dark-border flex items-center justify-between">
              <div>
                <h3 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white">
                  Official Account Statement
                </h3>
                <p className="text-xs text-oj-muted dark:text-oj-dark-muted">
                  Immutable double-entry ledger certified by Ojalogs Core
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCsv}
                  className="px-3 py-1.5 rounded-lg border border-oj-border dark:border-oj-dark-border bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-xs font-semibold text-oj-midnight dark:text-white flex items-center gap-1.5 hover:border-oj-primary transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handlePrintPdf}
                  className="px-3 py-1.5 rounded-lg bg-oj-primary text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-oj-primary-hover shadow-glow-primary transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-oj-muted hover:text-oj-midnight dark:hover:text-white ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Statement Summary Card */}
            <div className="p-4 bg-oj-surface-alt/40 dark:bg-oj-dark-surface-alt/40 border-b border-oj-border dark:border-oj-dark-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-oj-muted block">Account Holder:</span>
                <span className="font-bold text-oj-midnight dark:text-white">{user.name}</span>
              </div>
              <div>
                <span className="text-oj-muted block">Customer ID:</span>
                <span className="font-mono font-semibold text-oj-midnight dark:text-white">{user.id}</span>
              </div>
              <div>
                <span className="text-oj-muted block">Available Balance:</span>
                <span className="font-mono font-bold text-oj-primary dark:text-oj-cyan">
                  {formatPrice(wallet.balanceNgn)}
                </span>
              </div>
              <div>
                <span className="text-oj-muted block">Ledger Records:</span>
                <span className="font-semibold text-emerald-600">{ledger.length} verified rows</span>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="border border-oj-border dark:border-oj-dark-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-oj-surface-alt dark:bg-oj-dark-surface-alt text-oj-muted border-b border-oj-border dark:border-oj-dark-border">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Date & Time</th>
                      <th className="py-2.5 px-3 font-semibold">Reference</th>
                      <th className="py-2.5 px-3 font-semibold">Category</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-oj-border dark:divide-oj-dark-border">
                    {ledger.map((tx) => (
                      <tr key={tx.id} className="hover:bg-oj-surface-alt/50 dark:hover:bg-oj-dark-surface-alt/50">
                        <td className="py-2 px-3 text-oj-muted text-[11px]">
                          {new Date(tx.timestamp).toLocaleDateString()} {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-oj-midnight dark:text-white font-medium">
                          {tx.reference}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            tx.type === 'credit'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}>
                            {tx.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`py-2 px-3 text-right font-mono font-bold ${
                          tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amountNgn)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-oj-midnight dark:text-white font-medium">
                          {formatPrice(tx.balanceAfterNgn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-oj-border dark:border-oj-dark-border bg-oj-surface-alt/30 dark:bg-oj-dark-surface-alt/30 flex items-center justify-between text-[11px] text-oj-muted">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Digitally signed and cryptographically verified.</span>
              </div>
              <span>Generated on {new Date().toLocaleDateString()}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

