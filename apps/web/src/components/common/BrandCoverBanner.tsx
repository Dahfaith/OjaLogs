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

const AiToolsLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-teal-600">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

const SimCardLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-indigo-600">
    <rect width="18" height="18" x="3" y="3" rx="2" fill="currentColor" fillOpacity="0.1" />
    <path d="M7 7h.01M7 11h.01M7 15h.01M11 7h2M11 11h2M11 15h2M17 7h.01M17 11h.01M17 15h.01" />
  </svg>
);

const CreditCardLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-amber-600">
    <rect width="20" height="14" x="2" y="5" rx="2" fill="currentColor" fillOpacity="0.1" />
    <line x1="2" x2="22" y1="10" y2="10" />
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

const DefaultOjaLogo = () => (
  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 flex items-center justify-center text-white font-black text-sm">
    <span className="text-amber-400">O</span>
  </div>
);

export function getBrandConfig(title: string = '', category: string = ''): BrandConfig {
  const t = (title + ' ' + category).toLowerCase();

  // GitHub
  if (t.includes('github') || t.includes('git ')) {
    return {
      key: 'github',
      platformName: 'GitHub',
      gradientClass: 'from-[#0f172a] via-[#1e293b] to-[#090d16]',
      accentColor: '#38bdf8',
      renderLogo: () => <GitHubLogo />
    };
  }

  // X / Twitter
  if (t.includes('twitter') || t.includes(' x ') || t.startsWith('x ') || t.includes('aged x') || t.includes('x.com') || t.includes('x (twitter)')) {
    return {
      key: 'twitter',
      platformName: 'X / Twitter',
      gradientClass: 'from-[#0b132b] via-[#1c2541] to-[#090d16]',
      accentColor: '#38bdf8',
      renderLogo: () => <TwitterXIcon className="w-8 h-8 text-slate-950" />
    };
  }

  // Instagram
  if (t.includes('instagram') || t.includes('ig ') || t.includes('insta')) {
    return {
      key: 'instagram',
      platformName: 'Instagram',
      gradientClass: 'from-[#701a75] via-[#a21caf] to-[#be123c]',
      accentColor: '#f43f5e',
      renderLogo: () => <InstagramIcon className="w-8 h-8" />
    };
  }

  // Facebook / Meta
  if (t.includes('facebook') || t.includes('meta') || t.includes('bm50') || t.includes('business manager') || t.includes('fb ')) {
    return {
      key: 'facebook',
      platformName: 'Facebook',
      gradientClass: 'from-[#0f2756] via-[#1d4ed8] to-[#1e3a8a]',
      accentColor: '#3b82f6',
      renderLogo: () => <FacebookIcon className="w-8 h-8 text-[#1877f2]" />
    };
  }

  // Telegram
  if (t.includes('telegram') || t.includes('tg ') || t.startsWith('tg') || t.includes(' tg') || t.includes('t.me')) {
    return {
      key: 'telegram',
      platformName: 'Telegram',
      gradientClass: 'from-[#03365c] via-[#0284c7] to-[#0369a1]',
      accentColor: '#38bdf8',
      renderLogo: () => <TelegramLogo />
    };
  }

  // TikTok
  if (t.includes('tiktok') || t.includes('tik tok')) {
    return {
      key: 'tiktok',
      platformName: 'TikTok',
      gradientClass: 'from-[#0a0a0c] via-[#18181b] to-[#0f172a]',
      accentColor: '#22d3ee',
      renderLogo: () => <TikTokIcon className="w-8 h-8 text-black" />
    };
  }

  // Gmail / Google Workspace
  if (t.includes('gmail') || t.includes('google') || t.includes('workspace') || t.includes('gdrive')) {
    return {
      key: 'gmail',
      platformName: 'Google / Gmail',
      gradientClass: 'from-[#1e293b] via-[#334155] to-[#1e1b4b]',
      accentColor: '#ea4335',
      renderLogo: () => <GmailIcon className="w-8 h-8" />
    };
  }

  // VPN / Proxies
  if (t.includes('vpn') || t.includes('nord') || t.includes('surfshark') || t.includes('expressvpn') || t.includes('proxy') || t.includes('residential')) {
    return {
      key: 'vpn',
      platformName: 'VPN & Proxies',
      gradientClass: 'from-[#022c22] via-[#065f46] to-[#047857]',
      accentColor: '#10b981',
      renderLogo: () => <ShieldVpnLogo />
    };
  }

  // AI Tools
  if (t.includes('chatgpt') || t.includes('claude') || t.includes('openai') || t.includes('ai tool') || t.includes('anthropic') || t.includes('midjourney')) {
    return {
      key: 'ai',
      platformName: 'AI Subscriptions',
      gradientClass: 'from-[#1e1b4b] via-[#4338ca] to-[#312e81]',
      accentColor: '#a855f7',
      renderLogo: () => <AiToolsLogo />
    };
  }

  // eSIM
  if (t.includes('esim') || t.includes('sim ') || t.includes('roaming') || t.includes('data')) {
    return {
      key: 'esim',
      platformName: 'eSIM & Data',
      gradientClass: 'from-[#172554] via-[#1d4ed8] to-[#3b82f6]',
      accentColor: '#60a5fa',
      renderLogo: () => <SimCardLogo />
    };
  }

  // Cards / VCC
  if (t.includes('card') || t.includes('visa') || t.includes('mastercard') || t.includes('vcc')) {
    return {
      key: 'cards',
      platformName: 'Virtual Cards',
      gradientClass: 'from-[#451a03] via-[#78350f] to-[#312e81]',
      accentColor: '#f59e0b',
      renderLogo: () => <CreditCardLogo />
    };
  }

  // Windows / Office
  if (t.includes('windows') || t.includes('office') || t.includes('microsoft') || t.includes('license')) {
    return {
      key: 'windows',
      platformName: 'Software & OS',
      gradientClass: 'from-[#082f49] via-[#0284c7] to-[#0f172a]',
      accentColor: '#38bdf8',
      renderLogo: () => <WindowsLogo />
    };
  }

  // Netflix
  if (t.includes('netflix')) {
    return {
      key: 'netflix',
      platformName: 'Netflix',
      gradientClass: 'from-[#3f0713] via-[#881337] to-[#0f172a]',
      accentColor: '#ef4444',
      renderLogo: () => <NetflixLogo />
    };
  }

  // Spotify
  if (t.includes('spotify')) {
    return {
      key: 'spotify',
      platformName: 'Spotify',
      gradientClass: 'from-[#022c22] via-[#14532d] to-[#064e3b]',
      accentColor: '#22c55e',
      renderLogo: () => <SpotifyLogo />
    };
  }

  // Default
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

