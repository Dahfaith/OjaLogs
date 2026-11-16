import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, ExternalLink, ShieldCheck, Check } from 'lucide-react';

export const OFFICIAL_WHATSAPP_NUMBER = '07069659752';
export const OFFICIAL_WHATSAPP_DISPLAY = '+234 706 965 9752';
export const OFFICIAL_WHATSAPP_INTL = '2347069659752';

interface WhatsAppSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderReference?: string;
  defaultComplaint?: string;
}

export const WhatsAppSupportModal: React.FC<WhatsAppSupportModalProps> = ({
  isOpen,
  onClose,
  orderReference,
  defaultComplaint = ''
}) => {
  const [editableOrderRef, setEditableOrderRef] = useState(orderReference || '');
  const [complaint, setComplaint] = useState(defaultComplaint);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (orderReference) {
      setEditableOrderRef(orderReference);
    }
  }, [orderReference]);

  if (!isOpen) return null;

  const orderRefText = editableOrderRef.trim() || 'General Inquiry';
  const complaintBody = complaint.trim() || '[Your complaint will appear here]';

  const previewMessage = `I'm here from Ojalogs.\n\nOrder Reference: ${orderRefText}\n\nMy complaint is: ${complaintBody}`;
  const encodedMessage = encodeURIComponent(
    `I'm here from Ojalogs.\n\nOrder Reference: ${orderRefText}\n\nMy complaint is: ${complaint.trim() || 'Assistance with my order / inquiry'}`
  );
  const whatsappUrl = `https://wa.me/${OFFICIAL_WHATSAPP_INTL}?text=${encodedMessage}`;

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(`I'm here from Ojalogs.\n\nOrder Reference: ${orderRefText}\n\nMy complaint is: ${complaint.trim()}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-oj-midnight/70 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-2xl overflow-hidden z-10 my-6"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-oj-border dark:border-oj-dark-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white">
                  Contact Support on WhatsApp
                </h3>
                <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Official Desk: {OFFICIAL_WHATSAPP_DISPLAY}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-oj-muted hover:text-oj-midnight dark:hover:text-white hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Linked Order Reference */}
            {orderReference ? (
              <div className="p-3 sm:p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs font-bold text-oj-muted dark:text-slate-400">
                  Linked Order Reference:
                </span>
                <span className="font-mono text-xs sm:text-sm font-extrabold text-oj-primary dark:text-oj-cyan break-all">
                  {orderReference}
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-oj-midnight dark:text-white">
                  Order Reference (Optional)
                </label>
                <input
                  type="text"
                  value={editableOrderRef}
                  onChange={(e) => setEditableOrderRef(e.target.value)}
                  placeholder="e.g. ord_oj_1234 or leave blank for general inquiries"
                  className="w-full text-xs p-2.5 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white font-mono focus:outline-none focus:border-oj-primary transition-all"
                />
              </div>
            )}

            {/* Complaint Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-oj-midnight dark:text-white">
                Describe your complaint or inquiry
              </label>
              <textarea
                rows={3}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Please explain what you need help with (e.g. payment confirmation, delivery question, or product assistance)..."
                className="w-full text-xs p-3 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white placeholder:text-oj-muted/50 focus:outline-none focus:border-oj-primary transition-all resize-none"
              />
            </div>

            {/* Message to be Loaded Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-oj-muted">
                  MESSAGE TO BE LOADED IN WHATSAPP:
                </span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-[11px] font-bold text-oj-primary dark:text-oj-cyan hover:underline flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : null}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-oj-midnight/60 border border-oj-border dark:border-oj-dark-border font-mono text-xs leading-relaxed text-oj-midnight dark:text-slate-200 select-all whitespace-pre-wrap">
                {previewMessage}
              </div>

              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span>✓ Loaded into your WhatsApp chat composer. You can review and edit before sending.</span>
              </p>
            </div>

            {/* Security Notice */}
            <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>For your safety, never include passwords, account credentials, or security PINs.</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-oj-border dark:border-oj-dark-border bg-oj-surface-alt/30 dark:bg-oj-dark-surface-alt/30 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-5 rounded-xl border border-oj-border dark:border-oj-dark-border hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt text-xs font-bold text-oj-muted hover:text-oj-midnight dark:hover:text-white transition-all text-center"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
