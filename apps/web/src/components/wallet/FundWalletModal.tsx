import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ShieldCheck, ArrowRight, Building2, CheckCircle2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({ isOpen, onClose }) => {
  const { fundWallet } = useApp();
  const [step, setStep] = useState<'input' | 'transfer' | 'success'>('input');
  const [amount, setAmount] = useState<number>(25000);
  const [customAmount, setCustomAmount] = useState<string>('25000');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fundingRef, setFundingRef] = useState<string>('');
  const [copiedAccount, setCopiedAccount] = useState(false);

  const presets = [5000, 10000, 25000, 50000, 100000];

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomAmount(val.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    setAmount(Number(val) || 0);
  };

  const handleInitiateFunding = () => {
    if (amount < 100) return;
    const ref = `ref_oj_${Math.floor(1000000 + Math.random() * 9000000)}`;
    setFundingRef(ref);
    setStep('transfer');
  };

  const handleConfirmTransfer = async () => {
    setIsProcessing(true);
    try {
      await fundWallet(amount);
      setStep('success');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('0198423910');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleClose = () => {
    setStep('input');
    setIsProcessing(false);
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
                className="w-8 h-8 rounded-lg flex items-center justify-center text-oj-muted hover:text-oj-midnight dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Input Amount */}
            {step === 'input' && (
              <div className="py-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-oj-midnight dark:text-white mb-1.5">
                    Select Quick Amount
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
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
                        ₦{(val / 1000).toFixed(0)}k
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
                    Minimum deposit: ₦100 · Zero funding fee
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-xs space-y-1.5">
                  <div className="flex justify-between text-oj-muted">
                    <span>Deposit Amount:</span>
                    <span className="font-mono font-bold text-oj-midnight dark:text-white">
                      ₦{amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-oj-muted">
                    <span>Provider Gateway Fee:</span>
                    <span className="font-mono font-bold text-emerald-600">₦0.00 (Free)</span>
                  </div>
                  <div className="border-t border-oj-border dark:border-oj-dark-border pt-1.5 flex justify-between font-bold text-oj-midnight dark:text-white">
                    <span>You Receive:</span>
                    <span className="font-mono text-oj-primary dark:text-oj-cyan">
                      ₦{amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleInitiateFunding}
                  disabled={amount < 100}
                  className="w-full py-3 rounded-btn bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white text-xs font-bold shadow-glow-primary flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: One-time Bank Transfer details (BACH flow) */}
            {step === 'transfer' && (
              <div className="py-4 space-y-4">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                  <p className="font-semibold mb-1 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-oj-primary" />
                    <span>Safe, One-Time Dynamic Funding Account</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                    A dedicated temporary bank account has been provisioned by BACH Gateway specifically for this deposit. Funds are credited automatically upon verification.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-oj-border dark:border-oj-dark-border bg-oj-surface-alt/60 dark:bg-oj-dark-surface-alt/60 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-oj-muted">Bank Name:</span>
                    <span className="font-bold text-oj-midnight dark:text-white">Wema Bank / BACH Pay</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-oj-muted">Account Name:</span>
                    <span className="font-bold text-oj-midnight dark:text-white">Ojalogs · Katie Mille</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-oj-border dark:border-oj-dark-border">
                    <span className="text-oj-muted">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-oj-primary dark:text-oj-cyan tracking-wider">
                        0198423910
                      </span>
                      <button
                        onClick={handleCopyAccount}
                        className="p-1 rounded hover:bg-oj-border dark:hover:bg-oj-dark-border text-oj-muted"
                        title="Copy account number"
                      >
                        {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-oj-border dark:border-oj-dark-border">
                    <span className="text-oj-muted">Exact Amount:</span>
                    <span className="font-mono font-bold text-base text-oj-midnight dark:text-white">
                      ₦{amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1 text-oj-muted">
                    <span>Payment Reference:</span>
                    <span className="font-mono text-oj-muted">{fundingRef}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    disabled={isProcessing}
                    onClick={handleConfirmTransfer}
                    className="w-full py-3 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 animate-spin" />
                        <span>Verifying transfer with BACH...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>I Have Completed This Transfer</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="w-full py-2 text-xs font-semibold text-oj-muted hover:text-oj-midnight dark:hover:text-white"
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
                    Your NGN wallet has been atomically credited with ₦{amount.toLocaleString()} via append-only ledger reference <span className="font-mono text-oj-primary font-bold">{fundingRef}</span>.
                  </p>
                </div>

                <button
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

