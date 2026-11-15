import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  MessageCircle,
  Send,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  FileQuestion,
  ExternalLink,
  PhoneCall,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WhatsAppSupportModal, OFFICIAL_WHATSAPP_DISPLAY } from '../components/support/WhatsAppSupportModal';

export const SupportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, showToast } = useApp();

  const [orderRef, setOrderRef] = useState(searchParams.get('orderRef') || '');
  const [subject, setSubject] = useState(
    searchParams.get('orderRef') ? `Order Support: ${searchParams.get('orderRef')}` : ''
  );
  const [category, setCategory] = useState(searchParams.get('category') || 'order_issue');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // WhatsApp Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('orderRef');
    if (ref) {
      setOrderRef(ref);
      if (!subject) setSubject(`Order Support: ${ref}`);
    }
  }, [searchParams]);

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) {
      showToast('Please provide at least 10 characters describing your inquiry.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      showToast('Support ticket #TCK-8821 submitted. An agent will respond shortly.');
    }, 1000);
  };

  const faqs = [
    {
      q: 'How do I access and copy my purchased digital accounts or license keys?',
      a: 'Navigate to Orders from the bottom menu or top bar. All completed orders feature an AES-256 Digital Delivery Vault where you can click "Copy All", "Download .txt", or copy individual UID, Password, and 2FA secrets.'
    },
    {
      q: 'How do I use 2FA secrets to generate 6-digit login codes?',
      a: 'Copy the 2FA secret from your order vault and open https://2fa.live in your browser. Paste the secret key to instantly generate the live 6-digit verification code.'
    },
    {
      q: 'How does the automated refund work for virtual numbers?',
      a: 'Each virtual number comes with an active 15-minute countdown. If no incoming SMS code is received, you can cancel the session anytime or let it expire to receive an instant 100% wallet refund.'
    },
    {
      q: 'How fast are Bachs bank transfer wallet funding requests credited?',
      a: 'Bachs bank deposits are confirmed automatically via real-time webhooks within 30 to 90 seconds. Once confirmed, your NGN balance updates instantly.'
    },
    {
      q: 'How do I reach human support on WhatsApp?',
      a: `You can reach our priority customer support desk on WhatsApp at ${OFFICIAL_WHATSAPP_DISPLAY}. Click "Contact Support on WhatsApp" anywhere on the platform to launch a direct chat.`
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-28 md:pb-16 space-y-8">
      {/* Hero Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-oj-primary/10 text-oj-primary dark:text-oj-cyan text-xs font-bold border border-oj-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>24/7 Customer Care & Support Desk</span>
        </div>
        <h1 className="font-heading font-black text-2xl sm:text-4xl text-oj-midnight dark:text-white tracking-tight">
          Help & Customer Support Desk
        </h1>
        <p className="text-xs sm:text-sm text-oj-muted dark:text-oj-dark-muted max-w-xl mx-auto leading-relaxed">
          Need help with an order, account credentials, or automated fulfillment? Reach out to our priority support desk on WhatsApp or submit a ticket below.
        </p>
      </div>

      {/* Priority WhatsApp Access Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 dark:border-emerald-500/20 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white">
                Priority WhatsApp Support Desk
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                ● Live 24/7
              </span>
            </div>
            <p className="text-xs text-oj-muted dark:text-oj-dark-muted mt-0.5">
              Official WhatsApp Line: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{OFFICIAL_WHATSAPP_DISPLAY}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsWhatsAppModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat on WhatsApp</span>
        </button>
      </div>

      {/* Ticket Form Card */}
      <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-oj-border dark:border-oj-dark-border">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-oj-midnight dark:text-white">
              Submit a Support Ticket
            </h3>
            <p className="text-xs text-oj-muted dark:text-oj-dark-muted mt-0.5">
              Logged directly to your verified customer profile. Average response time: under 15 minutes.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-oj-primary dark:text-oj-cyan bg-oj-primary/10 px-3 py-1.5 rounded-lg border border-oj-primary/20 hidden sm:inline">
            Priority Queue
          </span>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20 shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-extrabold text-lg text-oj-midnight dark:text-white">
                Ticket Successfully Submitted!
              </h4>
              <p className="text-xs text-oj-muted dark:text-oj-dark-muted max-w-sm mx-auto">
                Ticket reference #TCK-8821 has been recorded. Our support engineers will contact you or review your order immediately.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setMessage('');
                  setSubject('');
                }}
                className="px-4 py-2 rounded-xl border border-oj-border dark:border-oj-dark-border hover:bg-oj-surface-alt text-xs font-bold text-oj-midnight dark:text-white transition-all"
              >
                Submit Another Ticket
              </button>
              <Link
                to="/orders"
                className="px-4 py-2 rounded-xl bg-oj-primary hover:bg-oj-primary-hover text-white text-xs font-bold transition-all shadow-sm"
              >
                Return to Orders
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleTicketSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Order Reference */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-oj-midnight dark:text-white">
                  Order Reference (Optional)
                </label>
                <input
                  type="text"
                  value={orderRef}
                  onChange={(e) => setOrderRef(e.target.value)}
                  placeholder="e.g. ord_oj_8083 or LP-..."
                  className="w-full text-xs p-3 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white font-mono focus:outline-none focus:border-oj-primary transition-all"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-oj-midnight dark:text-white">
                  Issue Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary transition-all"
                >
                  <option value="order_issue">Digital Goods / Account Credentials Issue</option>
                  <option value="number_issue">Virtual Number / SMS Code Delay</option>
                  <option value="wallet_payment">BACH Payment / Wallet Funding Verification</option>
                  <option value="smm_boost">Social Media Boost Service Issue</option>
                  <option value="general">Account Governance & General Inquiries</option>
                </select>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-oj-midnight dark:text-white">
                Subject *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your inquiry (e.g. Issue logging into Facebook account)"
                className="w-full text-xs p-3 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary transition-all"
              />
            </div>

            {/* Message Details */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-oj-midnight dark:text-white">
                Message Details *
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe what you need assistance with in detail..."
                className="w-full text-xs p-3 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary transition-all resize-none"
              />
              <span className="text-[11px] text-oj-muted block">
                Minimum 10 characters. Never share raw passwords.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white text-xs font-extrabold shadow-glow-primary flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Support Ticket</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-oj-primary dark:text-oj-cyan" />
          <h3 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-oj-border dark:border-oj-dark-border bg-white dark:bg-oj-dark-surface overflow-hidden shadow-xs transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-bold text-oj-midnight dark:text-white hover:text-oj-primary dark:hover:text-oj-cyan transition-colors"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-oj-primary shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-oj-muted shrink-0" />
                )}
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 pb-4 text-xs text-oj-muted dark:text-oj-dark-muted leading-relaxed border-t border-oj-border/50 dark:border-oj-dark-border/50 pt-3"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppSupportModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        orderReference={orderRef || undefined}
        defaultComplaint={message || undefined}
      />
    </div>
  );
};
