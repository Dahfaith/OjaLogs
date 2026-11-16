import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  MessageCircle,
  Send,
  HelpCircle,
  FileCode,
  X,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WhatsAppSupportModal, OFFICIAL_WHATSAPP_DISPLAY } from './WhatsAppSupportModal';

export const FloatingSupport: React.FC = () => {
  const { setIsSupportOpen } = useApp();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const handleOpenTicket = () => {
    setIsMenuOpen(false);
    setIsSupportOpen(true);
  };

  const handleBrowseFaqs = () => {
    setIsMenuOpen(false);
    navigate('/support');
  };

  const handleOpenDocs = () => {
    setIsMenuOpen(false);
    navigate('/docs/api');
  };

  const handleOpenWhatsApp = () => {
    setIsMenuOpen(false);
    setIsWhatsAppOpen(true);
  };

  return (
    <>
      {/* Floating Action Menu Card */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:bg-transparent"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed bottom-36 sm:bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-96 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-oj-midnight to-oj-navy text-white flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-oj-primary/20 border border-oj-cyan/30 flex items-center justify-center text-oj-cyan shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-sm text-white">
                      Ojalogs Support Desk
                    </h3>
                    <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Official Support Desk · 24/7 Active</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close support menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-Header Notice */}
              <div className="p-3.5 bg-oj-surface-alt/60 dark:bg-oj-dark-surface-alt/40 border-b border-oj-border dark:border-oj-dark-border text-xs text-oj-muted dark:text-slate-300 leading-relaxed">
                Need assistance with an order, account verification, or API integration? We are here for you.
              </div>

              {/* Menu Action Options */}
              <div className="p-3 space-y-2">
                {/* 1. WhatsApp Desk */}
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="w-full p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-oj-midnight dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        Contact Support on WhatsApp
                      </h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                        Direct desk: {OFFICIAL_WHATSAPP_DISPLAY} · Instant
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 2. Submit Ticket */}
                <button
                  type="button"
                  onClick={handleOpenTicket}
                  className="w-full p-3 rounded-xl bg-white dark:bg-oj-dark-surface hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt/60 border border-oj-border dark:border-oj-dark-border transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-oj-primary/10 text-oj-primary dark:text-oj-cyan flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-oj-midnight dark:text-white group-hover:text-oj-primary dark:group-hover:text-oj-cyan transition-colors">
                        Submit Support Ticket
                      </h4>
                      <p className="text-[11px] text-oj-muted dark:text-slate-400">
                        Get authoritative assistance from our team
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-oj-muted group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 3. Browse FAQs */}
                <button
                  type="button"
                  onClick={handleBrowseFaqs}
                  className="w-full p-3 rounded-xl bg-white dark:bg-oj-dark-surface hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt/60 border border-oj-border dark:border-oj-dark-border transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-oj-midnight dark:text-white group-hover:text-oj-primary dark:group-hover:text-oj-cyan transition-colors">
                        Browse FAQs & Guides
                      </h4>
                      <p className="text-[11px] text-oj-muted dark:text-slate-400">
                        Instant answers to common questions
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-oj-muted group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 4. Developer Docs */}
                <button
                  type="button"
                  onClick={handleOpenDocs}
                  className="w-full p-3 rounded-xl bg-white dark:bg-oj-dark-surface hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt/60 border border-oj-border dark:border-oj-dark-border transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-oj-midnight dark:text-white group-hover:text-oj-primary dark:group-hover:text-oj-cyan transition-colors">
                        Developer Documentation
                      </h4>
                      <p className="text-[11px] text-oj-muted dark:text-slate-400">
                        Integrate with our REST API & webhooks
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-oj-muted group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Footer */}
              <div className="p-3 bg-oj-surface-alt/40 dark:bg-oj-dark-surface-alt/30 border-t border-oj-border dark:border-oj-dark-border text-center text-[10px] text-oj-muted">
                Built for Ojalogs · Priority Customer Desk
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) in Ojalogs Electric Blue / Cyan theme */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex fixed bottom-20 right-4 sm:bottom-8 sm:right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-oj-primary via-blue-600 to-oj-cyan text-white shadow-glow-primary items-center justify-center border border-white/20 focus:outline-none transition-all"
        aria-label="Contact Customer Care & Support"
      >
        <AnimatePresence mode="wait">
          {isMenuOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="sr-only">Support</span>
        {!isMenuOpen && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-oj-midnight animate-pulse" />
        )}
      </motion.button>

      {/* Dedicated WhatsApp Support Modal */}
      <WhatsAppSupportModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
      />
    </>
  );
};
