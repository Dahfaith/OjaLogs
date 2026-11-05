import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, FileText, Lock, ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import { motion } from 'framer-motion';

export const LegalPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const currentTab = slug || 'terms';

  const tabs = [
    { id: 'terms', label: 'Terms of Service', icon: Scale },
    { id: 'privacy', label: 'Privacy & Data Protection', icon: Lock },
    { id: 'acceptable-use', label: 'Acceptable Use Policy', icon: ShieldCheck },
    { id: 'refund', label: 'Refund & Guarantee Policy', icon: RefreshCw },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-24 md:pb-12 text-oj-midnight dark:text-white">
      {/* Header Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-oj-muted dark:text-oj-dark-muted">
        <Link to="/" className="hover:text-oj-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-oj-midnight dark:text-white font-semibold">Legal & Compliance</span>
      </div>

      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-oj-midnight text-white border border-oj-navy relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-oj-primary/20 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-oj-cyan uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Ojalogs Governance & Compliance</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl">
            Legal Terms & Platform Agreements
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            These documents govern the use of the Ojalogs digital goods marketplace, logical server fulfillment network, and telephony verification services operated by Ojalogs Marketplace Technologies Ltd.
          </p>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-oj-border dark:border-oj-dark-border">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={`/legal/${tab.id}`}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-oj-primary text-white shadow-glow-primary'
                  : 'bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-oj-muted hover:text-oj-midnight dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Document Content View */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-6 leading-relaxed text-xs sm:text-sm text-oj-midnight dark:text-slate-200">
        {currentTab === 'terms' && (
          <div className="space-y-6">
            <div className="border-b border-oj-border dark:border-oj-dark-border pb-4">
              <h2 className="font-heading font-extrabold text-xl text-oj-midnight dark:text-white">
                Terms of Service
              </h2>
              <p className="text-xs text-oj-muted mt-1">Last Updated: November 2026 · Effective Immediately</p>
            </div>

            <section className="space-y-2">
              <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">1. Entity & Agreement</h3>
              <p>
                These Terms of Service constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;Customer&rdquo;) and <strong>Ojalogs Marketplace Technologies Ltd</strong> (&ldquo;Ojalogs&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By accessing our website, interacting with our dedicated Server APIs, funding an account wallet, or provisioning services, you agree to comply with all terms herein.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">2. Nature of the Marketplace</h3>
              <p>
                Ojalogs provides an automated digital infrastructure operating across two core operational divisions:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-oj-muted dark:text-slate-300">
                <li><strong>Division A (Digital Goods & Licenses):</strong> Genuine software licenses, VPN vouchers, eSIM travel data profiles, residential/datacenter proxies, and creator profiles connected to four upstream logical server clusters.</li>
                <li><strong>Division B (Telephony Verification Gateway):</strong> Temporary virtual phone numbers provisioned exclusively for authorized one-time SMS verification and legitimate identity confirmations.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">3. Multi-Currency Wallet & Settlement</h3>
              <p>
                All wallet balances are denominated primarily in Nigerian Naira (NGN) with dynamic real-time conversion into USD, EUR, and GBP. Wallet funding is processed via certified banking gateways (including BACH Payment Gateway) using verified one-time dynamic bank transfer accounts or secure payment links. Wallet funds may only be redeemed for marketplace goods and services and cannot be transferred between unrelated third-party users.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">4. Delivery & Encrypted Vault Access</h3>
              <p>
                Upon verified payment or wallet debit, digital items are dispatched within seconds and stored in your private dashboard vault encrypted using industry-standard AES-256. Decrypted secrets are displayed once the customer initiates explicit inspection in their secure session.
              </p>
            </section>
          </div>
        )}

        {currentTab === 'privacy' && (
          <div className="space-y-6">
            <div className="border-b border-oj-border dark:border-oj-dark-border pb-4">
              <h2 className="font-heading font-extrabold text-xl text-oj-midnight dark:text-white">
                Privacy & Data Protection Policy
              </h2>
              <p className="text-xs text-oj-muted mt-1">NDPR & International Data Protection Compliant</p>
            </div>

            <section className="space-y-2">
              <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">1. Information We Collect</h3>
              <p>
                We minimize personal data collection to protect your online privacy. We only collect:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-oj-muted dark:text-slate-300">
                <li>Your email address (for passwordless authentication and order dispatch notifications).</li>
                <li>Immutable financial transaction ledger records (credits, debits, and payment gateway references).</li>
                <li>Session security metadata (masked IP address, login timestamp, and cryptographic authorization tokens).</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">2. Passwordless Authentication</h3>
              <p>
                Ojalogs eliminates static passwords entirely. Authentication is executed via cryptographic magic links and 6-digit one-time passcodes (OTP) dispatched directly to your verified email. We never store, transmit, or ask for account passwords.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">3. Vault Encryption & Row-Level Security</h3>
              <p>
                Delivered digital credentials, license keys, and proxy records are stored in PostgreSQL databases protected by rigorous Row-Level Security (RLS) policies. Only the authorized account holder who placed the order possesses cryptographic clearance to decrypt the secrets.
              </p>
            </section>
          </div>
        )}

        {currentTab === 'acceptable-use' && (
          <div className="space-y-6">
            <div className="border-b border-oj-border dark:border-oj-dark-border pb-4">
              <h2 className="font-heading font-extrabold text-xl text-oj-midnight dark:text-white">
                Acceptable Use Policy (AUP)
              </h2>
              <p className="text-xs text-oj-muted mt-1">Strict Prohibition Against Abuse, Fraud, and Spam</p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Zero Tolerance Policy</span>
              </div>
              <p className="text-xs leading-relaxed">
                Any attempt to utilize Ojalogs virtual phone numbers, proxies, or accounts for illicit purposes, botting, spamming, financial fraud, phishing, or harassment will result in immediate line revocation, permanent account termination, and forfeiture of funds.
              </p>
            </div>

            <section className="space-y-2">
              <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">1. Authorized Verification Use Only</h3>
              <p>
                Division B virtual numbers are provisioned strictly for lawful, authorized incoming SMS account verifications (e.g. WhatsApp, Telegram, Google, Claude, OpenAI). Automated robotic bulk spamming or unlawful circumvention of platform safety controls is forbidden.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">2. Proxy & Network Integrity</h3>
              <p>
                Residential and LTE proxies provisioned through Server 1 must adhere to ethical internet scraping and secure browsing guidelines. Denial of service (DoS) attacks, brute-force hacking, and illicit torrenting are actively blocked by upstream firewall filters.
              </p>
            </section>
          </div>
        )}

        {currentTab === 'refund' && (
          <div className="space-y-6">
            <div className="border-b border-oj-border dark:border-oj-dark-border pb-4">
              <h2 className="font-heading font-extrabold text-xl text-oj-midnight dark:text-white">
                Refund & Guarantee Policy
              </h2>
              <p className="text-xs text-oj-muted mt-1">Automated 100% Protection & Replacements</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>15-Minute Automated Telephony Guarantee</span>
              </div>
              <p className="text-xs leading-relaxed">
                If no SMS verification code is received from the provider within the active 15-minute countdown window, our telephony daemon automatically revokes the line and returns 100% of the purchase amount directly to your NGN wallet balance. No support ticket or human intervention required!
              </p>
            </div>

            <section className="space-y-2">
              <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">1. Digital Goods Warranty (Division A)</h3>
              <p>
                All digital accounts, licenses, and vouchers undergo real-time cryptographic validation prior to customer dispatch. In the rare event of a defective key or non-functional credential, our Super Admin inspection system provides a 24-hour instant replacement warranty upon review via our integrated support desk.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">2. Wallet Balances</h3>
              <p>
                Once funds are credited to your NGN wallet via BACH Payment Gateway, they remain permanently available for purchasing any products or virtual numbers across our platform.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

