import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../lib/apiClient';
import {
  X,
  ShieldCheck,
  ArrowRight,
  Building2,
  CreditCard,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({ isOpen, onClose }) => {
  const { fundWallet, formatPrice, currency, wallet, refreshWallet } = useApp();
  const [step, setStep] = useState<'input' | 'checkout' | 'success'>('input');
  const [amount, setAmount] = useState<number>(25000);
  const [customAmount, setCustomAmount] = useState<string>('25000');
  const [isInitiating, setIsInitiating] = useState(false);
  const [fundingRef, setFundingRef] = useState<string>('');
  const [gatewayRef, setGatewayRef] = useState<string>('');
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');
  const [copiedRef, setCopiedRef] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const initialBalanceRef = useRef<number>(wallet.balanceNgn);
  const pollTimerRef = useRef<any>(null);

  const presets = [2000, 5000, 10000, 25000, 50000, 100000];

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomAmount(val.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    setAmount(Number(val) || 0);
  };

  // Polls backend and gateway to verify if real funds arrived
  const checkPaymentVerification = async (): Promise<boolean> => {
    try {
      setIsCheckingStatus(true);
      // 1. Try server-to-server gateway verification check
      if (gatewayRef && fundingRef) {
        try {
          const verifyRes = await apiClient.verifyFunding(fundingRef, gatewayRef);
          if (verifyRes && (verifyRes as any).verified) {
            await refreshWallet();
            triggerSuccess();
            return true;
          }
        } catch {
          // Fallback to balance check
        }
      }

      // 2. Check if webhook already credited the wallet
      await refreshWallet();
      if (wallet.balanceNgn > initialBalanceRef.current) {
        triggerSuccess();
        return true;
      }
    } catch (e) {
      console.warn('Verification check notice:', e);
    } finally {
      setIsCheckingStatus(false);
    }
    return false;
  };

  const triggerSuccess = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setStep('success');
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 }
    });
  };

  const startAutoPolling = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      const settled = await checkPaymentVerification();
      if (settled && pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }, 3500);
  };

  const handleInitiateFunding = async () => {
    if (amount < 100) return;
    setIsInitiating(true);
    setErrorMsg('');

    try {
      initialBalanceRef.current = wallet.balanceNgn;
      const res = await fundWallet(amount);
      setFundingRef(res.reference);
      setGatewayRef(res.gatewayReference || res.reference);
      if (res.checkoutUrl) {
        setCheckoutUrl(res.checkoutUrl);
        // Automatically open the official Bachs checkout in a new window/tab
        try {
          window.open(res.checkoutUrl, '_blank', 'noopener,noreferrer');
        } catch {}
      }
      setStep('checkout');
      startAutoPolling();
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to initiate payment with Bachs Gateway. Please try again.');
    } finally {
      setIsInitiating(false);
    }
  };

  const handleOpenCheckout = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyRef = () => {
    if (fundingRef) {
      navigator.clipboard.writeText(fundingRef);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  const handleClose = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setStep('input');
    setIsInitiating(false);
    setErrorMsg('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-oj-midnight/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-2xl p-5 z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-oj-border dark:border-oj-dark-border">
              <div>
                <h3 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white">
                  Fund NGN Wallet
                </h3>
                <p className="text-xs text-oj-muted dark:text-oj-dark-muted">
                  Powered by BACH Payment Gateway
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-oj-muted hover:text-oj-midnight dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Input Amount & Select Payment Options */}
            {step === 'input' && (
              <div className="py-4 space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Supported Payment Channels Banner */}
                <div className="p-3 rounded-xl bg-oj-surface-alt/70 dark:bg-oj-dark-surface-alt/70 border border-oj-border/80 dark:border-oj-dark-border/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-oj-muted block">
                    Supported Payment Methods
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-white dark:bg-oj-dark-surface border border-oj-border/60 dark:border-oj-dark-border/60 text-center">
                      <Building2 className="w-4 h-4 mx-auto mb-1 text-oj-primary" />
                      <span className="font-semibold text-[11px] text-oj-midnight dark:text-white block">Bank Transfer</span>
                      <span className="text-[9px] text-emerald-600 font-bold">Dynamic NUBAN</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-oj-dark-surface border border-oj-border/60 dark:border-oj-dark-border/60 text-center">
                      <CreditCard className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                      <span className="font-semibold text-[11px] text-oj-midnight dark:text-white block">Debit Card</span>
                      <span className="text-[9px] text-oj-muted">Mastercard / Visa</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-oj-dark-surface border border-oj-border/60 dark:border-oj-dark-border/60 text-center">
                      <Smartphone className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                      <span className="font-semibold text-[11px] text-oj-midnight dark:text-white block">USSD / Bank App</span>
                      <span className="text-[9px] text-oj-muted">Instant Codes</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-oj-midnight dark:text-white mb-1.5">
                    Select Quick Amount
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {presets.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleSelectPreset(val)}
                        className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${
                          amount === val
                            ? 'bg-oj-primary text-white border-oj-primary shadow-glow-primary'
                            : 'bg-oj-surface-alt dark:bg-oj-dark-surface-alt border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white hover:border-oj-primary/50'
                        }`}
                      >
                        {formatPrice(val)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-oj-midnight dark:text-white mb-1">
                    Or Enter Custom Amount (NGN)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-oj-muted">
                      ₦
                    </span>
                    <input
                      type="text"
                      value={customAmount}
                      onChange={handleCustomChange}
                      placeholder="e.g. 25000"
                      className="w-full text-base font-mono font-bold pl-8 pr-4 py-2.5 rounded-input bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white focus:outline-none focus:border-oj-primary"
                    />
                  </div>
                  <p className="text-[11px] text-oj-muted mt-1">
                    Minimum deposit: ₦100 {currency !== 'NGN' && `(${formatPrice(100)})`} · Zero deposit fee
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-xs space-y-1.5">
                  <div className="flex justify-between text-oj-muted">
                    <span>Deposit Amount:</span>
                    <span className="font-mono font-bold text-oj-midnight dark:text-white">
                      {formatPrice(amount)} {currency !== 'NGN' && <span className="text-[11px] font-normal text-oj-muted">(₦{amount.toLocaleString()})</span>}
                    </span>
                  </div>
                  <div className="flex justify-between text-oj-muted">
                    <span>Gateway Processing Fee:</span>
                    <span className="font-mono font-bold text-emerald-600">Free</span>
                  </div>
                  <div className="border-t border-oj-border dark:border-oj-dark-border pt-1.5 flex justify-between font-bold text-oj-midnight dark:text-white">
                    <span>Total Credited:</span>
                    <span className="font-mono text-oj-primary dark:text-oj-cyan text-sm">
                      {formatPrice(amount)} {currency !== 'NGN' && <span className="text-[11px] font-normal text-oj-muted">(₦{amount.toLocaleString()})</span>}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleInitiateFunding}
                  disabled={amount < 100 || isInitiating}
                  className="w-full py-3 rounded-btn bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white text-xs font-bold shadow-glow-primary flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isInitiating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Secure Gateway Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Secure Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: Active Checkout Session & Real-time Settlement Tracker */}
            {step === 'checkout' && (
              <div className="py-4 space-y-4">
                {/* Session Details Card */}
                <div className="p-4 rounded-xl border border-oj-border dark:border-oj-dark-border bg-oj-surface-alt/60 dark:bg-oj-dark-surface-alt/60 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-oj-muted">Amount to Credit:</span>
                    <span className="font-mono font-extrabold text-base text-oj-midnight dark:text-white">
                      {formatPrice(amount)} <span className="text-xs font-normal text-oj-muted">(₦{amount.toLocaleString()})</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-oj-border dark:border-oj-dark-border">
                    <span className="text-oj-muted">Session Reference:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-oj-primary">{fundingRef}</span>
                      <button
                        type="button"
                        onClick={handleCopyRef}
                        className="p-1 rounded hover:bg-oj-border text-oj-muted transition-colors"
                        title="Copy reference"
                      >
                        {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button: Open Official Checkout */}
                {checkoutUrl && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={handleOpenCheckout}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white font-bold text-xs shadow-glow-primary flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Open Bachs Secure Checkout</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <p className="text-[10px] text-center text-oj-muted">
                      Pay via dynamic Bank Transfer, Card, or USSD on the official secure portal.
                    </p>
                  </div>
                )}

                {/* Real-time Settlement Listener Status */}
                <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-oj-primary animate-pulse shrink-0" />
                    <span className="font-bold text-blue-950 dark:text-blue-200">
                      Listening for Bank Settlement...
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                    As soon as you complete the transfer or card payment on Bachs Checkout, your payment will be verified and your wallet will be credited automatically.
                  </p>
                </div>

                {/* Control Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={isCheckingStatus}
                    onClick={() => checkPaymentVerification()}
                    className="w-full py-2.5 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                    <span>{isCheckingStatus ? 'Verifying with Gateway...' : 'Check Payment Status'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="w-full py-2 text-xs font-semibold text-oj-muted hover:text-oj-midnight dark:hover:text-white transition-colors"
                  >
                    Cancel & Change Amount
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success Confirmation */}
            {step === 'success' && (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="font-heading font-extrabold text-lg text-oj-midnight dark:text-white mb-1">
                    Payment Verified & Credited!
                  </h4>
                  <p className="text-xs text-oj-muted max-w-xs mx-auto">
                    Your wallet has been credited with {formatPrice(amount)} via append-only ledger reference <span className="font-mono text-oj-primary font-bold">{fundingRef}</span>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-xs flex justify-between font-bold">
                  <span className="text-oj-muted">Updated Wallet Balance:</span>
                  <span className="font-mono text-emerald-600">{formatPrice(wallet.balanceNgn)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 rounded-btn bg-oj-primary hover:bg-oj-primary-hover text-white text-xs font-bold shadow-glow-primary transition-all"
                >
                  Done & Return to Wallet
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
