import React from 'react';

export const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" stroke="url(#ig-grad-icon)" strokeWidth="2" />
    <circle cx="12" cy="12" r="4.2" stroke="url(#ig-grad-icon)" strokeWidth="2" />
    <circle cx="17.5" cy="6.5" r="1.3" fill="url(#ig-grad-icon)" />
    <defs>
      <linearGradient id="ig-grad-icon" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f58529" />
        <stop offset="0.5" stopColor="#dd2a7b" />
        <stop offset="1" stopColor="#8134af" />
      </linearGradient>
    </defs>
  </svg>
);

export const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`${className} text-[#1877F2]`}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export const TwitterXIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`${className} text-black dark:text-white`}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`${className} text-black dark:text-white`}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

export const GmailIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none">
    <path fill="#4285F4" d="M1.636 20.999h3.819V11.73L0 7.64v11.724c0 .904.732 1.636 1.636 1.636z" />
    <path fill="#34A853" d="M18.545 20.999h3.819c.904 0 1.636-.732 1.636-1.636V7.64l-5.455 4.09v9.269z" />
    <path fill="#EA4335" d="M18.545 5.455V11.73L24 7.64 21.69 5.455c-.79-.594-1.89-.594-3.145 0z" />
    <path fill="#FBBC05" d="M5.455 5.455L0 7.64l5.455 4.09V5.455z" />
    <path fill="#EA4335" d="M5.455 5.455L12 10.364l6.545-4.909c-1.255-.594-2.355-.594-3.145 0L12 8l-3.4-2.545c-.79-.594-1.89-.594-3.145 0z" />
  </svg>
);


