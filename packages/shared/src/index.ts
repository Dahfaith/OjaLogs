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
  { id: 'proxies', name: 'Proxies & Network IPs', division: 'A', icon: 'Network', description: 'Clean residential, mobile LTE, and datacenter proxy packages' },
  { id: 'esim', name: 'eSIM Profiles & Data', division: 'A', icon: 'QrCode', description: 'Instant global travel eSIM profiles and high-speed data plans' },
  { id: 'vpn', name: 'VPN Subscriptions', division: 'A', icon: 'Shield', description: 'Official vouchers & premium multi-device VPN subscriptions' },
  { id: 'ai-tools', name: 'AI Subscriptions & APIs', division: 'A', icon: 'Sparkles', description: 'API access keys, credits & authorized productivity tool tiers' },
  { id: 'software', name: 'Software Licenses & Keys', division: 'A', icon: 'KeyRound', description: 'Genuine OS activation keys, IDEs, and developer software' },
  { id: 'cloud-hosting', name: 'Cloud & Domain Hosting', division: 'A', icon: 'Server', description: 'Cloud VPS vouchers, domain credits, and web hosting subscriptions' },
  { id: 'virtual-numbers', name: 'Virtual Phone Numbers', division: 'B', icon: 'PhoneCall', description: 'Authorized verification SMS and long-term phone rentals' }
] as const;

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

// Admin Metrics
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
  currency: z.literal('NGN'),
  idempotencyKey: z.string().uuid()
});

export const CheckoutInputSchema = z.object({
  paymentMethod: z.enum(['wallet', 'bach_direct']),
  idempotencyKey: z.string().uuid()
});

export const RequestNumberInputSchema = z.object({
  countryCode: z.string().min(2).max(4),
  serviceId: z.string().min(1),
  rentalType: z.enum(['one_time_sms', 'long_term_rental']),
  idempotencyKey: z.string().uuid()
});

