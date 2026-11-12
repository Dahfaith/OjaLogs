import React from 'react';
import {
  InstagramIcon,
  FacebookIcon,
  TwitterXIcon,
  TikTokIcon,
  GmailIcon
} from './BrandIcons';

export interface BrandConfig {
  key: string;
  platformName: string;
  gradientClass: string;
  accentColor: string;
  renderLogo: () => React.ReactNode;
}

// Crisp inline SVGs for all major digital services
const MastercardLogo = () => (
  <svg viewBox="0 0 36 24" className="w-10 h-7" fill="none">
    <circle cx="12" cy="12" r="10" fill="#EB001B" />
    <circle cx="24" cy="12" r="10" fill="#F79E1B" fillOpacity="0.95" />
    <path
      d="M18 5.673a9.96 9.96 0 0 1 3.6 6.327 9.96 9.96 0 0 1-3.6 6.327 9.96 9.96 0 0 1-3.6-6.327c0-2.43 0.88-4.66 2.34-6.327h1.26z"
      fill="#FF5F00"
    />
  </svg>
);

const VisaLogo = () => (
  <svg viewBox="0 0 36 14" className="w-10 h-5" fill="none">
    <text x="1" y="12" fill="#1A1F71" fontFamily="Impact, Arial Black, sans-serif" fontSize="13" fontStyle="italic" fontWeight="bold" letterSpacing="1.5">
      VISA
    </text>
  </svg>
);

const GitHubLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-slate-900">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const TelegramLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#0284c7]">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const ShieldVpnLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-emerald-600">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.1" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const ProxiesGlobeLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-indigo-600">
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const AiToolsLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-purple-600">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

const SimCardLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-blue-600">
    <rect width="18" height="18" x="3" y="3" rx="2" fill="currentColor" fillOpacity="0.1" />
    <path d="M7 7h.01M7 11h.01M7 15h.01M11 7h2M11 11h2M11 15h2M17 7h.01M17 11h.01M17 15h.01" />
  </svg>
);

const CreditCardLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-amber-600">
    <rect width="20" height="14" x="2" y="5" rx="2" fill="currentColor" fillOpacity="0.1" />
    <line x1="2" x2="22" y1="10" y2="10" />
    <circle cx="7" cy="15" r="1.5" fill="currentColor" />
  </svg>
);

const WindowsLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-blue-600">
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.949-1.8" />
  </svg>
);

const NetflixLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#E50914]">
    <path d="M5.398 0v24h3.996V9.89L14.606 24h3.996V0h-3.996v14.11L9.394 0z" />
  </svg>
);

const SpotifyLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#1DB954]">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

const CryptoLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-amber-500">
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.1" />
    <path d="M9.5 8h4a2 2 0 0 1 0 4h-4" />
    <path d="M9.5 12h4.5a2 2 0 0 1 0 4h-4.5" />
    <line x1="12" y1="6" x2="12" y2="8" />
    <line x1="12" y1="16" x2="12" y2="18" />
  </svg>
);

const CanvaLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <circle cx="12" cy="12" r="11" fill="url(#canva-grad)" />
    <text x="7" y="16" fill="white" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fontStyle="italic">C</text>
    <defs>
      <linearGradient id="canva-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00c4cc" />
        <stop offset="1" stopColor="#7d2ae8" />
      </linearGradient>
    </defs>
  </svg>
);

const DefaultOjaLogo = () => (
  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 flex items-center justify-center text-white font-black text-sm">
    <span className="text-amber-400">O</span>
  </div>
);

export function getBrandConfig(title: string = '', category: string = ''): BrandConfig {
  const t = (title + ' ' + category).toLowerCase();

  // 1. HIGH-PRIORITY: Mastercard, Visa, Prepaid Virtual Cards, Gift Cards
  // Must be checked first so that words like "Instant Delivery" do NOT falsely trigger Instagram
  if (
    t.includes('mastercard') ||
    t.includes('visa') ||
    t.includes('prepaid') ||
    t.includes('gift card') ||
    t.includes('vcc') ||
    t.includes('credit card') ||
    t.includes('debit card') ||
    t.includes('virtual card') ||
    /\b(card|cards|amex|vanilla)\b/i.test(t)
  ) {
    const isMastercard = t.includes('mastercard');
    const isVisa = t.includes('visa');
    return {
      key: 'cards',
      platformName: isMastercard ? 'Mastercard' : isVisa ? 'Visa Card' : 'Prepaid Gift Card',
      gradientClass: 'from-[#1a120b] via-[#2c1810] to-[#120a05]',
      accentColor: '#f59e0b',
      renderLogo: () => (isMastercard ? <MastercardLogo /> : isVisa ? <VisaLogo /> : <CreditCardLogo />)
    };
  }

  // 2. GitHub
  if (t.includes('github') || /\b(git)\b/i.test(t)) {
    return {
      key: 'github',
      platformName: 'GitHub',
      gradientClass: 'from-[#0f172a] via-[#1e293b] to-[#090d16]',
      accentColor: '#38bdf8',
      renderLogo: () => <GitHubLogo />
    };
  }

  // 3. X / Twitter
  if (
    t.includes('twitter') ||
    t.includes('aged x') ||
    t.includes('x.com') ||
    t.includes('x (twitter)') ||
    t.includes('twitter account') ||
    /\b(twitter|x account|twitter x)\b/i.test(t) ||
    /^\s*x\s+/i.test(t)
  ) {
    return {
      key: 'twitter',
      platformName: 'X / Twitter',
      gradientClass: 'from-[#0b0f19] via-[#111827] to-[#030712]',
      accentColor: '#38bdf8',
      renderLogo: () => <TwitterXIcon className="w-8 h-8 text-slate-950" />
    };
  }

  // 4. Instagram (STRICT: Never match bare 'insta' to prevent 'instant' collisions)
  if (
    t.includes('instagram') ||
    /\b(ig)\b/i.test(t) ||
    t.includes('aged creator') ||
    t.includes('russian instagram') ||
    t.includes('brazil instagram') ||
    t.includes('instagram account') ||
    t.includes('instagram followers') ||
    t.includes('instagram likes')
  ) {
    return {
      key: 'instagram',
      platformName: 'Instagram',
      gradientClass: 'from-[#4c1d95] via-[#a21caf] to-[#e11d48]',
      accentColor: '#f43f5e',
      renderLogo: () => <InstagramIcon className="w-8 h-8" />
    };
  }

  // 5. Facebook / Meta
  if (
    t.includes('facebook') ||
    t.includes('bm50') ||
    t.includes('business manager') ||
    t.includes('facebook account') ||
    t.includes('facebook page') ||
    /\b(fb|meta)\b/i.test(t)
  ) {
    return {
      key: 'facebook',
      platformName: 'Facebook',
      gradientClass: 'from-[#0c2340] via-[#1d4ed8] to-[#172554]',
      accentColor: '#3b82f6',
      renderLogo: () => <FacebookIcon className="w-8 h-8 text-[#1877f2]" />
    };
  }

  // 6. Telegram
  if (t.includes('telegram') || t.includes('t.me') || /\b(tg)\b/i.test(t)) {
    return {
      key: 'telegram',
      platformName: 'Telegram',
      gradientClass: 'from-[#03365c] via-[#0284c7] to-[#075985]',
      accentColor: '#38bdf8',
      renderLogo: () => <TelegramLogo />
    };
  }

  // 7. TikTok
  if (t.includes('tiktok') || t.includes('tik tok')) {
    return {
      key: 'tiktok',
      platformName: 'TikTok',
      gradientClass: 'from-[#09090b] via-[#18181b] to-[#020617]',
      accentColor: '#22d3ee',
      renderLogo: () => <TikTokIcon className="w-8 h-8 text-black" />
    };
  }

  // 8. Gmail / Google Workspace / YouTube
  if (
    t.includes('gmail') ||
    t.includes('google') ||
    t.includes('workspace') ||
    t.includes('gsuite') ||
    t.includes('gdrive') ||
    t.includes('youtube')
  ) {
    return {
      key: 'gmail',
      platformName: t.includes('youtube') ? 'YouTube' : 'Google / Gmail',
      gradientClass: 'from-[#1e293b] via-[#334155] to-[#0f172a]',
      accentColor: '#ea4335',
      renderLogo: () => <GmailIcon className="w-8 h-8" />
    };
  }

  // 9. VPN & Security
  if (
    t.includes('vpn') ||
    t.includes('nord') ||
    t.includes('surfshark') ||
    t.includes('expressvpn') ||
    t.includes('cyberghost') ||
    t.includes('ipvanish')
  ) {
    return {
      key: 'vpn',
      platformName: 'VPN & Security',
      gradientClass: 'from-[#022c22] via-[#065f46] to-[#064e3b]',
      accentColor: '#10b981',
      renderLogo: () => <ShieldVpnLogo />
    };
  }

  // 10. Proxies & Residential IPs
  if (
    t.includes('proxy') ||
    t.includes('proxies') ||
    t.includes('residential') ||
    t.includes('rotating ip') ||
    t.includes('rotating proxies') ||
    t.includes('socks5')
  ) {
    return {
      key: 'proxies',
      platformName: 'Residential Proxies',
      gradientClass: 'from-[#1e1b4b] via-[#312e81] to-[#0f172a]',
      accentColor: '#818cf8',
      renderLogo: () => <ProxiesGlobeLogo />
    };
  }

  // 11. eSIM & Roaming Data
  if (t.includes('esim') || t.includes('roaming') || /\b(sim)\b/i.test(t)) {
    return {
      key: 'esim',
      platformName: 'eSIM & Data',
      gradientClass: 'from-[#172554] via-[#1e40af] to-[#1e3a8a]',
      accentColor: '#60a5fa',
      renderLogo: () => <SimCardLogo />
    };
  }

  // 12. AI Tools & Subscriptions
  if (
    t.includes('chatgpt') ||
    t.includes('claude') ||
    t.includes('openai') ||
    t.includes('midjourney') ||
    t.includes('gemini') ||
    t.includes('anthropic') ||
    t.includes('perplexity') ||
    t.includes('copilot') ||
    t.includes('ai tool')
  ) {
    return {
      key: 'ai',
      platformName: 'AI Subscriptions',
      gradientClass: 'from-[#1f1d36] via-[#3f3b6c] to-[#141226]',
      accentColor: '#a855f7',
      renderLogo: () => <AiToolsLogo />
    };
  }

  // 13. Windows / Microsoft / Office
  if (
    t.includes('windows') ||
    t.includes('office 365') ||
    t.includes('office') ||
    t.includes('microsoft') ||
    t.includes('license key') ||
    t.includes('os key')
  ) {
    return {
      key: 'windows',
      platformName: 'Software & OS',
      gradientClass: 'from-[#082f49] via-[#0284c7] to-[#0f172a]',
      accentColor: '#38bdf8',
      renderLogo: () => <WindowsLogo />
    };
  }

  // 14. Crypto & Fintech (Binance, Bybit, Coinbase, CashApp, PayPal)
  if (
    t.includes('binance') ||
    t.includes('crypto') ||
    t.includes('bybit') ||
    t.includes('coinbase') ||
    t.includes('usdt') ||
    t.includes('cashapp') ||
    t.includes('paypal')
  ) {
    return {
      key: 'crypto',
      platformName: 'Crypto & Fintech',
      gradientClass: 'from-[#1c1917] via-[#292524] to-[#0c0a09]',
      accentColor: '#f59e0b',
      renderLogo: () => <CryptoLogo />
    };
  }

  // 15. Canva & Design
  if (t.includes('canva') || t.includes('adobe') || t.includes('photoshop')) {
    return {
      key: 'canva',
      platformName: 'Canva & Creative',
      gradientClass: 'from-[#042f2e] via-[#0f766e] to-[#115e59]',
      accentColor: '#00c4cc',
      renderLogo: () => <CanvaLogo />
    };
  }

  // 16. Netflix
  if (t.includes('netflix')) {
    return {
      key: 'netflix',
      platformName: 'Netflix',
      gradientClass: 'from-[#3f0713] via-[#881337] to-[#0f172a]',
      accentColor: '#ef4444',
      renderLogo: () => <NetflixLogo />
    };
  }

  // 17. Spotify
  if (t.includes('spotify')) {
    return {
      key: 'spotify',
      platformName: 'Spotify',
      gradientClass: 'from-[#022c22] via-[#14532d] to-[#064e3b]',
      accentColor: '#22c55e',
      renderLogo: () => <SpotifyLogo />
    };
  }

  // Default fallback
  return {
    key: 'general',
    platformName: category || 'Verified Digital Asset',
    gradientClass: 'from-oj-midnight via-oj-navy to-[#1e3a8a]',
    accentColor: '#0284c7',
    renderLogo: () => <DefaultOjaLogo />
  };
}

export interface BrandCoverBannerProps {
  product?: {
    title?: string;
    name?: string;
    category?: string;
    coverImage?: string;
  };
  title?: string;
  category?: string;
  className?: string;
  showSubtitle?: boolean;
}

export const BrandCoverBanner: React.FC<BrandCoverBannerProps> = ({
  product,
  title,
  category,
  className = 'h-44 sm:h-48',
  showSubtitle = true
}) => {
  const displayTitle = (title || product?.title || (product as any)?.name || 'Digital Account / Tool').trim();
  const displayCategory = category || product?.category || '';
  const brand = getBrandConfig(displayTitle, displayCategory);

  const isMini = className.includes('w-') && (className.includes('h-10') || className.includes('h-12') || className.includes('h-14') || className.includes('h-16') || className.includes('h-20'));

  if (isMini) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br ${brand.gradientClass} flex items-center justify-center select-none shrink-0 ${className}`}
      >
        <div className="w-8 h-8 rounded-xl bg-white shadow-md flex items-center justify-center p-1.5 border border-white/40">
          {brand.renderLogo()}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-br ${brand.gradientClass} flex flex-col items-center justify-between p-3 select-none ${className}`}
    >
      {/* Top Brand Tag Pill */}
      <div className="w-full flex items-center justify-between px-1 z-10 shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/20 dark:bg-black/40 backdrop-blur-md border border-white/15 text-white/90 text-[10px] font-semibold tracking-wide shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Ojalogs Verified</span>
        </div>
      </div>

      {/* Center Floating White Icon Squircle & Clean Brand Info */}
      <div className="flex flex-col items-center justify-center my-auto z-10">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center p-2.5 border border-white/50 transform transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-0.5">
          {brand.renderLogo()}
        </div>

        {/* Platform Name */}
        <span className="text-xs font-heading font-extrabold tracking-wider uppercase text-white mt-2 drop-shadow-sm">
          {brand.platformName}
        </span>

        {/* Clean Title */}
        {showSubtitle && (
          <p className="text-[11px] text-white/90 line-clamp-1 px-3 text-center mt-0.5 max-w-[240px] font-medium leading-tight drop-shadow-xs">
            {displayTitle.replace(/^["']+|["']+$/g, '')}
          </p>
        )}
      </div>

      {/* Sweet Bottom Ambient Glass Glow */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-44 h-12 bg-white/10 rounded-full blur-xl pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-20" />
    </div>
  );
};

