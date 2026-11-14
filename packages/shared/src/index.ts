import { z } from 'zod';

// ==========================================
// BRAND & SYSTEM CONSTANTS
// ==========================================
export const BRAND_NAME = 'Ojalogs';
export const BRAND_TAGLINE = 'A digital essentials and goods marketplace that offers verified digital products, accounts, eSIM profiles, proxies, and professional tools.';
export const DEFAULT_CURRENCY = 'NGN';
export const SUPPORTED_CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP'] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// Real-Time Base Exchange Rates against NGN
export const NGN_EXCHANGE_RATES: Record<SupportedCurrency, number> = {
  NGN: 1,
  USD: 1550, // 1 USD = 1,550 NGN
  EUR: 1680, // 1 EUR = 1,680 NGN
  GBP: 2000  // 1 GBP = 2,000 NGN
};

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, { flag: string; symbol: string; code: SupportedCurrency }> = {
  NGN: { flag: '🇳🇬', symbol: '₦', code: 'NGN' },
  USD: { flag: '🇺🇸', symbol: '$', code: 'USD' },
  EUR: { flag: '🇪🇺', symbol: '€', code: 'EUR' },
  GBP: { flag: '🇬🇧', symbol: '£', code: 'GBP' }
};

/**
 * Convert base NGN amount to target currency
 */
export function convertNgnToCurrency(amountNgn: number, targetCurrency: SupportedCurrency = 'NGN'): number {
  const rate = NGN_EXCHANGE_RATES[targetCurrency] || 1;
  return amountNgn / rate;
}

/**
 * Format base NGN amount in target currency with symbol and accurate decimals
 */
export function formatCurrencyAmount(
  amountNgn: number,
  targetCurrency: SupportedCurrency = 'NGN',
  options?: { showSymbol?: boolean; showCode?: boolean; decimals?: number }
): string {
  const symbol = CURRENCY_SYMBOLS[targetCurrency]?.symbol || '₦';
  const converted = convertNgnToCurrency(amountNgn, targetCurrency);
  
  const decimals = options?.decimals !== undefined 
    ? options.decimals 
    : targetCurrency === 'NGN' 
      ? (amountNgn % 1 !== 0 ? 2 : 0) 
      : 2;

  const formattedNum = converted.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  const withSymbol = options?.showSymbol !== false ? `${symbol}${formattedNum}` : formattedNum;
  return options?.showCode ? `${withSymbol} ${targetCurrency}` : withSymbol;
}

export const APPROVED_CATEGORIES = [
  { id: 'social-media', name: 'Social Media Accounts', division: 'A', icon: 'Share2', description: 'Verified aged accounts, business managers, and creator profiles' },
  { id: 'gift-cards', name: 'Prepaid & Gift Cards', division: 'A', icon: 'CreditCard', description: 'Prepaid Mastercards, Visa VCCs, Steam, Apple & gaming vouchers' },
  { id: 'email', name: 'Email & Messaging Services', division: 'A', icon: 'Mail', description: 'Verified aged Gmail, Outlook, Yahoo, and business mail accounts' },
  { id: 'vpn', name: 'VPN Subscriptions', division: 'A', icon: 'Shield', description: 'Official vouchers & premium multi-device VPN subscriptions' },
  { id: 'proxies', name: 'Proxies & Network IPs', division: 'A', icon: 'Network', description: 'Clean residential, mobile LTE, and datacenter proxy packages' },
  { id: 'esim', name: 'eSIM Profiles & Data', division: 'A', icon: 'QrCode', description: 'Instant global travel eSIM profiles and high-speed data plans' },
  { id: 'ai-tools', name: 'AI Subscriptions & APIs', division: 'A', icon: 'Sparkles', description: 'API access keys, credits & authorized productivity tool tiers' },
  { id: 'streaming', name: 'Streaming & Entertainment', division: 'A', icon: 'Tv', description: 'Premium streaming subscriptions, Spotify, Netflix & YouTube' },
  { id: 'software', name: 'Software Licenses & Keys', division: 'A', icon: 'KeyRound', description: 'Genuine OS activation keys, IDEs, and developer software' },
  { id: 'cloud-hosting', name: 'Cloud & Domain Hosting', division: 'A', icon: 'Server', description: 'Cloud VPS vouchers, domain credits, and web hosting subscriptions' },
  { id: 'virtual-numbers', name: 'Virtual Phone Numbers', division: 'B', icon: 'PhoneCall', description: 'Authorized verification SMS and long-term phone rentals' }
] as const;

export type CategoryId = (typeof APPROVED_CATEGORIES)[number]['id'];

export interface ResolvedCategory {
  category: string;
  categoryId: CategoryId;
}

/**
 * Deterministic, title-first product categorizer.
 * Accurately maps every digital product to its authorized category,
 * preventing upstream generic categories (like "Social Media Accounts")
 * from overriding gift cards, emails, VPNs, proxies, and developer tools.
 */
export function resolveProductCategory(
  title: string = '',
  rawCategory: string = '',
  description: string = ''
): ResolvedCategory {
  const t = (title || '').toLowerCase();
  const c = (rawCategory || '').toLowerCase();
  const d = (description || '').toLowerCase();

  const matchTitle = (regex: RegExp) => regex.test(t);
  const matchCategory = (regex: RegExp) => regex.test(c);
  const matchDesc = (regex: RegExp) => regex.test(d);

  // 1. PREPAID & GIFT CARDS (PRIORITY 1 - Never misclassify cards/vouchers)
  if (
    matchTitle(/\b(mastercard|master\s*card|visa|amex|american\s*express|vanilla)\b/i) ||
    matchTitle(/\b(gift\s*card|giftcard|prepaid|vcc|virtual\s*card|debit\s*card|credit\s*card)\b/i) ||
    matchTitle(/\b(steam|steam\s*wallet|razer|razer\s*gold|roblox|robux|playstation|psn|xbox|amazon\s*gift|itunes|apple\s*gift|google\s*play)\b/i)
  ) {
    return { category: 'Prepaid & Gift Cards', categoryId: 'gift-cards' };
  }

  // 2. EMAIL & MESSAGING SERVICES (PRIORITY 2 - Email accounts must never be generic social media)
  if (
    matchTitle(/\b(gmail|google\s*mail|gsuite|google\s*workspace)\b/i) ||
    matchTitle(/\b(outlook|hotmail|live\.com|msn\.com)\b/i) ||
    matchTitle(/\b(yahoo|yahoomail|ymail)\b/i) ||
    matchTitle(/\b(proton|protonmail|mail\.ru|webmail|zoho\s*mail|inbox)\b/i)
  ) {
    return { category: 'Email & Messaging Services', categoryId: 'email' };
  }

  // 3. VPN SUBSCRIPTIONS
  if (
    matchTitle(/\b(vpn|nordvpn|nord\s*vpn|surfshark|expressvpn|cyberghost|protonvpn|windscribe|mullvad|ipvanish)\b/i)
  ) {
    return { category: 'VPN Subscriptions', categoryId: 'vpn' };
  }

  // 4. PROXIES & NETWORK IPS
  if (
    matchTitle(/\b(proxy|proxies|residential|rotating\s*ip|socks5|http\s*proxy|datacenter\s*ip|ipv4|ipv6|mobile\s*proxy|lte\s*proxy)\b/i)
  ) {
    return { category: 'Proxies & Network IPs', categoryId: 'proxies' };
  }

  // 5. ESIM PROFILES & DATA
  if (
    matchTitle(/\b(esim|e-sim|roaming|travel\s*data|data\s*sim|mobile\s*data)\b/i)
  ) {
    return { category: 'eSIM Profiles & Data', categoryId: 'esim' };
  }

  // 6. AI SUBSCRIPTIONS & APIS
  if (
    matchTitle(/\b(chatgpt|openai|gpt-4|gpt-3|claude|anthropic|midjourney|kling|runway|elevenlabs|gemini|perplexity|cursor|copilot|deepseek|ai\s*tool|ai\s*sub)\b/i)
  ) {
    return { category: 'AI Subscriptions & APIs', categoryId: 'ai-tools' };
  }

  // 7. STREAMING & ENTERTAINMENT
  if (
    matchTitle(/\b(netflix|spotify|youtube\s*premium|yt\s*premium|disney\+|hulu|apple\s*tv|hbo\s*max|tidal|deezer|crunchyroll)\b/i)
  ) {
    return { category: 'Streaming & Entertainment', categoryId: 'streaming' };
  }

  // 8. TELEPHONY & VIRTUAL NUMBERS
  if (
    matchTitle(/\b(google\s*voice|gvoice|\bgv\b|textnow|talkatone|virtual\s*number|phone\s*rental|sms\s*verification|receive\s*sms|one-time\s*sms)\b/i)
  ) {
    return { category: 'Virtual Phone Numbers', categoryId: 'virtual-numbers' };
  }

  // 9. SOFTWARE LICENSES & KEYS
  if (
    matchTitle(/\b(windows\s*10|windows\s*11|windows\s*server|office\s*365|ms\s*office|activation\s*key|license\s*key|retail\s*key|github|jetbrains|adobe|canva\s*pro|antivirus|kaspersky)\b/i)
  ) {
    return { category: 'Software Licenses & Keys', categoryId: 'software' };
  }

  // 10. CLOUD & DOMAIN HOSTING
  if (
    matchTitle(/\b(cloud|vps|digitalocean|aws|azure|google\s*cloud|linode|vultr|domain|hosting|cpanel|rdp)\b/i)
  ) {
    return { category: 'Cloud & Domain Hosting', categoryId: 'cloud-hosting' };
  }

  // 11. SOCIAL MEDIA ACCOUNTS (Strict title matching)
  if (
    matchTitle(/\b(threads?)\b/i) || t.includes('thread') ||
    matchTitle(/\b(instagram|\big\b|ig\s*account)\b/i) ||
    matchTitle(/\b(facebook|\bfb\b|bm50|business\s*manager|fb\s*account)\b/i) ||
    matchTitle(/\b(tiktok|tik\s*tok)\b/i) ||
    matchTitle(/\b(twitter|aged\s*x|x\.com|x\s*\(twitter\)|twitter\s*account)\b/i) ||
    matchTitle(/\b(telegram|tdata|\.session|\btg\b)\b/i) ||
    matchTitle(/\b(snapchat|snap)\b/i) ||
    matchTitle(/\b(reddit)\b/i) ||
    matchTitle(/\b(linkedin)\b/i) ||
    matchTitle(/\b(pinterest)\b/i) ||
    matchTitle(/\b(discord)\b/i) ||
    matchTitle(/\b(followers|pva\b|aged\s*account|account\s*with\s*2fa)\b/i)
  ) {
    return { category: 'Social Media Accounts', categoryId: 'social-media' };
  }

  // 12. SECONDARY CHECK: Check rawCategory (Upstream Category Metadata)
  if (matchCategory(/\b(mastercard|visa|card|gift\s*card|prepaid)\b/i)) {
    return { category: 'Prepaid & Gift Cards', categoryId: 'gift-cards' };
  }
  if (matchCategory(/\b(gmail|google\s*mail|outlook|hotmail|yahoo|proton|email|mail)\b/i)) {
    return { category: 'Email & Messaging Services', categoryId: 'email' };
  }
  if (matchCategory(/\b(vpn)\b/i)) {
    return { category: 'VPN Subscriptions', categoryId: 'vpn' };
  }
  if (matchCategory(/\b(proxy|proxies|socks5)\b/i)) {
    return { category: 'Proxies & Network IPs', categoryId: 'proxies' };
  }
  if (matchCategory(/\b(esim|roaming)\b/i)) {
    return { category: 'eSIM Profiles & Data', categoryId: 'esim' };
  }
  if (matchCategory(/\b(ai|chatgpt|openai)\b/i)) {
    return { category: 'AI Subscriptions & APIs', categoryId: 'ai-tools' };
  }
  if (matchCategory(/\b(netflix|spotify|streaming)\b/i)) {
    return { category: 'Streaming & Entertainment', categoryId: 'streaming' };
  }
  if (matchCategory(/\b(voice|phone|sms|number|telephony)\b/i)) {
    return { category: 'Virtual Phone Numbers', categoryId: 'virtual-numbers' };
  }
  if (matchCategory(/\b(software|license|windows|office)\b/i)) {
    return { category: 'Software Licenses & Keys', categoryId: 'software' };
  }
  if (matchCategory(/\b(cloud|vps|hosting|domain)\b/i)) {
    return { category: 'Cloud & Domain Hosting', categoryId: 'cloud-hosting' };
  }
  if (matchCategory(/\b(telegram|instagram|facebook|twitter|tiktok|social|threads|snapchat|reddit|linkedin)\b/i)) {
    return { category: 'Social Media Accounts', categoryId: 'social-media' };
  }

  // 13. TERTIARY CHECK: Inconclusive title/category - inspect description
  if (matchDesc(/\b(mastercard|gift\s*card|prepaid\s*card)\b/i)) {
    return { category: 'Prepaid & Gift Cards', categoryId: 'gift-cards' };
  }
  if (matchDesc(/\b(gmail|outlook|hotmail|yahoo\s*mail)\b/i)) {
    return { category: 'Email & Messaging Services', categoryId: 'email' };
  }
  if (matchDesc(/\b(vpn\s*subscription|nordvpn|expressvpn)\b/i)) {
    return { category: 'VPN Subscriptions', categoryId: 'vpn' };
  }
  if (matchDesc(/\b(socks5\s*proxy|residential\s*proxy)\b/i)) {
    return { category: 'Proxies & Network IPs', categoryId: 'proxies' };
  }

  // Exact matching against APPROVED_CATEGORIES names/ids
  for (const cat of APPROVED_CATEGORIES) {
    if (c === cat.id.toLowerCase() || c === cat.name.toLowerCase()) {
      return { category: cat.name, categoryId: cat.id as CategoryId };
    }
  }

  return { category: 'Social Media Accounts', categoryId: 'social-media' };
}

// ==========================================
// ENUMS & TYPINGS
// ==========================================
export type DivisionType = 'A' | 'B';

export type UserRole = 
  | 'guest' 
  | 'customer' 
  | 'support_agent' 
  | 'administrator' 
  | 'super_administrator' 
  | 'seller';

export type FulfillmentSpeed = 'Instant Automated' | 'Priority Manual' | 'Under 15 Mins';
export type DeliveryType = 'instant_automated' | 'manual';
export type ProductStatus = 'active' | 'draft' | 'archived' | 'force_disabled';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: UserRole;
  isVerified: boolean;
  avatarUrl?: string;
  acceptableUseAcceptedAt: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    hideWalletBalance: boolean;
    transactionAlerts: boolean;
    currency: SupportedCurrency;
  };
}

export interface ProductSpecification {
  title: string;
  category: string;
  serverOrigin: string; // e.g. Server 1 (Enterprise Keys), Server 2 (Cloud Subscriptions)
  deliveryType: DeliveryType;
  validityDuration: string;
  fulfillmentSpeed: string;
  verificationStatus: string;
  stockUnits: number;
  region: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryId: string;
  division: DivisionType;
  serverCluster: 'Server 1' | 'Server 2' | 'Server 3' | 'Server 4';
  priceNgn: number;
  inStock: boolean;
  stockCount: number;
  rating: number;
  verifiedResale: boolean;
  coverImage: string;
  badge?: string;
  summary: string;
  descriptionHtml: string;
  specifications: ProductSpecification;
  deliveryFormat: string;
  validityDuration: string;
  region: string;
  featured?: boolean;
}

// Division B: Virtual Numbers
export interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  availableNumbers: number;
}

export interface ServiceOption {
  id: string;
  name: string;
  category: string;
  icon: string;
  priceNgn: number;
  successRate: number;
  popular?: boolean;
  stock?: number;
  countryPrices?: Record<string, number>;
}

export function getServicePriceForCountry(
  service: ServiceOption,
  countryCode: string = 'US',
  rentalType: 'one_time_sms' | 'long_term_rental' = 'one_time_sms'
): number {
  const code = (countryCode || 'US').toUpperCase();
  let basePrice = service.priceNgn || 450;

  if (service.countryPrices && typeof service.countryPrices[code] === 'number') {
    basePrice = service.countryPrices[code];
  } else {
    const multipliers: Record<string, number> = {
      US: 1.0,
      CA: 1.05,
      GB: 1.15,
      DE: 1.20,
      FR: 1.18,
      NL: 1.16,
      NG: 0.85
    };
    const mult = multipliers[code] ?? 1.10;
    basePrice = Math.round(basePrice * mult);
  }

  // Ensure minimum loss-protection floor per brand
  const sn = (service.name || '').toLowerCase();
  if (sn.includes('plenty') || sn.includes('fish') || sn.includes('pof')) {
    const pofMin: Record<string, number> = { US: 950, GB: 1150, NG: 850, CA: 1050, DE: 1250, FR: 1200, NL: 1180 };
    basePrice = Math.max(basePrice, pofMin[code] || 950);
  } else if (sn.includes('whatsapp')) {
    const waMin: Record<string, number> = { US: 4850, GB: 5200, NG: 2200, CA: 4950, DE: 5400, FR: 5300, NL: 5150 };
    basePrice = Math.max(basePrice, waMin[code] || 4850);
  } else if (sn.includes('telegram')) {
    const tgMin: Record<string, number> = { US: 3650, GB: 3950, NG: 1800, CA: 3750, DE: 4100, FR: 4000, NL: 3900 };
    basePrice = Math.max(basePrice, tgMin[code] || 3650);
  } else if (sn.includes('facebook') || sn.includes('instagram')) {
    const metaMin: Record<string, number> = { US: 1350, GB: 1550, NG: 950, CA: 1400, DE: 1600, FR: 1580, NL: 1500 };
    basePrice = Math.max(basePrice, metaMin[code] || 1350);
  } else if (sn.includes('google')) {
    const gMin: Record<string, number> = { US: 1950, GB: 2200, NG: 1100, CA: 2050, DE: 2350, FR: 2300, NL: 2250 };
    basePrice = Math.max(basePrice, gMin[code] || 1950);
  } else if (sn.includes('1688') || sn.includes('hinge')) {
    const midMin: Record<string, number> = { US: 850, GB: 950, NG: 800, CA: 880, DE: 1000, FR: 980, NL: 950 };
    basePrice = Math.max(basePrice, midMin[code] || 850);
  } else if (sn.includes('tinder') || sn.includes('bumble') || sn.includes('twitter')) {
    const tinMin: Record<string, number> = { US: 750, GB: 850, NG: 850, CA: 800, DE: 900, FR: 880, NL: 860 };
    basePrice = Math.max(basePrice, tinMin[code] || 750);
  }

  basePrice = Math.max(basePrice, 450);

  return rentalType === 'long_term_rental' ? basePrice * 5 : basePrice;
}

export interface SmsMessage {
  id: string;
  sender: string;
  code: string;
  fullText: string;
  receivedAt: string;
}

export interface VirtualNumberSession {
  id: string;
  reference: string;
  country: CountryOption;
  service: ServiceOption;
  phoneNumber: string;
  rentalType: 'one_time_sms' | 'long_term_rental';
  status: 'requesting' | 'active' | 'sms_received' | 'expired' | 'cancelled' | 'refunded';
  timeRemainingSeconds: number;
  expiresAt: string;
  priceNgn: number;
  messages: SmsMessage[];
  canCancel: boolean;
  canRenew: boolean;
}

// Wallet & Ledger
export interface WalletState {
  balanceNgn: number;
  currency: SupportedCurrency;
  isLocked: boolean;
  pendingDeposits: number;
  lifetimePurchases: number;
  monthlySpendNgn: number;
}

export type LedgerEntryType = 'credit' | 'debit';
export type LedgerCategory = 
  | 'deposit' 
  | 'order_payment' 
  | 'virtual_number_order' 
  | 'refund' 
  | 'adjustment' 
  | 'rental_renewal';

export interface LedgerTransaction {
  id: string;
  reference: string; // e.g. ref_oj_...
  type: LedgerEntryType;
  category: LedgerCategory;
  amountNgn: number;
  balanceAfterNgn: number;
  description: string;
  status: 'successful' | 'pending' | 'failed' | 'refunded';
  timestamp: string;
  idempotencyKey?: string;
  relatedOrderReference?: string;
}

// Cart & Orders
export interface CartItem {
  product: Product;
  quantity: number;
  subtotalNgn: number;
}

export interface CartState {
  items: CartItem[];
  totalQuantity: number;
  totalAmountNgn: number;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface DeliveredSecret {
  type: 'license_key' | 'subscription_voucher' | 'login_credentials_prohibited';
  revealed: boolean;
  value: string;
  instruction: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  unitPriceNgn: number;
  totalNgn: number;
  deliveredSecrets?: DeliveredSecret[];
}

export interface Order {
  id: string;
  reference: string; // ord_oj_...
  createdAt: string;
  status: OrderStatus;
  paymentMethod: 'wallet' | 'bach_direct';
  totalNgn: number;
  items: OrderItem[];
  customerEmail: string;
}

// Admin Metrics & Server Configurations
export interface ServerClusterConfig {
  id: string;
  cluster: 'Server 1' | 'Server 2' | 'Server 3' | 'Server 4';
  name: string;
  description: string;
  apiUrl: string;
  apiKey: string;
  fulfillmentMode: 'automated_api' | 'vault_inventory' | 'hybrid';
  webhookSecret?: string;
  status: 'connected' | 'testing' | 'offline';
  latencyMs: number;
  lastChecked: string;
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  badge: string;
  isActive: boolean;
  isLiveMode: boolean;
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  baseUrl: string;
  dynamicAccountsEnabled: boolean;
  settlementBank: string;
  settlementAccountNumber: string;
  status: 'connected' | 'standby' | 'offline';
  latencyMs: number;
}

export interface TelephonyProviderConfig {
  id: string;
  name: string;
  badge: string;
  apiUrl: string;
  apiKey: string;
  webhookSecret?: string;
  markupPercent: number;
  autoRefundTimeoutSeconds: number;
  status: 'connected' | 'standby' | 'offline';
  latencyMs: number;
}

export interface AdminManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'frozen' | 'suspended';
  balanceNgn: number;
  isVerified: boolean;
  totalOrders: number;
  createdAt: string;
  lastActiveAt?: string;
}

export interface AdminNotification {
  id: string;
  type: 'NEW_USER_SIGNUP' | 'ORDER_PLACED' | 'PAYMENT_RECEIVED' | 'SECURITY_ALERT';
  title: string;
  message: string;
  userEmail?: string;
  timestamp: string;
  read: boolean;
}

export interface AdminMetrics {
  totalRevenueNgn: number;
  walletLiabilitiesNgn: number;
  totalOrders: number;
  successfulPaymentsCount: number;
  pendingPaymentsCount: number;
  activeRentalsCount: number;
  registeredCustomersCount: number;
  inventoryUnitsTotal: number;
  inventoryUnitsAvailable: number;
}

// Zod Schemas
export const FundWalletInputSchema = z.object({
  amountNgn: z.number().min(100, 'Minimum funding amount is ₦100').max(5000000, 'Maximum single deposit is ₦5,000,000'),
  currency: z.literal('NGN').optional().default('NGN'),
  idempotencyKey: z.string().min(1)
});

export const CheckoutInputSchema = z.object({
  paymentMethod: z.enum(['wallet', 'bach_direct']),
  idempotencyKey: z.string().min(1)
});

export const RequestNumberInputSchema = z.object({
  countryCode: z.string().min(2).max(4),
  serviceId: z.string().min(1),
  rentalType: z.enum(['one_time_sms', 'long_term_rental']),
  idempotencyKey: z.string().min(1)
});

// SMM (Social Media Marketing) Types & Schemas
export type SMMPlatform = 'instagram' | 'tiktok' | 'twitter' | 'youtube' | 'telegram' | 'facebook' | 'spotify' | 'threads' | 'other';

export interface SMMService {
  id: string;
  providerServiceId: string;
  name: string;
  category: string;
  platform: SMMPlatform;
  sourceRateNgn: number;
  retailRateNgn: number;
  minQuantity: number;
  maxQuantity: number;
  description?: string;
  isActive: boolean;
  dripFeedSupported?: boolean;
  refillSupported?: boolean;
}

export interface SMMOrder {
  id: string;
  reference: string;
  userId: string;
  customerEmail: string;
  serviceId: string;
  serviceName: string;
  providerOrderId?: string;
  targetLink: string;
  quantity: number;
  totalNgn: number;
  sourceCostNgn: number;
  profitNgn: number;
  status: 'pending' | 'in_progress' | 'completed' | 'partial' | 'canceled' | 'refunded';
  startCount: number;
  remains: number;
  createdAt: string;
  updatedAt: string;
}

export interface SMMProviderConfig {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  isActive: boolean;
  balanceNgn?: number;
  currency?: string;
  defaultMarkupPercent: number;
  autoSyncEnabled: boolean;
  lastSyncedAt?: string;
  connectionStatus?: 'connected' | 'error' | 'unconfigured' | 'checking';
  lastError?: string;
}

export const SMMOrderInputSchema = z.object({
  serviceId: z.string().min(1),
  targetLink: z.string().min(1, 'Target link is required'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  idempotencyKey: z.string().min(1)
});

export const SMMStandardApiRequestSchema = z.object({
  key: z.string().min(1),
  action: z.enum(['services', 'add', 'status', 'balance']),
  service: z.string().optional(),
  link: z.string().optional(),
  quantity: z.union([z.string(), z.number()]).optional(),
  order: z.union([z.string(), z.number()]).optional()
});


