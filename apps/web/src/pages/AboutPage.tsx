import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, Server, PhoneCall, CheckCircle2, Lock, ArrowRight, Globe2, Cpu, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12 pb-24 md:pb-12 text-oj-midnight dark:text-white">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-oj-muted dark:text-oj-dark-muted">
        <Link to="/" className="hover:text-oj-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-oj-midnight dark:text-white font-semibold">About Us</span>
      </div>

      {/* Hero Section */}
      <section className="rounded-3xl bg-gradient-to-tr from-oj-midnight via-oj-navy to-slate-900 border border-oj-navy p-6 sm:p-10 text-white relative overflow-hidden shadow-elevated">
        <div className="absolute top-0 right-0 w-80 h-80 bg-oj-primary/20 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-oj-cyan text-xs font-bold border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ojalogs Marketplace Technologies Ltd</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-4xl tracking-tight leading-tight">
            Next-Generation Digital Essentials & Telephony Marketplace
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Founded with a mission to eliminate friction in acquiring verified digital tools, eSIM data profiles, software licenses, and private telephony verification lines in Africa and across global digital economies.
          </p>
        </div>
      </section>

      {/* Corporate Identity & Platform Pillars */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-oj-primary">
            ENGINEERED FOR SCALE & TRUST
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-3xl">
            Our Architectural Foundations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base">
              Dedicated Logical Server API Network
            </h3>
            <p className="text-xs text-oj-muted dark:text-slate-300 leading-relaxed">
              Unlike legacy marketplaces that rely on unpredictable third-party sellers, Ojalogs links directly to 4 dedicated upstream Server clusters. Each category (VPNs/Proxies, Social Accounts, Software OS, and AI Tools) is automated with real-time stock verification and instant vault key generation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base">
              Division B: Telephony Gateway
            </h3>
            <p className="text-xs text-oj-muted dark:text-slate-300 leading-relaxed">
              Our automated telephony switch provisions genuine carrier-backed virtual phone numbers across 50+ countries. Featuring an active 15-minute countdown listener and an automated 100% wallet refund guarantee if no SMS arrives, customers never pay for failed verification attempts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base">
              AES-256 Vault Encryption & RLS
            </h3>
            <p className="text-xs text-oj-muted dark:text-slate-300 leading-relaxed">
              All delivered software licenses, activation tokens, and account keys are encrypted using AES-256 and protected by PostgreSQL Row-Level Security (RLS). Decryption only occurs securely within the authenticated customer&apos;s verified browser session.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base">
              BACH Payment Gateway Verification
            </h3>
            <p className="text-xs text-oj-muted dark:text-slate-300 leading-relaxed">
              Our integration with certified banking gateways enables instant dynamic bank transfer account generation and real-time NGN wallet crediting with multi-currency conversion to USD, EUR, and GBP.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="p-8 rounded-3xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border text-center space-y-4">
        <h2 className="font-heading font-black text-xl sm:text-2xl">
          Ready to experience frictionless digital commerce?
        </h2>
        <p className="text-xs text-oj-muted max-w-md mx-auto">
          Explore hundreds of verified digital essentials, developer licenses, and virtual numbers with zero password fatigue.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/shop"
            className="w-full sm:w-auto px-6 py-3 rounded-btn bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white text-xs font-bold shadow-glow-primary flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            <span>Explore Storefront</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/virtual-numbers"
            className="w-full sm:w-auto px-6 py-3 rounded-btn bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white text-xs font-bold transition-colors"
          >
            <span>Virtual Phone Numbers</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

