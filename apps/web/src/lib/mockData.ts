import { Product, CountryOption, ServiceOption, VirtualNumberSession, WalletState, LedgerTransaction, UserProfile, Order, AdminMetrics } from '@ojalogs/shared';

// Initial Mock User
export const initialMockUser: UserProfile = {
  id: 'usr_oj_001',
  name: 'Katie Mille',
  email: 'katie.mille@ojalogs.dev',
  initials: 'KM',
  role: 'customer',
  isVerified: true,
  acceptableUseAcceptedAt: '2026-10-15T09:30:00Z',
  preferences: {
    theme: 'light',
    hideWalletBalance: false,
    transactionAlerts: true,
    currency: 'NGN'
  }
};

// Initial Mock Products (Division A - 100% Authorized & Compliant)
export const initialMockProducts: Product[] = [
  // Server 1: Enterprise Security, VPNs, Proxies & eSIM
  {
    id: 'prod_esim_01',
    slug: 'global-travel-esim-10gb-5g',
    title: 'Global Travel eSIM 10GB High-Speed 5G/4G Data Profile (140+ Countries)',
    category: 'eSIM Profiles & Data',
    categoryId: 'esim',
    division: 'A',
    serverCluster: 'Server 1',
    priceNgn: 16500,
    inStock: true,
    stockCount: 74,
    rating: 5.0,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    summary: 'Instant QR code activation for seamless roaming across 140+ countries. Zero roaming bill shock.',
    descriptionHtml: 'High-speed local breakout connectivity. Works with all unlocked eSIM-compatible iPhones, Samsungs, and Pixels.',
    specifications: {
      title: 'Global Travel eSIM 10GB Data Profile',
      category: 'eSIM Profiles & Data',
      serverOrigin: 'Server 1 (Verified Enterprise Keys)',
      deliveryType: 'instant_automated',
      validityDuration: '30 Days after activation',
      fulfillmentSpeed: 'Instant Automated (Under 10s)',
      verificationStatus: '100% Direct Telco Partner Stock',
      stockUnits: 74,
      region: 'Global / 140+ Countries'
    },
    deliveryFormat: 'Instant QR Code & SM-DP+ Address',
    validityDuration: '30 Days',
    region: 'Global',
    featured: true
  },
  {
    id: 'prod_proxy_01',
    slug: 'premium-residential-rotating-proxies-5gb',
    title: 'Premium Residential Rotating Proxies (5GB High-Speed Bandwidth)',
    category: 'Proxies & Network IPs',
    categoryId: 'proxies',
    division: 'A',
    serverCluster: 'Server 1',
    priceNgn: 18500,
    inStock: true,
    stockCount: 95,
    rating: 4.9,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    summary: '99.9% uptime real residential IP pool. HTTP and SOCKS5 endpoints with sticky session support.',
    descriptionHtml: 'Clean IP pool across US, UK, Germany, and Nigeria. Ideal for web scraping, ad verification, and automation.',
    specifications: {
      title: 'Premium Residential Rotating Proxies 5GB',
      category: 'Proxies & Network IPs',
      serverOrigin: 'Server 1 (Verified Enterprise Keys)',
      deliveryType: 'instant_automated',
      validityDuration: '30 Days',
      fulfillmentSpeed: 'Instant Automated',
      verificationStatus: '100% Dedicated Pool',
      stockUnits: 95,
      region: 'Worldwide'
    },
    deliveryFormat: 'API Host:Port:User:Pass Access',
    validityDuration: '30 Days',
    region: 'Global',
    featured: true
  },
  {
    id: 'prod_vpn_01',
    slug: 'nordvpn-complete-1year-license',
    title: 'NordVPN Complete 1-Year Premium License Key',
    category: 'VPN Subscriptions',
    categoryId: 'vpn',
    division: 'A',
    serverCluster: 'Server 1',
    priceNgn: 18500,
    inStock: true,
    stockCount: 42,
    rating: 5.0,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    summary: 'Official redemption voucher code for 12 months unlimited VPN, Threat Protection & NordPass password manager.',
    descriptionHtml: 'Enjoy high-speed encrypted connectivity across up to 10 simultaneous devices. Protect your web traffic with next-gen AES-256 encryption, dedicated IP access, and ultra-fast 10Gbps servers worldwide.',
    specifications: {
      title: 'NordVPN Complete 1-Year Premium License Key',
      category: 'VPN Subscriptions',
      serverOrigin: 'Server 1 (Verified Enterprise Keys)',
      deliveryType: 'instant_automated',
      validityDuration: '365 Days',
      fulfillmentSpeed: 'Instant Automated (Under 10s)',
      verificationStatus: '100% Authorized Resale & Verified Stock',
      stockUnits: 42,
      region: 'Global / Worldwide'
    },
    deliveryFormat: 'Alphanumeric Redemption Voucher',
    validityDuration: '12 Months',
    region: 'Global',
    featured: true
  },
  {
    id: 'prod_vpn_02',
    slug: 'surfshark-one-ultimate-vpn',
    title: 'Surfshark One+ Ultimate VPN & Antivirus 1-Year Voucher',
    category: 'VPN Subscriptions',
    categoryId: 'vpn',
    division: 'A',
    serverCluster: 'Server 1',
    priceNgn: 14200,
    inStock: true,
    stockCount: 88,
    rating: 4.9,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=600&q=80',
    summary: 'Unlimited devices with antivirus protection, webcam security, and identity theft alerts.',
    descriptionHtml: 'Includes full suite access: VPN, Search, Alert, and Antivirus. CleanWeb ad-blocker integrated.',
    specifications: {
      title: 'Surfshark One+ Ultimate VPN Voucher',
      category: 'VPN Subscriptions',
      serverOrigin: 'Server 1 (Verified Enterprise Keys)',
      deliveryType: 'instant_automated',
      validityDuration: '365 Days',
      fulfillmentSpeed: 'Instant Automated (Under 10s)',
      verificationStatus: '100% Authorized Resale & Verified Stock',
      stockUnits: 88,
      region: 'Global / Worldwide'
    },
    deliveryFormat: 'Instant Digital Key',
    validityDuration: '12 Months',
    region: 'Global'
  },
  {
    id: 'prod_vpn_03',
    slug: 'expressvpn-trusted-server-voucher',
    title: 'ExpressVPN High-Speed 6-Month Voucher Code',
    category: 'VPN Subscriptions',
    categoryId: 'vpn',
    division: 'A',
    serverCluster: 'Server 1',
    priceNgn: 24500,
    inStock: true,
    stockCount: 19,
    rating: 5.0,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    summary: 'Proprietary Lightway protocol for unmatched streaming and low-latency gaming across 105 countries.',
    descriptionHtml: 'Redeem directly on ExpressVPN.com for 6 months of uninterrupted ultra-fast encrypted browsing.',
    specifications: {
      title: 'ExpressVPN High-Speed 6-Month Voucher',
      category: 'VPN Subscriptions',
      serverOrigin: 'Server 1 (Verified Enterprise Keys)',
      deliveryType: 'instant_automated',
      validityDuration: '180 Days',
      fulfillmentSpeed: 'Instant Automated (Under 10s)',
      verificationStatus: '100% Authorized Resale & Verified Stock',
      stockUnits: 19,
      region: 'Global / Worldwide'
    },
    deliveryFormat: 'Official Activation Voucher',
    validityDuration: '6 Months',
    region: 'Global'
  },

  // Server 2: Verified Social Media Accounts & Cloud Infrastructure
  {
    id: 'prod_social_01',
    slug: 'instagram-aged-verified-profile-2fa',
    title: 'Instagram Aged Creator Profile (2019-2022 Established with 2FA)',
    category: 'Social Media Accounts',
    categoryId: 'social-media',
    division: 'A',
    serverCluster: 'Server 2',
    priceNgn: 14500,
    inStock: true,
    stockCount: 140,
    rating: 5.0,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80',
    summary: 'Aged account with high trust score, verified email linkage, full cookies and 2FA secret key.',
    descriptionHtml: 'High-reputation profile configured for business outreach, marketing, and creators. Includes original creation verification details.',
    specifications: {
      title: 'Instagram Aged Creator Profile with 2FA',
      category: 'Social Media Accounts',
      serverOrigin: 'Server 2 (Verified Accounts & Cloud)',
      deliveryType: 'instant_automated',
      validityDuration: 'Lifetime Binding',
      fulfillmentSpeed: 'Instant Automated (Under 10s)',
      verificationStatus: '100% Verified Stock & Health Checked',
      stockUnits: 140,
      region: 'Global / Worldwide'
    },
    deliveryFormat: 'Encrypted Vault Credentials & 2FA Key',
    validityDuration: 'Lifetime',
    region: 'Global',
    featured: true
  },
  {
    id: 'prod_social_02',
    slug: 'facebook-agency-business-manager-unlimited',
    title: 'Facebook Agency Business Manager (BM50 / Unlimited Daily Spend Limit)',
    category: 'Social Media Accounts',
    categoryId: 'social-media',
    division: 'A',
    serverCluster: 'Server 2',
    priceNgn: 22000,
    inStock: true,
    stockCount: 85,
    rating: 4.9,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?auto=format&fit=crop&w=600&q=80',
    summary: 'High-limit advertising container ready for immediate campaigns with zero initial spend restrictions.',
    descriptionHtml: 'Includes invitation link, admin handover guidelines, and high-trust status for smooth ad approval.',
    specifications: {
      title: 'Facebook Agency Business Manager BM50',
      category: 'Social Media Accounts',
      serverOrigin: 'Server 2 (Verified Accounts & Cloud)',
      deliveryType: 'instant_automated',
      validityDuration: 'Permanent Access',
      fulfillmentSpeed: 'Instant Automated',
      verificationStatus: '100% Authorized Business Agency Asset',
      stockUnits: 85,
      region: 'Global'
    },
    deliveryFormat: 'Secure Admin Handover Link',
    validityDuration: 'Permanent',
    region: 'Global',
    featured: true
  },
  {
    id: 'prod_social_03',
    slug: 'twitter-x-aged-profile-phone-verified',
    title: 'X (Twitter) Aged Account (2018-2021 Creation, Verified Phone Binding)',
    category: 'Social Media Accounts',
    categoryId: 'social-media',
    division: 'A',
    serverCluster: 'Server 2',
    priceNgn: 12800,
    inStock: true,
    stockCount: 62,
    rating: 4.8,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=600&q=80',
    summary: 'Clean posting history, warmed-up algorithmic activity, and 2FA authentication key included.',
    descriptionHtml: 'Ideal for Web3, tech, and marketing accounts seeking immediate organic reach without sandbox limitations.',
    specifications: {
      title: 'X / Twitter Aged Verified Profile',
      category: 'Social Media Accounts',
      serverOrigin: 'Server 2 (Verified Accounts & Cloud)',
      deliveryType: 'instant_automated',
      validityDuration: 'Lifetime',
      fulfillmentSpeed: 'Instant Automated',
      verificationStatus: '100% Verified Stock',
      stockUnits: 62,
      region: 'Global'
    },
    deliveryFormat: 'User:Pass:AuthToken:2FA',
    validityDuration: 'Lifetime',
    region: 'Global'
  },
  {
    id: 'prod_cloud_01',
    slug: 'aws-cloud-credits-100-voucher',
    title: 'AWS Cloud Infrastructure $100 Promotional Credit Voucher',
    category: 'Cloud & Domain Hosting',
    categoryId: 'cloud-hosting',
    division: 'A',
    serverCluster: 'Server 2',
    priceNgn: 45000,
    inStock: true,
    stockCount: 35,
    rating: 4.8,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    summary: 'Legitimate promotional credit code applicable to EC2, S3, RDS, Lambda, and CloudFront billings.',
    descriptionHtml: 'Direct credit application for any valid AWS account. Valid for 12 months after redemption.',
    specifications: {
      title: 'AWS Cloud Infrastructure $100 Promotional Credit',
      category: 'Cloud & Domain Hosting',
      serverOrigin: 'Server 2 (High-Volume Cloud)',
      deliveryType: 'instant_automated',
      validityDuration: '365 Days',
      fulfillmentSpeed: 'Instant Automated',
      verificationStatus: '100% Verified Developer Partner Stock',
      stockUnits: 35,
      region: 'Global / Multi-region'
    },
    deliveryFormat: 'Promo Voucher Code',
    validityDuration: '12 Months',
    region: 'Global',
    featured: true
  },
  {
    id: 'prod_cloud_02',
    slug: 'digitalocean-droplets-credit-voucher',
    title: 'DigitalOcean $100 Developer Cloud Credit Voucher',
    category: 'Cloud & Domain Hosting',
    categoryId: 'cloud-hosting',
    division: 'A',
    serverCluster: 'Server 2',
    priceNgn: 28000,
    inStock: true,
    stockCount: 50,
    rating: 4.9,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    summary: 'Deploy droplets, managed Kubernetes, and PostgreSQL clusters with zero upfront friction.',
    descriptionHtml: 'Official promotional token for new or qualified developer accounts. Instant top-up to team balance.',
    specifications: {
      title: 'DigitalOcean $100 Developer Cloud Credit',
      category: 'Cloud & Domain Hosting',
      serverOrigin: 'Server 2 (High-Volume Cloud)',
      deliveryType: 'instant_automated',
      validityDuration: '60 Days Active',
      fulfillmentSpeed: 'Instant Automated',
      verificationStatus: 'Authorized Reseller Stock',
      stockUnits: 50,
      region: 'Global'
    },
    deliveryFormat: 'Promotional Promo Key',
    validityDuration: '60 Days',
    region: 'Global'
  },

  // Server 3: Developer & Operating System Licenses
  {
    id: 'prod_soft_01',
    slug: 'windows-11-pro-retail-license',
    title: 'Microsoft Windows 11 Pro Genuine Retail Digital License Key',
    category: 'Software Licenses & Keys',
    categoryId: 'software',
    division: 'A',
    serverCluster: 'Server 3',
    priceNgn: 8500,
    inStock: true,
    stockCount: 120,
    rating: 5.0,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=600&q=80',
    summary: 'Lifetime binding 25-character digital product key for 1 PC with BitLocker and remote desktop support.',
    descriptionHtml: 'Activates online through official Microsoft servers. Supports multi-language and clean re-installations.',
    specifications: {
      title: 'Windows 11 Pro Genuine Retail License',
      category: 'Software Licenses & Keys',
      serverOrigin: 'Server 3 (Developer & Systems)',
      deliveryType: 'instant_automated',
      validityDuration: 'Lifetime Activation',
      fulfillmentSpeed: 'Instant Automated (Under 5s)',
      verificationStatus: 'Microsoft Authorized Distributor Inventory',
      stockUnits: 120,
      region: 'Worldwide / Multi-Language'
    },
    deliveryFormat: '25-Digit Retail License Key',
    validityDuration: 'Lifetime',
    region: 'Global',
    featured: true
  },
  {
    id: 'prod_soft_02',
    slug: 'jetbrains-all-products-pack-1year',
    title: 'JetBrains All Products Pack 1-Year Educational / Dev License',
    category: 'Software Licenses & Keys',
    categoryId: 'software',
    division: 'A',
    serverCluster: 'Server 3',
    priceNgn: 32000,
    inStock: true,
    stockCount: 16,
    rating: 5.0,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    summary: 'Full access to IntelliJ IDEA Ultimate, WebStorm, PyCharm, CLion, GoLand, Rider and DataGrip.',
    descriptionHtml: 'Redeem code delivered instantly. Sync directly with your existing JetBrains Account for 12 months.',
    specifications: {
      title: 'JetBrains All Products Pack 1-Year License',
      category: 'Software Licenses & Keys',
      serverOrigin: 'Server 3 (Developer & Systems)',
      deliveryType: 'instant_automated',
      validityDuration: '365 Days',
      fulfillmentSpeed: 'Instant Automated',
      verificationStatus: '100% Authorized Education/Dev Resale',
      stockUnits: 16,
      region: 'Global'
    },
    deliveryFormat: 'Redemption Code',
    validityDuration: '1 Year',
    region: 'Global'
  },

  // Server 4: AI Tools & APIs
  {
    id: 'prod_ai_01',
    slug: 'chatgpt-plus-official-subscription-voucher',
    title: 'OpenAI ChatGPT Plus 1-Month Official Subscription Voucher',
    category: 'AI Subscriptions & APIs',
    categoryId: 'ai-tools',
    division: 'A',
    serverCluster: 'Server 4',
    priceNgn: 31500,
    inStock: true,
    stockCount: 65,
    rating: 5.0,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
    summary: 'Redeemable code granting 30 days of GPT-4o, Canvas, advanced voice mode, and DALL-E 3 image generation.',
    descriptionHtml: 'Apply voucher code directly to your personal OpenAI account. Zero credentials exchanged; 100% compliant with OpenAI Terms of Service.',
    specifications: {
      title: 'ChatGPT Plus 1-Month Official Subscription Voucher',
      category: 'AI Subscriptions & APIs',
      serverOrigin: 'Server 4 (AI Tool Hub)',
      deliveryType: 'instant_automated',
      validityDuration: '30 Days',
      fulfillmentSpeed: 'Instant Automated',
      verificationStatus: 'Authorized Prepaid Resale Voucher',
      stockUnits: 65,
      region: 'Global'
    },
    deliveryFormat: 'Official Gift / Voucher Code',
    validityDuration: '1 Month',
    region: 'Global',
    featured: true
  },
  {
    id: 'prod_ai_02',
    slug: 'claude-pro-anthropic-voucher',
    title: 'Anthropic Claude Pro 1-Month Access Pass Voucher',
    category: 'AI Subscriptions & APIs',
    categoryId: 'ai-tools',
    division: 'A',
    serverCluster: 'Server 4',
    priceNgn: 31000,
    inStock: true,
    stockCount: 40,
    rating: 4.9,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80',
    summary: 'Priority access to Claude 3.5 Sonnet, 5x more usage allowance, and early access to Artifacts.',
    descriptionHtml: 'Redeem code applied directly on claude.ai. No account sharing; user connects their own verified email.',
    specifications: {
      title: 'Anthropic Claude Pro 1-Month Access Pass',
      category: 'AI Subscriptions & APIs',
      serverOrigin: 'Server 4 (AI Tool Hub)',
      deliveryType: 'instant_automated',
      validityDuration: '30 Days',
      fulfillmentSpeed: 'Instant Automated',
      verificationStatus: '100% Verified Stock',
      stockUnits: 40,
      region: 'Global'
    },
    deliveryFormat: 'Prepaid Digital Voucher',
    validityDuration: '1 Month',
    region: 'Global'
  },
  {
    id: 'prod_ai_03',
    slug: 'midjourney-standard-plan-key',
    title: 'Midjourney v6 Standard Plan 1-Month Subscription Key',
    category: 'AI Subscriptions & APIs',
    categoryId: 'ai-tools',
    division: 'A',
    serverCluster: 'Server 4',
    priceNgn: 42000,
    inStock: false,
    stockCount: 0,
    rating: 4.7,
    verifiedResale: true,
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    summary: '15 hours of Fast GPU time, unlimited Relaxed GPU generations, and commercial usage rights.',
    descriptionHtml: 'Official redemption key. Apply directly to your linked Discord profile.',
    specifications: {
      title: 'Midjourney Standard Plan Key',
      category: 'AI Subscriptions & APIs',
      serverOrigin: 'Server 4 (AI Tool Hub)',
      deliveryType: 'instant_automated',
      validityDuration: '30 Days',
      fulfillmentSpeed: 'Instant Automated',
      verificationStatus: 'Authorized Digital Voucher',
      stockUnits: 0,
      region: 'Global'
    },
    deliveryFormat: 'Digital Voucher Key',
    validityDuration: '1 Month',
    region: 'Global'
  }
];

// Division B: Virtual Phone Numbers Countries & Services
export const mockCountries: CountryOption[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', availableNumbers: 4210 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', availableNumbers: 1850 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', availableNumbers: 940 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', availableNumbers: 1120 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', availableNumbers: 860 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', availableNumbers: 730 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', availableNumbers: 540 }
];

export const mockServices: ServiceOption[] = [
  { id: 'whatsapp', name: 'WhatsApp Business / Messenger', category: 'Messaging', icon: 'MessageCircle', priceNgn: 1450, successRate: 98.4, popular: true },
  { id: 'telegram', name: 'Telegram Messenger', category: 'Messaging', icon: 'Send', priceNgn: 1200, successRate: 99.1, popular: true },
  { id: 'google', name: 'Google / Gmail Workspace', category: 'Email & Cloud', icon: 'Mail', priceNgn: 1100, successRate: 97.5, popular: true },
  { id: 'openai', name: 'OpenAI / ChatGPT Verification', category: 'AI Tools', icon: 'Cpu', priceNgn: 1650, successRate: 96.8, popular: true },
  { id: 'claude', name: 'Anthropic Claude AI', category: 'AI Tools', icon: 'Bot', priceNgn: 1750, successRate: 95.2 },
  { id: 'microsoft', name: 'Microsoft / Outlook / Azure', category: 'Cloud', icon: 'Cloud', priceNgn: 980, successRate: 98.0 },
  { id: 'apple', name: 'Apple ID / iCloud', category: 'Identity', icon: 'Smartphone', priceNgn: 2100, successRate: 94.6 },
  { id: 'discord', name: 'Discord Community Verification', category: 'Social', icon: 'Users', priceNgn: 850, successRate: 99.3 },
  { id: 'twitter', name: 'X / Twitter Verification', category: 'Social', icon: 'AtSign', priceNgn: 1350, successRate: 96.0 }
];

// Active mock number session
export const initialMockVirtualNumber: VirtualNumberSession = {
  id: 'num_ses_7749',
  reference: 'req_num_882914',
  country: mockCountries[0], // US
  service: mockServices[0], // WhatsApp
  phoneNumber: '+1 (415) 890-4421',
  rentalType: 'one_time_sms',
  status: 'active',
  timeRemainingSeconds: 780, // 13 mins left
  expiresAt: new Date(Date.now() + 780 * 1000).toISOString(),
  priceNgn: 1450,
  canCancel: true,
  canRenew: false,
  messages: []
};

// Initial Wallet State (Production Default: 0)
export const initialMockWallet: WalletState = {
  balanceNgn: 0.00,
  currency: 'NGN',
  isLocked: false,
  pendingDeposits: 0,
  lifetimePurchases: 0,
  monthlySpendNgn: 0.00
};

// Initial Immutable Ledger Transactions
export const initialMockLedger: LedgerTransaction[] = [];

// Initial Mock Orders (Production Default: 0)
export const initialMockOrders: Order[] = [];

// Initial Admin Metrics
export const mockAdminMetrics: AdminMetrics = {
  totalRevenueNgn: 8645200.00,
  walletLiabilitiesNgn: 1980400.00,
  totalOrders: 432,
  successfulPaymentsCount: 512,
  pendingPaymentsCount: 7,
  activeRentalsCount: 28,
  registeredCustomersCount: 1480,
  inventoryUnitsTotal: 496,
  inventoryUnitsAvailable: 476
};

