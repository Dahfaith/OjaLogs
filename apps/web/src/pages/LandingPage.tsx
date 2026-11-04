import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  PhoneCall,
  KeyRound,
  Server,
  Users,
  ChevronDown,
  ArrowRight,
  LifeBuoy,
  Lock,
  CheckCircle2,
  Cpu,
  Layers,
  Globe2,
  Mail,
  Network,
  QrCode,
  Shield,
  Clock,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InstagramIcon, FacebookIcon, TwitterXIcon, TikTokIcon, GmailIcon } from '../components/common/BrandIcons';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const directoryCategories = [
    {
      name: 'Instagram',
      productsCount: 908,
      inStockCount: 907,
      icon: InstagramIcon,
      slug: 'social-media',
      description: 'Aged creator accounts, 2FA profiles & business pages'
    },
    {
      name: 'Facebook',
      productsCount: 633,
      inStockCount: 625,
      icon: FacebookIcon,
      slug: 'social-media',
      description: 'Agency Business Managers (BM50/BM250) & aged accounts'
    },
    {
      name: 'Twitter (X)',
      productsCount: 164,
      inStockCount: 158,
      icon: TwitterXIcon,
      slug: 'social-media',
      description: 'Phone-verified profiles with organic history'
    },
    {
      name: 'TikTok',
      productsCount: 232,
      inStockCount: 231,
      icon: TikTokIcon,
      slug: 'social-media',
      description: 'Creator marketplace & live-streaming enabled accounts'
    },
    {
      name: 'Gmail & US Emails',
      productsCount: 284,
      inStockCount: 284,
      icon: GmailIcon,
      slug: 'social-media',
      description: 'Verified recovery email accounts & Google Workspace'
    },
    {
      name: 'VPN Services',
      productsCount: 24,
      inStockCount: 24,
      icon: Shield,
      isLucide: true,
      color: 'text-orange-500',
      slug: 'vpn',
      description: 'NordVPN, Surfshark & ExpressVPN official vouchers'
    },
    {
      name: 'Proxies & Network IPs',
      productsCount: 156,
      inStockCount: 150,
      icon: Network,
      isLucide: true,
      color: 'text-indigo-500',
      slug: 'proxies',
      description: 'Clean rotating residential, mobile & datacenter proxies'
    },
    {
      name: 'eSIM Profiles & Data',
      productsCount: 85,
      inStockCount: 85,
      icon: QrCode,
      isLucide: true,
      color: 'text-emerald-500',
      slug: 'esim',
      description: 'Instant QR code travel profiles across 140+ countries'
    },
    {
      name: 'Virtual Phone Numbers',
      productsCount: 4210,
      inStockCount: 4180,
      icon: PhoneCall,
      isLucide: true,
      color: 'text-cyan-500',
      slug: 'virtual-numbers',
      isDivisionB: true,
      description: 'Private SMS verification numbers with real-time countdown'
    }
  ];

  const faqs = [
    {
      q: 'What is Ojalogs?',
      a: 'Ojalogs is a digital essentials and goods marketplace that offers verified digital products, accounts, eSIM profiles, proxies, and professional tools. All services are connected to high-performance dedicated server APIs with automated fulfillment and a verified NGN wallet.'
    },
    {
      q: 'How does the logical server network work?',
      a: 'Each service category is powered by its own dedicated Server API (Server 1 API for VPNs, eSIMs & Proxies; Server 2 API for Social Media Accounts & Cloud; Server 3 API for Developer Software; Server 4 API for AI Tools; and our Telephony SMS Gateway API). This guarantees 99.9% uptime, real-time stock sync, and instant delivery.'
    },
    {
      q: 'How do I fund my NGN wallet?',
      a: 'You can fund your wallet via our official BACH Payment Gateway integration. For each funding request, a safe, one-time dynamic bank transfer account or checkout link is provisioned. Funds credit your account automatically upon gateway verification.'
    },
    {
      q: 'How are digital accounts and goods delivered?',
      a: 'All digital accounts, software keys, and proxy credentials are encrypted with AES-256 and stored in your private dashboard vault. Instant automated delivery occurs within seconds of payment confirmation.'
    },
    {
      q: 'What if no SMS arrives for my virtual phone number?',
      a: 'Our smart telephony listener provides an active 15-minute countdown. If no SMS arrives from the provider during the allocation window, our system automatically releases the line and issues an instant 100% refund directly back to your NGN wallet.'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-oj-primary/10 via-oj-cyan/15 to-transparent blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-oj-primary/10 border border-oj-primary/20 text-oj-primary dark:bg-oj-primary/20 dark:text-oj-cyan text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Server API Architecture · Powered by BACH Gateway</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-oj-midnight dark:text-white tracking-tight leading-tight"
          >
            Digital Goods, Accounts & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-oj-primary via-blue-500 to-oj-cyan bg-clip-text text-transparent">
              eSIM & Proxy Marketplace
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg font-medium text-oj-midnight/90 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed"
          >
            A digital essentials and goods marketplace that offers verified digital products, accounts, eSIM profiles, proxies, and professional tools.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <Link
              to="/shop"
              className="w-full sm:w-auto px-6 py-3.5 rounded-btn bg-gradient-to-r from-oj-primary to-blue-600 hover:from-blue-600 hover:to-oj-primary text-white text-xs font-bold shadow-glow-primary flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-btn bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border text-oj-midnight dark:text-white text-xs font-bold hover:bg-oj-surface-alt dark:hover:bg-oj-dark-surface-alt transition-colors"
            >
              Open Free NGN Wallet
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Popular Service Categories Section (Exact Match to Desktop Screenshot 1) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center space-y-1 mb-8">
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-oj-midnight dark:text-white">
            Popular Service Categories
          </h2>
          <p className="text-xs text-oj-muted">
            Create an account to explore our complete catalog.
          </p>
        </div>

        {/* 4 Primary Hero Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: VPN Services */}
          <Link
            to="/shop"
            className="p-6 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft hover:shadow-elevated hover:border-oj-primary transition-all text-center flex flex-col items-center group"
          >
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Globe2 className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white mb-1">
              VPN Services
            </h3>
            <p className="text-xs text-oj-muted">
              Secure & anonymous access
            </p>
          </Link>

          {/* Card 2: Social Media Services */}
          <Link
            to="/shop"
            className="p-6 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft hover:shadow-elevated hover:border-oj-primary transition-all text-center flex flex-col items-center group"
          >
            <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white mb-1">
              Social Media Services
            </h3>
            <p className="text-xs text-oj-muted">
              Growth & engagement tools
            </p>
          </Link>

          {/* Card 3: Virtual Numbers */}
          <Link
            to="/virtual-numbers"
            className="p-6 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft hover:shadow-elevated hover:border-oj-primary transition-all text-center flex flex-col items-center group"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PhoneCall className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white mb-1">
              Virtual Numbers
            </h3>
            <p className="text-xs text-oj-muted">
              Global phone numbers
            </p>
          </Link>

          {/* Card 4: US Emails */}
          <Link
            to="/shop"
            className="p-6 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft hover:shadow-elevated hover:border-oj-primary transition-all text-center flex flex-col items-center group"
          >
            <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-extrabold text-base text-oj-midnight dark:text-white mb-1">
              US Emails
            </h3>
            <p className="text-xs text-oj-muted">
              Verified email accounts
            </p>
          </Link>
        </div>

        {/* 3 Trust Indicators Below Cards (Exact Match to Desktop Screenshot 1) */}
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 pt-8 pb-4 text-center">
          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-orange-600" />
            </div>
            <span className="font-heading font-bold text-xs text-oj-midnight dark:text-white">Fast Access</span>
            <span className="text-[11px] text-oj-muted">Get started quickly</span>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-heading font-bold text-xs text-oj-midnight dark:text-white">Secure & Private</span>
            <span className="text-[11px] text-oj-muted">Your data is safe</span>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <span className="font-heading font-bold text-xs text-oj-midnight dark:text-white">Dedicated Support</span>
            <span className="text-[11px] text-oj-muted">We're here to help</span>
          </div>
        </div>
      </section>

      {/* ALL DIRECTORY CATEGORIES (Exact Match to Desktop Screenshot 2) */}
      <section className="max-w-7xl mx-auto px-4 pt-4">
        <div className="text-center mb-8">
          <span className="text-xs font-extrabold uppercase tracking-widest text-orange-600 dark:text-orange-400">
            ALL DIRECTORY CATEGORIES
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {directoryCategories.map((cat, idx) => {
            const IconComponent = cat.icon as any;
            const targetUrl = cat.isDivisionB ? '/virtual-numbers' : '/shop';
            return (
              <Link
                key={idx}
                to={targetUrl}
                className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft hover:shadow-elevated hover:border-oj-primary transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-oj-surface-alt dark:bg-oj-dark-surface-alt border border-oj-border dark:border-oj-dark-border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <IconComponent className={`w-7 h-7 ${cat.color || ''}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-oj-midnight dark:text-white group-hover:text-oj-primary transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-oj-muted mt-0.5">
                    {cat.productsCount} products · <span className="font-semibold text-emerald-600">{cat.inStockCount} in stock</span>
                  </p>
                  <p className="text-[11px] text-oj-muted dark:text-oj-dark-muted truncate mt-1">
                    {cat.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Platform Excellence & Multi-Server API Architecture */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center space-y-1 mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-oj-primary">
            HIGH-PERFORMANCE INFRASTRUCTURE
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-oj-midnight dark:text-white">
            Dedicated Server API Network
          </h2>
          <p className="text-xs text-oj-muted max-w-lg mx-auto">
            Every service category is powered by its own dedicated upstream Server API to guarantee 99.9% inventory availability, instant key generation, and automated fulfillment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-3">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              Server 1 API
            </span>
            <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">
              Enterprise VPNs, Proxies & eSIMs
            </h3>
            <p className="text-xs text-oj-muted leading-relaxed">
              Direct API integrations for high-speed residential proxies, global travel eSIM profiles, and NordVPN/Surfshark enterprise keys.
            </p>
            <Link to="/shop" className="text-xs font-bold text-oj-primary hover:underline flex items-center gap-1">
              <span>View Server 1 Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-3">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Server 2 API
            </span>
            <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">
              Social Media Accounts & Cloud
            </h3>
            <p className="text-xs text-oj-muted leading-relaxed">
              Automated provisioning of aged Instagram profiles, Facebook BMs with 2FA, Twitter/X accounts, and AWS/DigitalOcean cloud credits.
            </p>
            <Link to="/shop" className="text-xs font-bold text-oj-primary hover:underline flex items-center gap-1">
              <span>View Server 2 Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-3">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              Server 3 API
            </span>
            <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">
              Developer Software & OS Licenses
            </h3>
            <p className="text-xs text-oj-muted leading-relaxed">
              Direct distributor server connection for Windows 11 Pro retail keys and JetBrains suite licenses bound to your accounts.
            </p>
            <Link to="/shop" className="text-xs font-bold text-oj-primary hover:underline flex items-center gap-1">
              <span>View Server 3 Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-3">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
              Server 4 API
            </span>
            <h3 className="font-heading font-bold text-base text-oj-midnight dark:text-white">
              AI Tools & Model Access
            </h3>
            <p className="text-xs text-oj-muted leading-relaxed">
              API vouchers for ChatGPT Plus, Claude Pro, and Midjourney Fast GPU hours with zero credentials shared.
            </p>
            <Link to="/shop" className="text-xs font-bold text-oj-primary hover:underline flex items-center gap-1">
              <span>View Server 4 Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow (Dark Banner) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="rounded-3xl bg-oj-midnight text-white p-6 sm:p-10 border border-oj-navy relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-oj-primary/20 blur-3xl rounded-full pointer-events-none" />

          <div className="text-center space-y-2 mb-10 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              SIMPLE THREE-STEP WORKFLOW
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl">
              How Ojalogs Works
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              A streamlined experience from browsing to accessing your digital goods.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded">
                01
              </span>
              <h3 className="font-heading font-bold text-base">1. Explore Products</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Browse by category or server tier. Compare verified prices and check real-time stock availability.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded">
                02
              </span>
              <h3 className="font-heading font-bold text-base">2. Complete Checkout</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Fund your wallet or pay instantly using BACH Payment Gateway in NGN with 100% bank-level verification.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded">
                03
              </span>
              <h3 className="font-heading font-bold text-base">3. Instant Automated Delivery</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Access your encrypted accounts, proxy details, or software keys directly in your dashboard vault or listen for SMS in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Accordion */}
      <section className="max-w-4xl mx-auto px-4 space-y-4">
        <div className="text-center space-y-1 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-oj-primary">
            CLEAR ANSWERS
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-oj-midnight dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-oj-muted">
            Common questions about Ojalogs marketplace, ordering, and fulfillment.
          </p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-heading font-bold text-xs sm:text-sm text-oj-midnight dark:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-oj-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pb-4 text-xs text-oj-muted dark:text-oj-dark-muted leading-relaxed border-t border-oj-border/50 dark:border-oj-dark-border/50 pt-2"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 border-t border-oj-border dark:border-oj-dark-border bg-white dark:bg-oj-dark-surface/50 pt-12 pb-24 md:pb-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-oj-midnight via-oj-navy to-oj-primary flex items-center justify-center text-white font-heading font-black">
                <span className="text-oj-cyan">O</span>
              </div>
              <span className="font-heading font-extrabold text-lg text-oj-midnight dark:text-white">
                Oja<span className="text-oj-primary">logs</span>
              </span>
            </div>
            <p className="text-oj-muted max-w-sm leading-relaxed">
              A digital essentials and goods marketplace that offers verified digital products, accounts, eSIM profiles, proxies, and professional tools.
            </p>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified & Protected Platform · Powered by BACH</span>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-oj-midnight dark:text-white mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-oj-muted">
              <li><Link to="/shop" className="hover:text-oj-primary">Marketplace Store</Link></li>
              <li><Link to="/shop" className="hover:text-oj-primary">Social Media Accounts</Link></li>
              <li><Link to="/shop" className="hover:text-oj-primary">eSIM Profiles & Data</Link></li>
              <li><Link to="/shop" className="hover:text-oj-primary">Residential Proxies</Link></li>
              <li><Link to="/virtual-numbers" className="hover:text-oj-primary">Virtual Phone Numbers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-oj-midnight dark:text-white mb-3">
              Developers & Support
            </h4>
            <ul className="space-y-2 text-oj-muted">
              <li><a href="#api" className="hover:text-oj-primary">Server API Documentation</a></li>
              <li><a href="#about" className="hover:text-oj-primary">About Ojalogs</a></li>
              <li><Link to="/dashboard" className="hover:text-oj-primary">Customer Portal</Link></li>
              <li><Link to="/wallet" className="hover:text-oj-primary">NGN Wallet Ledger</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-oj-midnight dark:text-white mb-3">
              Account & Legal
            </h4>
            <ul className="space-y-2 text-oj-muted">
              <li><Link to="/profile" className="hover:text-oj-primary">Terms of Service</Link></li>
              <li><Link to="/profile" className="hover:text-oj-primary">Privacy Policy</Link></li>
              <li><Link to="/profile" className="hover:text-oj-primary">Acceptable Use Policy</Link></li>
              <li><Link to="/profile" className="hover:text-oj-primary">Refund & Guarantee Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-oj-border dark:border-oj-dark-border text-center text-oj-muted text-[11px]">
          © {new Date().getFullYear()} Ojalogs Marketplace Technologies Ltd. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
