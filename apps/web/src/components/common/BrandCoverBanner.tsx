
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

// =========================================================================
// 1. PAYMENT & GIFT CARDS VECTOR LOGOS
// =========================================================================

export const MastercardLogo = () => (
  <svg viewBox="0 0 36 24" className="w-10 h-7 shrink-0" fill="none">
    <circle cx="12" cy="12" r="10" fill="#EB001B" />
    <circle cx="24" cy="12" r="10" fill="#F79E1B" fillOpacity="0.95" />
    <path
      d="M18 5.673a9.96 9.96 0 0 1 3.6 6.327 9.96 9.96 0 0 1-3.6 6.327 9.96 9.96 0 0 1-3.6-6.327c0-2.43 0.88-4.66 2.34-6.327h1.26z"
      fill="#FF5F00"
    />
  </svg>
);

export const VisaLogo = () => (
  <svg viewBox="0 0 36 14" className="w-10 h-5 shrink-0" fill="none">
    <text x="1" y="12" fill="#1A1F71" fontFamily="Impact, Arial Black, sans-serif" fontSize="13" fontStyle="italic" fontWeight="bold" letterSpacing="1.5">
      VISA
    </text>
  </svg>
);

export const AmexLogo = () => (
  <svg viewBox="0 0 36 24" className="w-10 h-7 shrink-0" fill="none">
    <rect width="36" height="24" rx="3" fill="#002663" />
    <text x="3" y="16" fill="#FFFFFF" fontFamily="sans-serif" fontSize="10" fontWeight="900" letterSpacing="0.5">
      AMEX
    </text>
  </svg>
);

export const AmazonLogo = () => (
  <svg viewBox="0 0 36 20" className="w-10 h-6 shrink-0" fill="none">
    <text x="1" y="12" fill="#111827" fontFamily="sans-serif" fontSize="11" fontWeight="bold">
      amazon
    </text>
    {/* Iconic smile arrow */}
    <path d="M4 15c7 3.5 15 3.5 22 0" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" />
    <path d="M26 13l2 2.5-3 .5" fill="#FF9900" />
  </svg>
);

export const AppleLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-slate-900 shrink-0">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.61 1.35-.55.63-1.03 1.68-.9 2.7.99.08 2.02-.45 2.58-1.2z" />
  </svg>
);

export const GooglePlayLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <path d="M3.6 2.4C3.2 2.8 3 3.4 3 4.2v15.6c0 .8.2 1.4.6 1.8l.1.1 9.3-9.3v-.4L3.7 2.3l-.1.1z" fill="#00C3FF" />
    <path d="M16.1 15.2l-3.1-3.2v-.4l3.1-3.2.1.1 3.7 2.1c1.1.6 1.1 1.6 0 2.2l-3.8 2.4z" fill="#FFC400" />
    <path d="M13 12L3.6 21.6c.4.4 1 .4 1.8 0l10.8-6.4-3.2-3.2z" fill="#FF3A44" />
    <path d="M13 12l3.2-3.2L5.4 2.4C4.6 2 4 2 3.6 2.4L13 12z" fill="#00E676" />
  </svg>
);

export const SteamLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#171a21] shrink-0">
    <path d="M11.979 0C5.378 0 0 5.378 0 11.979c0 5.097 3.2 9.444 7.733 11.162l3.197-4.664a4.137 4.137 0 0 1-1.383-3.084c0-.236.02-.468.058-.694L5.3 12.394a1.868 1.868 0 0 0-.251.018C4.02 12.56 3.2 13.567 3.35 14.597a2.073 2.073 0 0 0 2.378 1.745c.27-.04.52-.14.737-.286l3.255 4.747A11.956 11.956 0 0 0 11.979 24c6.601 0 11.979-5.378 11.979-11.979S18.58 0 11.979 0zm-4.32 15.65a1.242 1.242 0 1 1 1.059-1.396 1.24 1.24 0 0 1-1.06 1.396zm9.215-5.308a3.731 3.731 0 1 1-3.73-3.731 3.73 3.73 0 0 1 3.73 3.731zm-6.218 0a2.487 2.487 0 1 0 2.487-2.487 2.49 2.49 0 0 0-2.487 2.487z" />
  </svg>
);

export const RazerGoldLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <circle cx="12" cy="12" r="10" fill="#00FF00" />
    <path d="M8 7h8v10H8z" fill="#0b0f0b" />
    <text x="7.5" y="16" fill="#00FF00" fontFamily="sans-serif" fontSize="10" fontWeight="900">
      R
    </text>
  </svg>
);

export const PlayStationLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#003791] shrink-0">
    <path d="M8.016 14.492c-.88-.415-1.92-.37-2.88.13-1.095.57-1.74 1.62-1.74 2.82 0 1.245.72 2.31 1.83 2.865.915.465 1.95.42 2.895-.12 1.05-.6 1.68-1.65 1.68-2.835 0-1.275-.72-2.37-1.785-2.86zm8.805-4.14c-1.335-.72-3.03-.66-4.44.15-1.71.975-2.73 2.76-2.73 4.77 0 2.055 1.14 3.87 2.88 4.785 1.44.75 3.12.675 4.53-.165 1.68-.99 2.67-2.76 2.67-4.77 0-2.07-1.125-3.87-2.91-4.77zM11.955.51C5.46.51.195 5.775.195 12.27c0 6.495 5.265 11.76 11.76 11.76s11.76-5.265 11.76-11.76c0-6.495-5.265-11.76-11.76-11.76z" />
  </svg>
);

export const XboxLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#107C10] shrink-0">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.82 4.68c1.32 1.38 2.25 3.09 2.7 4.95-.51-.39-1.23-.84-2.1-1.35-1.23-.72-2.61-1.47-3.99-2.19.45-.48.96-.96 1.5-1.38.63-.03 1.26-.03 1.89-.03zm-11.64 0c.63 0 1.26 0 1.89.03.54.42 1.05.9 1.5 1.38-1.38.72-2.76 1.47-3.99 2.19-.87.51-1.59.96-2.1 1.35.45-1.86 1.38-3.57 2.7-4.95zM12 6.96c1.62.9 3.24 1.8 4.74 2.73-1.62 1.77-3.33 3.66-4.74 5.61-1.41-1.95-3.12-3.84-4.74-5.61 1.5-.93 3.12-1.83 4.74-2.73z" />
  </svg>
);

export const RobloxLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-slate-900 shrink-0">
    <path d="M18.92 2.03L2.03 5.08 5.08 21.97 21.97 18.92 18.92 2.03zm-7.66 11.59l-2.07-.37.37-2.07 2.07.37-.37 2.07z" />
  </svg>
);

export const CreditCardLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-amber-600 shrink-0">
    <rect width="20" height="14" x="2" y="5" rx="2" fill="currentColor" fillOpacity="0.1" />
    <line x1="2" x2="22" y1="10" y2="10" />
    <circle cx="7" cy="15" r="1.5" fill="currentColor" />
  </svg>
);

export const PayPalLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <path d="M7.5 4h6.8c2.4 0 4.2 1.8 3.8 4.2-.4 2.4-2.2 4.2-4.6 4.2h-3L8.5 21H5.2L7.5 4z" fill="#003087" />
    <path d="M9.5 8h6.8c2.4 0 4.2 1.8 3.8 4.2-.4 2.4-2.2 4.2-4.6 4.2h-3L10.5 24H7.2L9.5 8z" fill="#0079C1" fillOpacity="0.85" />
  </svg>
);

// =========================================================================
// 2. EMAIL & MESSAGING LOGOS
// =========================================================================

export const OutlookLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4" />
    <path d="M2 7l10 7 10-7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    <circle cx="7" cy="12" r="3.5" fill="#FFFFFF" />
    <text x="5.2" y="14" fill="#0078D4" fontFamily="sans-serif" fontSize="6" fontWeight="bold">
      O
    </text>
  </svg>
);

export const YahooLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <rect width="24" height="24" rx="5" fill="#6001D2" />
    <text x="4" y="17" fill="#FFFFFF" fontFamily="sans-serif" fontSize="14" fontWeight="900" fontStyle="italic">
      Y!
    </text>
  </svg>
);

export const ProtonLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <rect width="24" height="24" rx="5" fill="#6D4AFF" />
    <path d="M7 10V8a5 5 0 0 1 10 0v2h1v9H6v-9h1zm3-2a2 2 0 1 1 4 0v2h-4V8z" fill="#FFFFFF" />
  </svg>
);

// =========================================================================
// 3. VIRTUAL NUMBERS & TELEPHONY
// =========================================================================

export const GoogleVoiceLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <path d="M20 10.5c0-4.7-3.8-8.5-8.5-8.5S3 5.8 3 10.5c0 2.2.8 4.2 2.2 5.7L4 21l5.2-1.2c1 .4 2.1.7 3.3.7 4.7 0 8.5-3.8 8.5-8.5z" fill="#34A853" />
    <path d="M8.5 7.5c.2-.5.5-.5.9-.5h1.2c.4 0 .8.3.9.7l.5 1.7c.1.4 0 .9-.3 1.1l-.8.8c.6 1.2 1.6 2.2 2.8 2.8l.8-.8c.3-.3.8-.4 1.1-.3l1.7.5c.4.1.7.5.7.9v1.2c0 .4-.1.7-.5.9-.5.2-1.3.4-2.2.4-3.5 0-6.4-2.9-6.4-6.4 0-.9.2-1.7.4-2.2z" fill="#FFFFFF" />
  </svg>
);

export const TextNowLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <rect width="24" height="24" rx="6" fill="#7B1FA2" />
    <text x="5" y="17" fill="#FF9800" fontFamily="Impact, sans-serif" fontSize="13" fontStyle="italic" fontWeight="bold">
      TN
    </text>
  </svg>
);

export const TalkatoneLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <circle cx="12" cy="12" r="11" fill="#0284C7" />
    <path d="M15 8c1.5 1.5 1.5 4 0 5.5M17 6c2.5 2.5 2.5 7 0 9.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 10a4 4 0 0 0 4 4l2-2c.3-.3.8-.4 1.2-.2l2.3.8c.5.2.8.7.8 1.2v1.5c0 .6-.5 1-1.1 1-6.1 0-11-4.9-11-11 0-.6.4-1.1 1-1.1H9c.5 0 1 .3 1.2.8l.8 2.3c.2.4.1.9-.2 1.2L8 10z" fill="#FFFFFF" />
  </svg>
);

export const WhatsAppLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <circle cx="12" cy="12" r="11" fill="#25D366" />
    <path
      fill="#FFFFFF"
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15c-.197.297-.767.966-.94 1.164c-.173.199-.347.223-.644.075c-.297-.15-1.255-.463-2.39-1.475c-.883-.788-1.48-1.761-1.653-2.059c-.173-.297-.018-.458.13-.606c.134-.133.298-.347.446-.52s.198-.298.298-.497c.099-.198.05-.371-.025-.52s-.669-1.612-.916-2.207c-.242-.579-.487-.5-.669-.51a13 13 0 0 0-.57-.01c-.198 0-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074s2.096 3.2 5.077 4.487c.709.306 1.262.489 1.694.625c.712.227 1.36.195 1.871.118c.571-.085 1.758-.719 2.006-1.413s.248-1.289.173-1.413c-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214l-3.741.982l.998-3.648l-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884c2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413"
    />
  </svg>
);

export const TelegramLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#0284c7] shrink-0">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

export const SimCardLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-blue-600 shrink-0">
    <rect width="18" height="18" x="3" y="3" rx="2" fill="currentColor" fillOpacity="0.1" />
    <path d="M7 7h.01M7 11h.01M7 15h.01M11 7h2M11 11h2M11 15h2M17 7h.01M17 11h.01M17 15h.01" />
  </svg>
);

// =========================================================================
// 4. AI & DEVELOPER LOGOS
// =========================================================================

export const OpenAiLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#10A37F] shrink-0">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 8.163a4.485 4.485 0 0 1 2.366-1.973v5.684a.8.8 0 0 0 .388.677l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 8.163zm16.598 2.545l-5.843-3.37v-2.33a.08.08 0 0 1 .033-.062l4.84-2.796a4.5 4.5 0 0 1 6.677 4.66l-.14-.085-4.787-2.76a.776.776 0 0 0-.78 0zm2.722 5.129a4.485 4.485 0 0 1-2.37 1.97v-5.683a.8.8 0 0 0-.388-.677l-5.816-3.358 2.02-1.168a.076.076 0 0 1 .071 0l4.83 2.789a4.504 4.504 0 0 1 1.653 6.127zM12.75 13.5l-2.6-1.5 2.6-1.5 2.6 1.5-2.6 1.5z" />
  </svg>
);

export const ClaudeLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <circle cx="12" cy="12" r="10" fill="#CC785C" />
    <path d="M12 4v16M4 12h16M6.34 6.34l11.32 11.32M6.34 17.66L17.66 6.34" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const MidjourneyLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <circle cx="12" cy="12" r="10" fill="#0E1B2A" />
    <path d="M7 16c2-4 5-6 7-7-1 3-1 6 0 7H7z" fill="#FFFFFF" />
  </svg>
);

export const GitHubLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-slate-900 shrink-0">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const WindowsLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#0078D4] shrink-0">
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.949-1.8" />
  </svg>
);

export const CanvaLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 shrink-0">
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

// =========================================================================
// 5. VPN & NETWORK SECURITY
// =========================================================================

export const ShieldVpnLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-emerald-600 shrink-0">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.1" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const ProxiesGlobeLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-indigo-600 shrink-0">
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// =========================================================================
// 6. STREAMING & ENTERTAINMENT
// =========================================================================

export const NetflixLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#E50914] shrink-0">
    <path d="M5.398 0v24h3.996V9.89L14.606 24h3.996V0h-3.996v14.11L9.394 0z" />
  </svg>
);

export const SpotifyLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#1DB954] shrink-0">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

export const YouTubeLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <rect width="24" height="17" x="0" y="3.5" rx="4" fill="#FF0000" />
    <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="#FFFFFF" />
  </svg>
);

// =========================================================================
// 7. SOCIAL MEDIA & OTHER PLATFORMS
// =========================================================================

export const ThreadsLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-black shrink-0">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098c1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015c-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164c1.43 1.783 3.631 2.698 6.54 2.717c2.623-.02 4.358-.631 5.8-2.045c1.647-1.613 1.618-3.593 1.09-4.798c-.31-.71-.873-1.3-1.634-1.75c-.192 1.352-.622 2.446-1.284 3.272c-.886 1.102-2.14 1.704-3.73 1.79c-1.202.065-2.361-.218-3.259-.801c-1.063-.689-1.685-1.74-1.752-2.964c-.065-1.19.408-2.285 1.33-3.082c.88-.76 2.119-1.207 3.583-1.291a14 14 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757c-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32l-1.757-1.18c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388q.163.07.321.142c1.49.7 2.58 1.761 3.154 3.07c.797 1.82.871 4.79-1.548 7.158c-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69q-.362 0-.739.021c-1.836.103-2.98.946-2.916 2.143c.067 1.256 1.452 1.839 2.784 1.767c1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221" />
  </svg>
);

export const SnapchatLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <rect width="24" height="24" rx="6" fill="#FFFC00" />
    <path
      fill="#000000"
      d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.343-.031.503a.62.62 0 0 0 .322.072c.241-.013.53-.096.831-.241a.81.81 0 0 1 .373-.084c.146 0 .289.023.409.072c.361.12.59.385.59.674c.013.361-.313.675-.975.939-.071.023-.169.061-.276.096c-.637.208-1.558.508-1.745 1.472-.089.46.126.834.636 1.114.773.424 1.761.82 2.457 1.465.466.432.81 1.002.81 1.722 0 .914-.582 1.637-1.353 2.158-.291.198-.588.384-.87.568-.375.249-.74.492-1.042.825-.39.431-.531 1.053-.44 1.602.046.282.179.57.42.868.514.633 1.393 1.716 1.393 2.946 0 1.25-.973 2.062-2.894 2.417-.674.124-1.398.187-2.138.187s-1.464-.063-2.138-.187c-1.921-.355-2.894-1.167-2.894-2.417 0-1.23.879-2.313 1.393-2.946.241-.298.374-.586.42-.868.091-.549-.05-1.171-.44-1.602-.302-.333-.667-.576-1.042-.825-.282-.184-.579-.37-.87-.568-.771-.521-1.353-1.244-1.353-2.158 0-.72.344-1.29.81-1.722.696-.645 1.684-1.041 2.457-1.465.51-.28.725-.654.636-1.114-.187-.964-1.108-1.264-1.745-1.472-.107-.035-.205-.073-.276-.096-.662-.264-.988-.578-.975-.939 0-.289.229-.554.59-.674.12-.049.263-.072.409-.072.135 0 .265.03.373.084.301.145.59.228.831.241a.62.62 0 0 0 .322-.072c-.009-.16-.019-.323-.031-.503l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.859 1.069 11.216.793 12.206.793Z"
    />
  </svg>
);

export const RedditLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <circle cx="12" cy="12" r="11" fill="#FF4500" />
    <path
      fill="#FFFFFF"
      d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.88-6.991 4.88-3.863 0-6.992-2.186-6.992-4.88 0-.183.015-.366.043-.52a1.856 1.856 0 0 1-1.01-1.614c0-.968.786-1.754 1.754-1.754.477 0 .898.182 1.206.491 1.225-.877 2.92-1.455 4.787-1.503l.913-4.276a.315.315 0 0 1 .376-.244l3.15.664a1.24 1.24 0 0 1 1.05-1.205zm-9.458 7.502c-.85 0-1.54.69-1.54 1.54 0 .85.69 1.54 1.54 1.54.85 0 1.54-.69 1.54-1.54 0-.85-.69-1.54-1.54-1.54zm9.435 0c-.85 0-1.54.69-1.54 1.54 0 .85.69 1.54 1.54 1.54.85 0 1.54-.69 1.54-1.54 0-.85-.69-1.54-1.54-1.54zm-8.318 4.793a.315.315 0 0 0-.443.084c-.752.983-1.954 1.616-3.315 1.67a.315.315 0 0 0-.304.398c.287 1.008 1.456 2.378 4.28 2.378 2.825 0 3.993-1.37 4.28-2.378a.315.315 0 0 0-.304-.398c-1.36-.054-2.563-.687-3.315-1.67a.315.315 0 0 0-.079-.084z"
    />
  </svg>
);

export const LinkedInLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <rect width="24" height="24" rx="4" fill="#0A66C2" />
    <path
      fill="#FFFFFF"
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564z"
    />
  </svg>
);

export const PinterestLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="none">
    <circle cx="12" cy="12" r="11" fill="#BD081C" />
    <path
      fill="#FFFFFF"
      d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.744-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"
    />
  </svg>
);

export const DiscordLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#5865F2] shrink-0">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export const CryptoLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-amber-500 shrink-0">
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.1" />
    <path d="M9.5 8h4a2 2 0 0 1 0 4h-4" />
    <path d="M9.5 12h4.5a2 2 0 0 1 0 4h-4.5" />
    <line x1="12" y1="6" x2="12" y2="8" />
    <line x1="12" y1="16" x2="12" y2="18" />
  </svg>
);

export const DefaultOjaLogo = () => (
  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center text-white font-black text-sm border border-emerald-500/30">
    <span className="text-emerald-400">O</span>
  </div>
);

// =========================================================================
// 8. ACCURATE PRODUCT IDENTIFIER & IMAGE MAPPING SYSTEM
// =========================================================================

/**
 * Strict priority brand matching:
 * 1. Checks explicit brand patterns in product Title first.
 * 2. If no title match, checks description and subcategory.
 * 3. Never allows a generic/imported category (e.g. 'Instagram') to override an explicit title (e.g. 'Mastercard').
 */
export function getBrandConfig(
  title: string = '',
  category: string = '',
  description: string = '',
  subcategory: string = ''
): BrandConfig {
  const t = (title || '').toLowerCase().trim();
  const d = (description || '').toLowerCase();
  const sub = (subcategory || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  // Helper tester for a given string
  const checkMatcher = (target: string): BrandConfig | null => {
    // -------------------------------------------------------------
    // PRIORITY 1: PAYMENT CARDS & FINANCIAL PRODUCTS
    // -------------------------------------------------------------
    // Must be evaluated first so words like "Instant Delivery" NEVER collide with "Instagram"
    if (
      target.includes('mastercard') ||
      target.includes('master card') ||
      /\b(mc prepaid)\b/i.test(target)
    ) {
      return {
        key: 'mastercard',
        platformName: 'Mastercard',
        gradientClass: 'from-[#140e0a] via-[#24150c] to-[#0d0704]',
        accentColor: '#f59e0b',
        renderLogo: () => <MastercardLogo />
      };
    }

    if (
      target.includes('visa') ||
      target.includes('visa card') ||
      /\b(vcc)\b/i.test(target)
    ) {
      return {
        key: 'visa',
        platformName: 'Visa Card',
        gradientClass: 'from-[#0a1128] via-[#0f1f4b] to-[#060b18]',
        accentColor: '#1d4ed8',
        renderLogo: () => <VisaLogo />
      };
    }

    if (target.includes('amex') || target.includes('american express')) {
      return {
        key: 'amex',
        platformName: 'American Express',
        gradientClass: 'from-[#00173d] via-[#002663] to-[#000f26]',
        accentColor: '#38bdf8',
        renderLogo: () => <AmexLogo />
      };
    }

    if (target.includes('vanilla visa') || target.includes('vanilla gift') || target.includes('vanilla card')) {
      return {
        key: 'vanilla',
        platformName: 'Vanilla Gift Card',
        gradientClass: 'from-[#1a140f] via-[#2e2118] to-[#120d09]',
        accentColor: '#f59e0b',
        renderLogo: () => <CreditCardLogo />
      };
    }

    if (target.includes('amazon') && (target.includes('gift') || target.includes('card') || target.includes('code') || target.includes('voucher') || target.includes('amzn'))) {
      return {
        key: 'amazon',
        platformName: 'Amazon Gift Card',
        gradientClass: 'from-[#131921] via-[#232f3e] to-[#0f141c]',
        accentColor: '#ff9900',
        renderLogo: () => <AmazonLogo />
      };
    }

    if (target.includes('apple gift') || target.includes('itunes') || target.includes('apple card') || target.includes('app store gift')) {
      return {
        key: 'apple',
        platformName: 'Apple Gift Card',
        gradientClass: 'from-[#1c1d1f] via-[#2d2e30] to-[#0e0e10]',
        accentColor: '#e2e8f0',
        renderLogo: () => <AppleLogo />
      };
    }

    if (target.includes('google play') || target.includes('play store') || target.includes('playstore')) {
      return {
        key: 'googleplay',
        platformName: 'Google Play',
        gradientClass: 'from-[#0f172a] via-[#1e293b] to-[#0a0f1d]',
        accentColor: '#00c3ff',
        renderLogo: () => <GooglePlayLogo />
      };
    }

    if (target.includes('steam') && (target.includes('gift') || target.includes('card') || target.includes('wallet') || target.includes('code') || target.includes('account') || target.includes('game') || /\bsteam\b/i.test(target))) {
      return {
        key: 'steam',
        platformName: 'Steam Gift Card',
        gradientClass: 'from-[#171a21] via-[#212b3b] to-[#0e121a]',
        accentColor: '#60a5fa',
        renderLogo: () => <SteamLogo />
      };
    }

    if (target.includes('razer') || target.includes('razer gold')) {
      return {
        key: 'razer',
        platformName: 'Razer Gold',
        gradientClass: 'from-[#090d07] via-[#12220e] to-[#050804]',
        accentColor: '#00ff00',
        renderLogo: () => <RazerGoldLogo />
      };
    }

    if (target.includes('playstation') || target.includes('psn') || target.includes('ps plus')) {
      return {
        key: 'playstation',
        platformName: 'PlayStation Store',
        gradientClass: 'from-[#001f5c] via-[#003791] to-[#001033]',
        accentColor: '#38bdf8',
        renderLogo: () => <PlayStationLogo />
      };
    }

    if (target.includes('xbox') || target.includes('game pass') || target.includes('xbox live')) {
      return {
        key: 'xbox',
        platformName: 'Xbox Game Pass',
        gradientClass: 'from-[#0a1a0d] via-[#107c10] to-[#061208]',
        accentColor: '#107c10',
        renderLogo: () => <XboxLogo />
      };
    }

    if (target.includes('roblox') || target.includes('robux')) {
      return {
        key: 'roblox',
        platformName: 'Roblox',
        gradientClass: 'from-[#171717] via-[#262626] to-[#0a0a0a]',
        accentColor: '#ef4444',
        renderLogo: () => <RobloxLogo />
      };
    }

    if (
      target.includes('prepaid') ||
      target.includes('gift card') ||
      target.includes('virtual card') ||
      target.includes('debit card') ||
      target.includes('credit card') ||
      /\b(giftcard|vcc)\b/i.test(target)
    ) {
      return {
        key: 'giftcard',
        platformName: 'Prepaid Gift Card',
        gradientClass: 'from-[#1a120b] via-[#2c1810] to-[#120a05]',
        accentColor: '#f59e0b',
        renderLogo: () => <CreditCardLogo />
      };
    }

    if (target.includes('paypal') || target.includes('cashapp')) {
      return {
        key: 'paypal',
        platformName: target.includes('cashapp') ? 'CashApp' : 'PayPal',
        gradientClass: 'from-[#0a1a3a] via-[#003087] to-[#051124]',
        accentColor: '#0079c1',
        renderLogo: () => <PayPalLogo />
      };
    }

    // -------------------------------------------------------------
    // PRIORITY 2: VIRTUAL NUMBERS & TELEPHONY
    // -------------------------------------------------------------
    if (target.includes('google voice') || target.includes('gvoice') || /\b(gv)\b/i.test(target)) {
      return {
        key: 'googlevoice',
        platformName: 'Google Voice',
        gradientClass: 'from-[#062c1b] via-[#0f5132] to-[#041a10]',
        accentColor: '#34a853',
        renderLogo: () => <GoogleVoiceLogo />
      };
    }

    if (target.includes('textnow') || target.includes('text now')) {
      return {
        key: 'textnow',
        platformName: 'TextNow',
        gradientClass: 'from-[#2d0a31] via-[#5c1363] to-[#1a051d]',
        accentColor: '#ff9800',
        renderLogo: () => <TextNowLogo />
      };
    }

    if (target.includes('talkatone')) {
      return {
        key: 'talkatone',
        platformName: 'Talkatone',
        gradientClass: 'from-[#082f49] via-[#0369a1] to-[#0c1e33]',
        accentColor: '#0284c7',
        renderLogo: () => <TalkatoneLogo />
      };
    }

    if (target.includes('whatsapp') || target.includes('wa business') || target.includes('wa account')) {
      return {
        key: 'whatsapp',
        platformName: 'WhatsApp',
        gradientClass: 'from-[#062419] via-[#128c7e] to-[#051c14]',
        accentColor: '#25d366',
        renderLogo: () => <WhatsAppLogo />
      };
    }

    if (target.includes('telegram') || target.includes('t.me') || /\b(tg)\b/i.test(target)) {
      return {
        key: 'telegram',
        platformName: 'Telegram',
        gradientClass: 'from-[#03365c] via-[#0284c7] to-[#075985]',
        accentColor: '#38bdf8',
        renderLogo: () => <TelegramLogo />
      };
    }

    if (target.includes('esim') || target.includes('roaming') || target.includes('data sim') || target.includes('travel data')) {
      return {
        key: 'esim',
        platformName: 'eSIM & Data',
        gradientClass: 'from-[#172554] via-[#1e40af] to-[#1e3a8a]',
        accentColor: '#60a5fa',
        renderLogo: () => <SimCardLogo />
      };
    }

    // -------------------------------------------------------------
    // PRIORITY 3: EMAIL SERVICES
    // -------------------------------------------------------------
    if (target.includes('gmail') || target.includes('google mail')) {
      return {
        key: 'gmail',
        platformName: 'Gmail',
        gradientClass: 'from-[#1e293b] via-[#334155] to-[#0f172a]',
        accentColor: '#ea4335',
        renderLogo: () => <GmailIcon className="w-8 h-8" />
      };
    }

    if (target.includes('outlook') || target.includes('hotmail')) {
      return {
        key: 'outlook',
        platformName: target.includes('hotmail') ? 'Hotmail' : 'Outlook',
        gradientClass: 'from-[#0b2545] via-[#0078d4] to-[#06172e]',
        accentColor: '#0078d4',
        renderLogo: () => <OutlookLogo />
      };
    }

    if (target.includes('yahoo') || target.includes('yahoomail')) {
      return {
        key: 'yahoo',
        platformName: 'Yahoo Mail',
        gradientClass: 'from-[#22073d] via-[#6001d2] to-[#140326]',
        accentColor: '#6001d2',
        renderLogo: () => <YahooLogo />
      };
    }

    if (target.includes('proton') || target.includes('protonmail')) {
      return {
        key: 'proton',
        platformName: 'ProtonMail',
        gradientClass: 'from-[#1c1236] via-[#6d4aff] to-[#100a20]',
        accentColor: '#6d4aff',
        renderLogo: () => <ProtonLogo />
      };
    }

    if (target.includes('firstmail') || target.includes('tempmail') || target.includes('webmail') || target.includes('mail.ru')) {
      return {
        key: 'webmail',
        platformName: target.includes('mail.ru') ? 'Mail.ru' : 'Webmail Service',
        gradientClass: 'from-[#172554] via-[#1e3a8a] to-[#0f172a]',
        accentColor: '#38bdf8',
        renderLogo: () => <OutlookLogo />
      };
    }

    // -------------------------------------------------------------
    // PRIORITY 4: AI & DEVELOPER TOOLS
    // -------------------------------------------------------------
    if (target.includes('chatgpt') || target.includes('chat gpt') || target.includes('openai') || target.includes('gpt-4') || target.includes('gpt 4') || target.includes('dall-e')) {
      return {
        key: 'chatgpt',
        platformName: 'ChatGPT / OpenAI',
        gradientClass: 'from-[#0b2420] via-[#10a37f] to-[#061614]',
        accentColor: '#10a37f',
        renderLogo: () => <OpenAiLogo />
      };
    }

    if (target.includes('claude') || target.includes('anthropic')) {
      return {
        key: 'claude',
        platformName: 'Claude Pro',
        gradientClass: 'from-[#26160c] via-[#cc785c] to-[#140a05]',
        accentColor: '#cc785c',
        renderLogo: () => <ClaudeLogo />
      };
    }

    if (target.includes('midjourney')) {
      return {
        key: 'midjourney',
        platformName: 'Midjourney',
        gradientClass: 'from-[#0a111a] via-[#0e1b2a] to-[#05080e]',
        accentColor: '#38bdf8',
        renderLogo: () => <MidjourneyLogo />
      };
    }

    if (target.includes('github') || /\b(git)\b/i.test(target)) {
      return {
        key: 'github',
        platformName: 'GitHub',
        gradientClass: 'from-[#0f172a] via-[#1e293b] to-[#090d16]',
        accentColor: '#38bdf8',
        renderLogo: () => <GitHubLogo />
      };
    }

    if (target.includes('windows') || target.includes('office 365') || target.includes('microsoft office') || target.includes('license key') || target.includes('os key')) {
      return {
        key: 'windows',
        platformName: 'Windows & Office',
        gradientClass: 'from-[#082f49] via-[#0284c7] to-[#0f172a]',
        accentColor: '#38bdf8',
        renderLogo: () => <WindowsLogo />
      };
    }

    if (target.includes('canva')) {
      return {
        key: 'canva',
        platformName: 'Canva Pro',
        gradientClass: 'from-[#042f2e] via-[#0f766e] to-[#115e59]',
        accentColor: '#00c4cc',
        renderLogo: () => <CanvaLogo />
      };
    }

    // -------------------------------------------------------------
    // PRIORITY 5: VPN & PROXIES
    // -------------------------------------------------------------
    if (
      target.includes('nordvpn') ||
      target.includes('expressvpn') ||
      target.includes('surfshark') ||
      target.includes('cyberghost') ||
      target.includes('windscribe') ||
      target.includes('ipvanish') ||
      /\b(vpn)\b/i.test(target)
    ) {
      return {
        key: 'vpn',
        platformName: 'VPN & Security',
        gradientClass: 'from-[#022c22] via-[#065f46] to-[#064e3b]',
        accentColor: '#10b981',
        renderLogo: () => <ShieldVpnLogo />
      };
    }

    if (
      target.includes('proxy') ||
      target.includes('proxies') ||
      target.includes('residential') ||
      target.includes('socks5') ||
      target.includes('rotating ip')
    ) {
      return {
        key: 'proxies',
        platformName: 'Residential Proxies',
        gradientClass: 'from-[#1e1b4b] via-[#312e81] to-[#0f172a]',
        accentColor: '#818cf8',
        renderLogo: () => <ProxiesGlobeLogo />
      };
    }

    // -------------------------------------------------------------
    // PRIORITY 6: STREAMING & MEDIA
    // -------------------------------------------------------------
    if (target.includes('netflix')) {
      return {
        key: 'netflix',
        platformName: 'Netflix',
        gradientClass: 'from-[#3f0713] via-[#881337] to-[#0f172a]',
        accentColor: '#ef4444',
        renderLogo: () => <NetflixLogo />
      };
    }

    if (target.includes('spotify')) {
      return {
        key: 'spotify',
        platformName: 'Spotify',
        gradientClass: 'from-[#022c22] via-[#14532d] to-[#064e3b]',
        accentColor: '#22c55e',
        renderLogo: () => <SpotifyLogo />
      };
    }

    if (target.includes('youtube') || target.includes('yt premium')) {
      return {
        key: 'youtube',
        platformName: 'YouTube',
        gradientClass: 'from-[#3a0606] via-[#7f1d1d] to-[#1c0404]',
        accentColor: '#ef4444',
        renderLogo: () => <YouTubeLogo />
      };
    }

    if (target.includes('discord')) {
      return {
        key: 'discord',
        platformName: 'Discord',
        gradientClass: 'from-[#171a40] via-[#5865f2] to-[#0d0f28]',
        accentColor: '#5865f2',
        renderLogo: () => <DiscordLogo />
      };
    }

    if (target.includes('binance') || target.includes('crypto') || target.includes('bybit') || target.includes('coinbase') || target.includes('usdt') || target.includes('bitcoin')) {
      return {
        key: 'crypto',
        platformName: 'Crypto & Fintech',
        gradientClass: 'from-[#1c1917] via-[#292524] to-[#0c0a09]',
        accentColor: '#f59e0b',
        renderLogo: () => <CryptoLogo />
      };
    }

    // -------------------------------------------------------------
    // PRIORITY 7: SOCIAL MEDIA PLATFORMS (STRICT REGEX & HIERARCHY)
    // -------------------------------------------------------------
    // RULE A: THREADS MUST PRECEDE INSTAGRAM!
    // Threads accounts almost always specify "Instagram", "Instagram Login", "Instagram linked",
    // or "2FA Instagram" because Threads authenticates through Meta's Instagram service.
    // ANY product mentioning "thread" or "threads" is categorized as Threads.
    if (
      /\b(threads?)\b/i.test(target) ||
      target.includes('thread')
    ) {
      return {
        key: 'threads',
        platformName: 'Threads',
        gradientClass: 'from-[#0a0a0a] via-[#171717] to-[#000000]',
        accentColor: '#ffffff',
        renderLogo: () => <ThreadsLogo />
      };
    }

    // RULE B: INSTAGRAM ACCOUNTS
    // Strictly requires explicit 'instagram' or standalone word '\big\b'
    // NEVER match bare substring 'insta' to prevent 'instant delivery' collisions!
    if (
      /\b(instagram|instagrams|aged\s*creator|ig\s*account|ig\s*accounts|\big\b)\b/i.test(target) ||
      target.includes('instagram account') ||
      target.includes('instagram followers') ||
      target.includes('russian instagram') ||
      target.includes('brazil instagram')
    ) {
      return {
        key: 'instagram',
        platformName: 'Instagram',
        gradientClass: 'from-[#4c1d95] via-[#a21caf] to-[#e11d48]',
        accentColor: '#f43f5e',
        renderLogo: () => <InstagramIcon className="w-8 h-8" />
      };
    }

    // RULE C: FACEBOOK ACCOUNTS & ASSETS
    if (
      /\b(facebook|facebooks|bm50|bm250|business\s*manager|facebook\s*account|facebook\s*accounts|fb\s*account|fb\s*accounts|\bfb\b)\b/i.test(target) ||
      target.includes('facebook') ||
      target.includes('bm50') ||
      target.includes('bm250') ||
      target.includes('business manager')
    ) {
      return {
        key: 'facebook',
        platformName: 'Facebook',
        gradientClass: 'from-[#0c2340] via-[#1d4ed8] to-[#172554]',
        accentColor: '#3b82f6',
        renderLogo: () => <FacebookIcon className="w-8 h-8 text-[#1877f2]" />
      };
    }

    // RULE D: TIKTOK
    if (
      /\b(tiktok|tiktoks|tik\s*tok)\b/i.test(target) ||
      target.includes('tiktok') ||
      target.includes('tik tok')
    ) {
      return {
        key: 'tiktok',
        platformName: 'TikTok',
        gradientClass: 'from-[#09090b] via-[#18181b] to-[#020617]',
        accentColor: '#22d3ee',
        renderLogo: () => <TikTokIcon className="w-8 h-8 text-black" />
      };
    }

    // RULE E: X / TWITTER
    if (
      /\b(twitter|twitters|aged\s*x|x\.com|x\s*\(twitter\)|twitter\s*account|twitter\s*accounts|x\s*account|x\s*accounts)\b/i.test(target) ||
      target.includes('twitter') ||
      target.includes('aged x') ||
      target.includes('x.com') ||
      target.includes('x (twitter)')
    ) {
      return {
        key: 'twitter',
        platformName: 'X / Twitter',
        gradientClass: 'from-[#0b0f19] via-[#111827] to-[#030712]',
        accentColor: '#38bdf8',
        renderLogo: () => <TwitterXIcon className="w-8 h-8 text-slate-950" />
      };
    }

    // RULE F: SNAPCHAT
    if (
      /\b(snapchat|snapchats|snap\s*account|snap\s*accounts|\bsnap\b)\b/i.test(target) ||
      target.includes('snapchat')
    ) {
      return {
        key: 'snapchat',
        platformName: 'Snapchat',
        gradientClass: 'from-[#2e2b05] via-[#4d4809] to-[#1c1a03]',
        accentColor: '#fffc00',
        renderLogo: () => <SnapchatLogo />
      };
    }

    // RULE G: REDDIT
    if (
      /\b(reddit|reddits|reddit\s*account|reddit\s*accounts|karma\s*account)\b/i.test(target) ||
      target.includes('reddit')
    ) {
      return {
        key: 'reddit',
        platformName: 'Reddit',
        gradientClass: 'from-[#2b0c03] via-[#ff4500] to-[#1a0701]',
        accentColor: '#ff4500',
        renderLogo: () => <RedditLogo />
      };
    }

    // RULE H: LINKEDIN
    if (
      /\b(linkedin|linkedins|linkedin\s*account|linkedin\s*accounts)\b/i.test(target) ||
      target.includes('linkedin')
    ) {
      return {
        key: 'linkedin',
        platformName: 'LinkedIn',
        gradientClass: 'from-[#001c3d] via-[#0a66c2] to-[#001026]',
        accentColor: '#0a66c2',
        renderLogo: () => <LinkedInLogo />
      };
    }

    // RULE I: PINTEREST
    if (
      /\b(pinterest|pinterests|pinterest\s*account|pinterest\s*accounts)\b/i.test(target) ||
      target.includes('pinterest')
    ) {
      return {
        key: 'pinterest',
        platformName: 'Pinterest',
        gradientClass: 'from-[#290005] via-[#bd081c] to-[#190003]',
        accentColor: '#bd081c',
        renderLogo: () => <PinterestLogo />
      };
    }

    return null;
  };

  // 1. PRIMARY: Match against Product Title
  const titleMatch = checkMatcher(t);
  if (titleMatch) return titleMatch;

  // 2. SECONDARY: Match against Description / Subcategory
  if (d) {
    const descMatch = checkMatcher(d);
    if (descMatch) return descMatch;
  }
  if (sub) {
    const subMatch = checkMatcher(sub);
    if (subMatch) return subMatch;
  }

  // 3. TERTIARY: Match against Validated Category
  if (cat) {
    const catMatch = checkMatcher(cat);
    if (catMatch) return catMatch;
  }

  // 4. NEUTRAL FALLBACK: High-end Ojalogs digital asset
  const cleanCatLabel = category && !category.toLowerCase().includes('server')
    ? category
    : 'Verified Digital Asset';

  return {
    key: 'general',
    platformName: cleanCatLabel,
    gradientClass: 'from-oj-midnight via-oj-navy to-[#1e3a8a]',
    accentColor: '#0284c7',
    renderLogo: () => <DefaultOjaLogo />
  };
}

// =========================================================================
// 9. BRAND COVER BANNER COMPONENT
// =========================================================================

export interface BrandCoverBannerProps {
  product?: {
    title?: string;
    name?: string;
    category?: string;
    description?: string;
    descriptionHtml?: string;
    summary?: string;
    subcategory?: string;
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
  const displayDesc = product?.description || product?.descriptionHtml || product?.summary || '';
  const displaySub = product?.subcategory || '';

  const brand = getBrandConfig(displayTitle, displayCategory, displayDesc, displaySub);

  const isMini = className.includes('w-') && (
    className.includes('h-10') ||
    className.includes('h-12') ||
    className.includes('h-14') ||
    className.includes('h-16') ||
    className.includes('h-20')
  );

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
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/30 dark:bg-black/50 backdrop-blur-md border border-white/15 text-white/90 text-[10px] font-semibold tracking-wide shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Ojalogs Verified</span>
        </div>
      </div>

      {/* Center Floating White Icon Squircle & Verified Brand Badge */}
      <div className="flex flex-col items-center justify-center my-auto z-10">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center p-2.5 border border-white/60 transform transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-0.5">
          {brand.renderLogo()}
        </div>

        {/* Real Verified Platform Name */}
        <span className="text-xs font-heading font-extrabold tracking-wider uppercase text-white mt-2 drop-shadow-sm">
          {brand.platformName}
        </span>

        {/* Clean Title Subtitle */}
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
