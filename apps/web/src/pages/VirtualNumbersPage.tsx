import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  PhoneCall,
  Globe2,
  Clock,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Zap,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockCountries, mockServices } from '../lib/mockData';

export const VirtualNumbersPage: React.FC = () => {
  const { activeNumbers, requestNumber, cancelNumber, simulateIncomingSms, wallet, showToast, setIsSupportOpen, formatPrice, user, setIsAuthModalOpen } = useApp();

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('US');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('whatsapp');
  const [rentalType, setRentalType] = useState<'one_time_sms' | 'long_term_rental'>('one_time_sms');
  const [isRequesting, setIsRequesting] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const selectedCountry = mockCountries.find(c => c.code === selectedCountryCode) || mockCountries[0];
  const selectedService = mockServices.find(s => s.id === selectedServiceId) || mockServices[0];
  const price = rentalType === 'long_term_rental' ? selectedService.priceNgn * 5 : selectedService.priceNgn;

  const handleRequest = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      showToast('Please sign in or enter your email to allocate a virtual number.');
      return;
    }

    setIsRequesting(true);
    try {
      await requestNumber(selectedCountryCode, selectedServiceId, rentalType);
    } catch (err: any) {
      showToast(err.message || 'Failed to allocate virtual line');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    showToast(`Copied verification code ${code}`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24 md:pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-oj-cyan/10 text-oj-cyan flex items-center justify-center">
            <PhoneCall className="w-4 h-4" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-oj-midnight dark:text-white">
            Virtual Phone Numbers
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-oj-muted dark:text-oj-dark-muted">
          Division B: Temporary verification SMS & long-term renewable virtual numbers across 50+ countries.
        </p>
      </div>

      {/* Acceptable Use Guardrail Banner */}
      <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
        <ShieldCheck className="w-4 h-4 text-oj-primary shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Strict Acceptable Use Policy: </span>
          <span>
            Virtual numbers are provisioned strictly for authorized provider verifications and legitimate communication. Spamming, botting, or platform restriction circumvention is blocked and audited.
          </span>
          <button
            onClick={() => setIsSupportOpen(true)}
            className="ml-1 text-oj-primary underline font-semibold hover:text-oj-primary-hover"
          >
            Report Abuse
          </button>
        </div>
      </div>

      {!user && (
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Browsing Mode:</strong> You can explore all available countries, services, and live pricing. Sign in with your email to allocate a line and receive SMS verification codes.
            </span>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold whitespace-nowrap transition-all shadow-sm"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Number Provisioning Form Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-5">
        <h2 className="font-heading font-bold text-base text-oj-midnight dark:text-white flex items-center gap-2">
          <span>Provision a New Virtual Line</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            ● Live Provider Pool
          </span>
        </h2>

        {/* Step 1: Country Picker */}
        <div>
          <label className="block text-xs font-semibold text-oj-midnight dark:text-white mb-2">
            1. Select Country ({mockCountries.length} Available)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {mockCountries.map((c) => {
              const isSelected = selectedCountryCode === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedCountryCode(c.code)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-oj-primary/10 border-oj-primary text-oj-primary dark:bg-oj-primary/20 shadow-sm'
                      : 'bg-oj-surface-alt/60 dark:bg-oj-dark-surface-alt/60 border-oj-border dark:border-oj-dark-border hover:border-oj-primary/40 text-oj-midnight dark:text-white'
                  }`}
                >
                  <span className="text-xl">{c.flag}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{c.name}</p>
                    <p className="text-[10px] text-oj-muted font-mono">{c.dialCode} · {c.availableNumbers} lines</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Service Selection */}
        <div>
          <label className="block text-xs font-semibold text-oj-midnight dark:text-white mb-2">
            2. Select Service or Platform
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {mockServices.map((s) => {
              const isSelected = selectedServiceId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedServiceId(s.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-oj-midnight text-white border-oj-midnight dark:bg-oj-primary dark:border-oj-primary shadow-glow-primary'
                      : 'bg-oj-surface-alt/60 dark:bg-oj-dark-surface-alt/60 border-oj-border dark:border-oj-dark-border hover:border-oj-primary/40 text-oj-midnight dark:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold truncate">{s.name}</span>
                    {s.popular && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-400">
                        HOT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold">{formatPrice(s.priceNgn)}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-cyan-300' : 'text-emerald-600'}`}>
                      {s.successRate}% Success
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Rental Duration Type */}
        <div>
          <label className="block text-xs font-semibold text-oj-midnight dark:text-white mb-2">
            3. Rental Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRentalType('one_time_sms')}
              className={`p-3 rounded-xl border text-left transition-all ${
                rentalType === 'one_time_sms'
                  ? 'bg-oj-primary/10 border-oj-primary text-oj-primary dark:bg-oj-primary/20'
                  : 'bg-oj-surface-alt/40 dark:bg-oj-dark-surface-alt/40 border-oj-border dark:border-oj-dark-border text-oj-muted hover:text-oj-midnight'
              }`}
            >
              <p className="text-xs font-bold text-oj-midnight dark:text-white">One-Time Verification SMS</p>
              <p className="text-[11px] text-oj-muted mt-0.5">15-minute active window. 100% refund if SMS not received.</p>
            </button>

            <button
              type="button"
              onClick={() => setRentalType('long_term_rental')}
              className={`p-3 rounded-xl border text-left transition-all ${
                rentalType === 'long_term_rental'
                  ? 'bg-oj-primary/10 border-oj-primary text-oj-primary dark:bg-oj-primary/20'
                  : 'bg-oj-surface-alt/40 dark:bg-oj-dark-surface-alt/40 border-oj-border dark:border-oj-dark-border text-oj-muted hover:text-oj-midnight'
              }`}
            >
              <p className="text-xs font-bold text-oj-midnight dark:text-white">7-Day Renewable Rental</p>
              <p className="text-[11px] text-oj-muted mt-0.5">Dedicated private number with multiple SMS & auto-renewal.</p>
            </button>
          </div>
        </div>

        {/* Summary & Request Button */}
        <div className="pt-3 border-t border-oj-border dark:border-oj-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-oj-muted block">Total Wallet Charge</span>
            <div className="flex items-baseline gap-2">
              <span className="font-heading font-extrabold text-xl text-oj-midnight dark:text-white">
                {formatPrice(price)}
              </span>
              <span className="text-xs text-oj-muted">
                {user ? `(Wallet Balance: ${formatPrice(wallet.balanceNgn)})` : '(Sign in required to allocate)'}
              </span>
            </div>
          </div>

          {!user ? (
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                showToast('Please sign in or enter your email to allocate a virtual number.');
              }}
              className="py-3 px-6 rounded-btn bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Sign In to Allocate Number</span>
            </button>
          ) : (
            <button
              onClick={handleRequest}
              disabled={isRequesting || wallet.balanceNgn < price}
              className="py-3 px-6 rounded-btn bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white text-xs font-bold shadow-glow-primary flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{isRequesting ? 'Allocating line...' : 'Allocate Virtual Number'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Number Sessions Tracker */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white">
            Active Telephony Sessions ({activeNumbers.length})
          </h2>
          <span className="text-xs text-oj-muted">Auto-refreshed in real-time</span>
        </div>

        {activeNumbers.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-oj-dark-surface rounded-2xl border border-oj-border dark:border-oj-dark-border shadow-soft space-y-2">
            <PhoneCall className="w-8 h-8 text-oj-muted mx-auto mb-1 opacity-50" />
            <p className="font-heading font-bold text-sm text-oj-midnight dark:text-white">
              No Active Virtual Lines
            </p>
            <p className="text-xs text-oj-muted max-w-sm mx-auto leading-relaxed">
              Select your desired country and service above, then click &ldquo;Allocate Virtual Line&rdquo; to start an active 15-minute SMS verification session.
            </p>
          </div>
        ) : (
          activeNumbers.map((session) => {
          const isCountdownActive = session.status === 'active';
          const minutes = Math.floor(session.timeRemainingSeconds / 60);
          const seconds = session.timeRemainingSeconds % 60;

          return (
            <motion.div
              key={session.id}
              layout
              className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-4"
            >
              {/* Session Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-oj-border dark:border-oj-dark-border">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{session.country.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-lg sm:text-xl text-oj-midnight dark:text-white tracking-wide">
                        {session.phoneNumber}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(session.phoneNumber);
                          showToast('Phone number copied');
                        }}
                        className="p-1 rounded text-oj-muted hover:text-oj-midnight dark:hover:text-white"
                        title="Copy number"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-oj-muted">
                      {session.service.name} · Ref: <span className="font-mono">{session.reference}</span>
                    </p>
                  </div>
                </div>

                {/* Status & Timer */}
                <div className="flex items-center gap-2">
                  {session.status === 'active' && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>{minutes}:{seconds.toString().padStart(2, '0')} remaining</span>
                    </div>
                  )}

                  {session.status === 'sms_received' && (
                    <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>SMS Received</span>
                    </span>
                  )}

                  {session.status === 'refunded' && (
                    <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>100% Refunded</span>
                    </span>
                  )}

                  {session.canCancel && (
                    <button
                      onClick={() => cancelNumber(session.id)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      Cancel & Refund
                    </button>
                  )}
                </div>
              </div>

              {/* Incoming SMS Feed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-oj-muted">
                  <span className="font-semibold text-oj-midnight dark:text-white">Incoming SMS Messages</span>
                  {/* Client Demo Trigger */}
                  {session.status === 'active' && (
                    <button
                      onClick={() => simulateIncomingSms(session.id)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-oj-cyan/10 hover:bg-oj-cyan/20 text-oj-cyan border border-oj-cyan/30 flex items-center gap-1 transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Test / Simulate Inbound SMS</span>
                    </button>
                  )}
                </div>

                {session.messages.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-oj-border dark:border-oj-dark-border text-center text-xs text-oj-muted bg-oj-surface-alt/30 dark:bg-oj-dark-surface-alt/30">
                    <p className="animate-pulse">Waiting for incoming SMS from {session.service.name}...</p>
                    <p className="text-[11px] mt-1 text-slate-400">
                      Copy the number above and paste it into {session.service.name}. If no SMS arrives within the countdown window, your wallet is 100% refunded automatically.
                    </p>
                  </div>
                ) : (
                  session.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            {msg.sender}
                          </span>
                          <span className="text-[10px] text-oj-muted">{msg.receivedAt}</span>
                        </div>
                        <p className="text-xs text-oj-midnight dark:text-white">{msg.fullText}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-oj-dark-surface px-3 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700">
                          {msg.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(msg.code, msg.id)}
                          className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          title="Copy Code"
                        >
                          {copiedCodeId === msg.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          );
        }))}
      </div>
    </div>
  );
};

