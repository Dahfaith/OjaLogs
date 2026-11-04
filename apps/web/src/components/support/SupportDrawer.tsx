import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Send, ShieldAlert, MessageSquare, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SupportDrawer: React.FC = () => {
  const { isSupportOpen, setIsSupportOpen, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'ticket' | 'abuse'>('ticket');
  
  // Ticket Form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('order_issue');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Abuse Form
  const [abuseEmail, setAbuseEmail] = useState('');
  const [abuseIdentifier, setAbuseIdentifier] = useState('');
  const [abuseCategory, setAbuseCategory] = useState('fraud');
  const [abuseDetails, setAbuseDetails] = useState('');

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      showToast('Support ticket #TCK-9921 submitted. An agent will respond shortly.');
      setSubmitted(false);
      setSubject('');
      setMessage('');
      setIsSupportOpen(false);
    }, 1200);
  };

  const handleAbuseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      showToast('Abuse report submitted directly to Trust & Safety. Thank you for keeping Ojalogs safe.');
      setSubmitted(false);
      setAbuseEmail('');
      setAbuseIdentifier('');
      setAbuseDetails('');
      setIsSupportOpen(false);
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isSupportOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSupportOpen(false)}
            className="fixed inset-0 z-50 bg-oj-midnight/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-oj-dark-surface shadow-2xl flex flex-col border-l border-oj-border dark:border-oj-dark-border"
          >
            {/* Header */}
            <div className="p-4 border-b border-oj-border dark:border-oj-dark-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-oj-primary/10 text-oj-primary flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white">
                    Support & Trust Center
                  </h3>
                  <p className="text-[11px] text-oj-muted dark:text-oj-dark-muted">
                    We're available 24/7 to resolve your inquiries
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSupportOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-oj-muted hover:text-oj-midnight dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-oj-border dark:border-oj-dark-border bg-oj-surface-alt/40 dark:bg-oj-dark-surface-alt/40 p-1 m-3 rounded-xl">
              <button
                onClick={() => setActiveTab('ticket')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'ticket'
                    ? 'bg-white dark:bg-oj-dark-surface text-oj-primary shadow-sm'
                    : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open Ticket</span>
              </button>

              <button
                onClick={() => setActiveTab('abuse')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'abuse'
                    ? 'bg-white dark:bg-oj-dark-surface text-red-600 shadow-sm'
                    : 'text-oj-muted hover:text-oj-midnight dark:hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Report Abuse</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {activeTab === 'ticket' ? (
                <form onSubmit={handleTicketSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-oj-midnight dark:text-white mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
                    >
                      <option value="order_issue">Digital Goods / Key Redemption Issue</option>
                      <option value="number_issue">Virtual Number / SMS Delay</option>
                      <option value="wallet_payment">BACH Wallet Funding Verification</option>
                      <option value="general">Account & General Inquiries</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-oj-midnight dark:text-white mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Issue activating Windows 11 key"
                      className="w-full text-xs p-2.5 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-oj-midnight dark:text-white mb-1">
                      Message Details
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please include order reference number or transaction ID for faster turnaround..."
                      className="w-full text-xs p-2.5 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitted}
                    className="w-full py-2.5 rounded-btn bg-oj-primary hover:bg-oj-primary-hover text-white text-xs font-bold shadow-glow-primary flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {submitted ? <CheckCircle2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{submitted ? 'Submitting...' : 'Submit Support Ticket'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAbuseSubmit} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      Ojalogs strictly prohibits stolen accounts, credentials, spamming, and platform circumvention. All reports trigger automated priority review.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-oj-midnight dark:text-white mb-1">
                      Violation Type
                    </label>
                    <select
                      value={abuseCategory}
                      onChange={(e) => setAbuseCategory(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
                    >
                      <option value="fraud">Fraudulent Activity or Phishing</option>
                      <option value="spam">Spam or Bulk Account Evasion</option>
                      <option value="unauthorized_access">Unauthorized Platform Access</option>
                      <option value="policy_violation">Prohibited Digital Item Listing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-oj-midnight dark:text-white mb-1">
                      Target Identifier
                    </label>
                    <input
                      type="text"
                      required
                      value={abuseIdentifier}
                      onChange={(e) => setAbuseIdentifier(e.target.value)}
                      placeholder="Virtual phone number, Product SKU, or User ID"
                      className="w-full text-xs p-2.5 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-oj-midnight dark:text-white mb-1">
                      Your Email (for status updates)
                    </label>
                    <input
                      type="email"
                      required
                      value={abuseEmail}
                      onChange={(e) => setAbuseEmail(e.target.value)}
                      placeholder="reporter@domain.com"
                      className="w-full text-xs p-2.5 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-oj-midnight dark:text-white mb-1">
                      Incident Details & Evidence
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={abuseDetails}
                      onChange={(e) => setAbuseDetails(e.target.value)}
                      placeholder="Please describe the abuse or violation..."
                      className="w-full text-xs p-2.5 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitted}
                    className="w-full py-2.5 rounded-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{submitted ? 'Filing Report...' : 'Submit Abuse Report to Trust & Safety'}</span>
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

