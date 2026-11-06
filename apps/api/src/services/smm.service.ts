import fs from 'node:fs';
import path from 'node:path';
import { SMMService, SMMOrder, SMMProviderConfig, SMMPlatform } from '@ojalogs/shared';
import { linkocialAdapter, LinkocialRawService } from '../adapters/smm/linkocial.adapter.js';
import { walletService } from './wallet.service.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'smm_config.json');

export class SMMManagerService {
  private config: SMMProviderConfig = {
    id: 'linkocial_primary',
    name: 'Linkocial Standard SMM v1.0',
    apiUrl: process.env.LINKOCIAL_BASE_URL || env.LINKOCIAL_BASE_URL || 'https://linkocial.com/api/v1',
    apiKey: process.env.LINKOCIAL_API_KEY || env.LINKOCIAL_API_KEY || 'linkocial_live_token_default',
    isActive: true,
    balanceNgn: 0.00,
    currency: 'NGN',
    defaultMarkupPercent: 30, // Default +30% profit margin
    autoSyncEnabled: true,
    lastSyncedAt: new Date().toISOString(),
    connectionStatus: 'unconfigured'
  };

  constructor() {
    this.loadPersistedConfig();
  }

  private loadPersistedConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.config = {
            ...this.config,
            ...parsed
          };
          if (this.config.apiKey) {
            linkocialAdapter.setCredentials(this.config.apiKey, this.config.apiUrl);
          }
        }
      }
    } catch (err: any) {
      console.warn(`[SMM_PERSISTENCE] Notice loading config: ${err.message}`);
    }
  }

  private savePersistedConfig() {
    try {
      fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn(`[SMM_PERSISTENCE] Notice saving config: ${err.message}`);
    }
  }

  private services: SMMService[] = [
    {
      id: 'smm_ig_001',
      providerServiceId: '101',
      name: 'Instagram High-Quality Followers [Non-Drop | 30 Days Refill]',
      category: 'Instagram - Followers Guaranteed',
      platform: 'instagram',
      sourceRateNgn: 4500.00,
      retailRateNgn: 5850.00, // +30% margin
      minQuantity: 50,
      maxQuantity: 100000,
      description: 'High retention authentic profiles with profile photos and recent posts. Delivery speed: 5k - 10k/day.',
      isActive: true,
      refillSupported: true
    },
    {
      id: 'smm_ig_002',
      providerServiceId: '102',
      name: 'Instagram Real Post Likes [Instant Start | Explore Algorithm]',
      category: 'Instagram - Likes',
      platform: 'instagram',
      sourceRateNgn: 1200.00,
      retailRateNgn: 1600.00,
      minQuantity: 20,
      maxQuantity: 50000,
      description: 'Instant delivery likes for posts, reels, and IGTV. Enhances explore page visibility.',
      isActive: true
    },
    {
      id: 'smm_ig_003',
      providerServiceId: '103',
      name: 'Instagram Reel Views + Impressions [Viral Algorithm Trigger]',
      category: 'Instagram - Views & Reach',
      platform: 'instagram',
      sourceRateNgn: 650.00,
      retailRateNgn: 950.00,
      minQuantity: 100,
      maxQuantity: 500000,
      description: 'Super-fast views with organic retention. Starts in under 60 seconds.',
      isActive: true
    },
    {
      id: 'smm_tk_001',
      providerServiceId: '201',
      name: 'TikTok Video Views [Super Instant | High Retention FYP]',
      category: 'TikTok - Views',
      platform: 'tiktok',
      sourceRateNgn: 500.00,
      retailRateNgn: 750.00,
      minQuantity: 100,
      maxQuantity: 1000000,
      description: 'Instant algorithm boost to push your video to the For You Page (FYP).',
      isActive: true
    },
    {
      id: 'smm_tk_002',
      providerServiceId: '202',
      name: 'TikTok Followers [Active Real Users | Unlock LIVE]',
      category: 'TikTok - Followers',
      platform: 'tiktok',
      sourceRateNgn: 5200.00,
      retailRateNgn: 6800.00,
      minQuantity: 50,
      maxQuantity: 50000,
      description: 'Helps unlock TikTok LIVE broadcast and creator fund eligibility requirements.',
      isActive: true
    },
    {
      id: 'smm_tw_001',
      providerServiceId: '301',
      name: 'X / Twitter Followers [Real Worldwide Profiles | Organic]',
      category: 'X / Twitter - Followers',
      platform: 'twitter',
      sourceRateNgn: 6000.00,
      retailRateNgn: 7900.00,
      minQuantity: 100,
      maxQuantity: 25000,
      description: 'High authority Twitter accounts for monetization, crypto projects, and influencer reach.',
      isActive: true
    },
    {
      id: 'smm_tw_002',
      providerServiceId: '302',
      name: 'X / Twitter Retweets & Reposts [Viral Boost]',
      category: 'X / Twitter - Engagements',
      platform: 'twitter',
      sourceRateNgn: 3400.00,
      retailRateNgn: 4500.00,
      minQuantity: 25,
      maxQuantity: 10000,
      description: 'Viral boosts for marketing announcements, token launches, and trending tags.',
      isActive: true
    },
    {
      id: 'smm_yt_001',
      providerServiceId: '401',
      name: 'YouTube High-Retention Views [AdSense Safe | Natural Watch Time]',
      category: 'YouTube - Views & Watch Time',
      platform: 'youtube',
      sourceRateNgn: 3800.00,
      retailRateNgn: 4950.00,
      minQuantity: 500,
      maxQuantity: 500000,
      description: '100% Monetization and AdSense safe watch time. Helps video ranking in search results.',
      isActive: true
    },
    {
      id: 'smm_yt_002',
      providerServiceId: '402',
      name: 'YouTube Channel Subscribers [Stable | Lifetime Guaranteed]',
      category: 'YouTube - Subscribers',
      platform: 'youtube',
      sourceRateNgn: 8500.00,
      retailRateNgn: 11000.00,
      minQuantity: 50,
      maxQuantity: 10000,
      description: 'Guaranteed non-drop channel subscribers to hit YouTube Partner Program goals.',
      isActive: true,
      refillSupported: true
    },
    {
      id: 'smm_tg_001',
      providerServiceId: '501',
      name: 'Telegram Public/Private Channel Members [Instant Fast Add]',
      category: 'Telegram - Channel & Group Members',
      platform: 'telegram',
      sourceRateNgn: 2800.00,
      retailRateNgn: 3700.00,
      minQuantity: 50,
      maxQuantity: 100000,
      description: 'Works for crypto channels, business groups, and private broadcast channels.',
      isActive: true
    },
    {
      id: 'smm_sp_001',
      providerServiceId: '601',
      name: 'Spotify Track Streams [Royalty Eligible | Premium Plays]',
      category: 'Spotify - Music Streams',
      platform: 'spotify',
      sourceRateNgn: 3200.00,
      retailRateNgn: 4300.00,
      minQuantity: 1000,
      maxQuantity: 1000000,
      description: 'Eligible for royalties and Spotify algorithmic playlist placement.',
      isActive: true
    },
    {
      id: 'smm_fb_001',
      providerServiceId: '701',
      name: 'Facebook Page Likes & Followers [Global Targeted]',
      category: 'Facebook - Page Growth',
      platform: 'facebook',
      sourceRateNgn: 4800.00,
      retailRateNgn: 6300.00,
      minQuantity: 100,
      maxQuantity: 50000,
      description: 'Official business page followers and page thumbs up.',
      isActive: true
    }
  ];

  private orders: SMMOrder[] = [];

  // ==========================================
  // Public Storefront Methods
  // ==========================================

  getPublicServices(platform?: string): SMMService[] {
    let list = this.services.filter(s => s.isActive);
    if (platform && platform !== 'all') {
      list = list.filter(s => s.platform === platform);
    }
    return list;
  }

  getServiceById(id: string): SMMService | undefined {
    return this.services.find(s => s.id === id || s.providerServiceId === id);
  }

  // ==========================================
  // Admin Service & Margin Management
  // ==========================================

  getAdminServices(): SMMService[] {
    return this.services;
  }

  updateServiceRate(serviceId: string, retailRateNgn: number, isActive?: boolean): SMMService {
    const service = this.services.find(s => s.id === serviceId || s.providerServiceId === serviceId);
    if (!service) {
      throw new AppError('SMM Service not found', 404, 'SERVICE_NOT_FOUND');
    }

    if (retailRateNgn < service.sourceRateNgn) {
      console.warn(`[SMM_RATE_WARN] Retail price ₦${retailRateNgn} is below source cost ₦${service.sourceRateNgn}. Allowed upon admin override.`);
    }

    service.retailRateNgn = retailRateNgn;
    if (isActive !== undefined) {
      service.isActive = isActive;
    }

    return service;
  }

  setGlobalMarkup(markupPercent: number): { updatedCount: number; defaultMarkupPercent: number } {
    this.config.defaultMarkupPercent = Math.max(0, markupPercent);
    const multiplier = 1 + (this.config.defaultMarkupPercent / 100);

    let updatedCount = 0;
    this.services.forEach(s => {
      s.retailRateNgn = Math.round(s.sourceRateNgn * multiplier);
      updatedCount++;
    });

    return {
      updatedCount,
      defaultMarkupPercent: this.config.defaultMarkupPercent
    };
  }

  async syncServicesFromProvider(): Promise<{ syncedCount: number; newCount: number }> {
    const rawServices: LinkocialRawService[] = await linkocialAdapter.getServices();
    let newCount = 0;
    let syncedCount = 0;

    const multiplier = 1 + (this.config.defaultMarkupPercent / 100);

    for (const raw of rawServices) {
      const pid = String(raw.service);
      const sourceCost = Number(raw.rate) || 1000;
      const existing = this.services.find(s => s.providerServiceId === pid);

      const platform = this.detectPlatform(raw.category || raw.name);

      if (existing) {
        existing.sourceRateNgn = sourceCost;
        existing.minQuantity = Number(raw.min) || existing.minQuantity;
        existing.maxQuantity = Number(raw.max) || existing.maxQuantity;
        syncedCount++;
      } else {
        const newService: SMMService = {
          id: `smm_${platform}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          providerServiceId: pid,
          name: raw.name,
          category: raw.category || 'General Social Boost',
          platform,
          sourceRateNgn: sourceCost,
          retailRateNgn: Math.round(sourceCost * multiplier),
          minQuantity: Number(raw.min) || 50,
          maxQuantity: Number(raw.max) || 50000,
          description: raw.desc,
          isActive: true,
          dripFeedSupported: Boolean(raw.dripfeed),
          refillSupported: Boolean(raw.refill)
        };
        this.services.push(newService);
        newCount++;
      }
    }

    this.config.lastSyncedAt = new Date().toISOString();
    return { syncedCount, newCount };
  }

  private detectPlatform(text: string): SMMPlatform {
    const lower = text.toLowerCase();
    if (lower.includes('instagram') || lower.includes('ig')) return 'instagram';
    if (lower.includes('tiktok')) return 'tiktok';
    if (lower.includes('twitter') || lower.includes(' x ') || lower.startsWith('x ')) return 'twitter';
    if (lower.includes('youtube') || lower.includes('yt')) return 'youtube';
    if (lower.includes('telegram') || lower.includes('tg')) return 'telegram';
    if (lower.includes('facebook') || lower.includes('fb')) return 'facebook';
    if (lower.includes('spotify')) return 'spotify';
    if (lower.includes('threads')) return 'threads';
    return 'other';
  }

  // ==========================================
  // Order Processing & Ledger Integration
  // ==========================================

  async placeOrder(
    userId: string,
    customerEmail: string,
    serviceId: string,
    targetLink: string,
    quantity: number,
    idempotencyKey: string
  ): Promise<SMMOrder> {
    const service = this.getServiceById(serviceId);
    if (!service) {
      throw new AppError('Selected SMM Service does not exist', 404, 'SERVICE_NOT_FOUND');
    }

    if (!service.isActive) {
      throw new AppError('This service is currently unavailable', 400, 'SERVICE_INACTIVE');
    }

    if (quantity < service.minQuantity || quantity > service.maxQuantity) {
      throw new AppError(
        `Quantity must be between ${service.minQuantity.toLocaleString()} and ${service.maxQuantity.toLocaleString()}`,
        400,
        'INVALID_QUANTITY'
      );
    }

    const totalNgn = Math.round((service.retailRateNgn / 1000) * quantity);
    const sourceCostNgn = Math.round((service.sourceRateNgn / 1000) * quantity);
    const profitNgn = totalNgn - sourceCostNgn;
    const orderRef = `ord_smm_${Math.floor(100000 + Math.random() * 900000)}`;

    // Debit Wallet
    walletService.debitWallet(
      userId,
      totalNgn,
      'order_payment',
      `ref_oj_${Math.floor(1000000 + Math.random() * 9000000)}`,
      `SMM Boost: ${service.name} (${quantity.toLocaleString()} units)`,
      idempotencyKey,
      orderRef
    );

    // Dispatch to Linkocial API
    const upstreamRes = await linkocialAdapter.placeOrder(
      service.providerServiceId,
      targetLink,
      quantity
    );

    const newOrder: SMMOrder = {
      id: `smm_ord_${Date.now()}`,
      reference: orderRef,
      userId,
      customerEmail,
      serviceId: service.id,
      serviceName: service.name,
      providerOrderId: upstreamRes.order ? String(upstreamRes.order) : undefined,
      targetLink,
      quantity,
      totalNgn,
      sourceCostNgn,
      profitNgn,
      status: 'in_progress',
      startCount: 0,
      remains: quantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.orders.unshift(newOrder);

    // Automated In-App Alert & Email notification
    notificationService.recordOrderAlert(
      {
        reference: orderRef,
        totalNgn,
        paymentMethod: 'wallet',
        createdAt: newOrder.createdAt,
        items: [
          {
            product: { title: service.name, serverCluster: 'Server 2' },
            quantity,
            unitPriceNgn: service.retailRateNgn
          }
        ]
      },
      customerEmail
    ).catch(err => console.warn('[SMM_NOTIF_ERROR]', err.message));

    return newOrder;
  }

  async syncOrderStatus(orderId: string): Promise<SMMOrder> {
    const order = this.orders.find(o => o.id === orderId || o.reference === orderId);
    if (!order) {
      throw new AppError('SMM Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.providerOrderId) {
      const statusRes = await linkocialAdapter.getOrderStatus(order.providerOrderId);
      if (statusRes.status) {
        const normalized = statusRes.status.toLowerCase();
        if (normalized.includes('completed')) {
          order.status = 'completed';
          order.remains = 0;
        } else if (normalized.includes('canceled') || normalized.includes('cancelled')) {
          order.status = 'canceled';
          // Auto-refund customer wallet upon upstream cancellation!
          walletService.creditWallet(
            order.userId,
            order.totalNgn,
            'refund',
            `ref_smm_refund_${Date.now()}`,
            `100% Refund for canceled SMM order (${order.reference})`
          );
        } else if (normalized.includes('partial')) {
          order.status = 'partial';
        } else {
          order.status = 'in_progress';
        }

        if (statusRes.start_count !== undefined) order.startCount = Number(statusRes.start_count);
        if (statusRes.remains !== undefined) order.remains = Number(statusRes.remains);
        order.updatedAt = new Date().toISOString();
      }
    }

    return order;
  }

  getOrders(userId?: string): SMMOrder[] {
    if (userId) {
      return this.orders.filter(o => o.userId === userId);
    }
    return this.orders;
  }

  async getProviderConfig(): Promise<SMMProviderConfig> {
    if (linkocialAdapter.isConfigured()) {
      try {
        const bal = await linkocialAdapter.getBalance();
        if (bal && bal.balance !== undefined) {
          this.config.balanceNgn = Number(bal.balance);
          this.config.currency = bal.currency || 'NGN';
          this.config.connectionStatus = 'connected';
          this.config.lastError = undefined;
        } else if (bal && bal.error) {
          this.config.connectionStatus = 'error';
          this.config.lastError = bal.error;
        }
        this.savePersistedConfig();
      } catch (err: any) {
        this.config.connectionStatus = 'error';
        this.config.lastError = err.message;
      }
    } else {
      this.config.connectionStatus = 'unconfigured';
    }
    return this.config;
  }

  async updateProviderConfig(updates: Partial<SMMProviderConfig>): Promise<SMMProviderConfig> {
    if (updates.apiKey !== undefined) {
      this.config.apiKey = updates.apiKey.trim();
      linkocialAdapter.setCredentials(this.config.apiKey, updates.apiUrl);
    }
    if (updates.apiUrl !== undefined) {
      this.config.apiUrl = updates.apiUrl.trim();
      linkocialAdapter.setCredentials(this.config.apiKey, this.config.apiUrl);
    }
    if (updates.defaultMarkupPercent !== undefined) {
      this.config.defaultMarkupPercent = updates.defaultMarkupPercent;
    }
    if (updates.isActive !== undefined) {
      this.config.isActive = updates.isActive;
    }

    if (linkocialAdapter.isConfigured()) {
      try {
        const bal = await linkocialAdapter.getBalance();
        if (bal && bal.balance !== undefined) {
          this.config.balanceNgn = Number(bal.balance);
          this.config.currency = bal.currency || 'NGN';
          this.config.connectionStatus = 'connected';
          this.config.lastError = undefined;
        } else if (bal && bal.error) {
          this.config.connectionStatus = 'error';
          this.config.lastError = bal.error;
        }
      } catch (err: any) {
        this.config.connectionStatus = 'error';
        this.config.lastError = err.message;
      }
    } else {
      this.config.connectionStatus = 'unconfigured';
    }

    this.savePersistedConfig();
    return this.config;
  }

  async refreshBalance(): Promise<{
    balanceNgn?: number;
    currency?: string;
    connectionStatus: 'connected' | 'error' | 'unconfigured';
    lastError?: string;
    success: boolean;
  }> {
    if (!linkocialAdapter.isConfigured()) {
      return {
        connectionStatus: 'unconfigured',
        lastError: 'API key is not configured. Input your Linkocial API key.',
        success: false
      };
    }

    try {
      const bal = await linkocialAdapter.getBalance();
      if (bal && bal.balance !== undefined) {
        this.config.balanceNgn = Number(bal.balance);
        this.config.currency = bal.currency || 'NGN';
        this.config.connectionStatus = 'connected';
        this.config.lastError = undefined;
        this.savePersistedConfig();
        return {
          balanceNgn: this.config.balanceNgn,
          currency: this.config.currency,
          connectionStatus: 'connected',
          success: true
        };
      }

      this.config.connectionStatus = 'error';
      this.config.lastError = bal.error || 'Failed to read balance from Linkocial';
      this.savePersistedConfig();
      return {
        connectionStatus: 'error',
        lastError: this.config.lastError,
        success: false
      };
    } catch (err: any) {
      this.config.connectionStatus = 'error';
      this.config.lastError = err.message;
      this.savePersistedConfig();
      return {
        connectionStatus: 'error',
        lastError: err.message,
        success: false
      };
    }
  }

  async testConnection(apiKey: string, apiUrl?: string): Promise<{
    success: boolean;
    balance?: number;
    currency?: string;
    error?: string;
  }> {
    const res = await linkocialAdapter.testCredentials(apiKey, apiUrl);
    if (res.balance !== undefined) {
      return {
        success: true,
        balance: Number(res.balance),
        currency: res.currency || 'NGN'
      };
    }
    return {
      success: false,
      error: res.error || 'Connection failed: Linkocial rejected key'
    };
  }

  // ==========================================
  // Ojalogs Standard SMM Reseller API
  // ==========================================

  async handleStandardSMMRequest(body: any, authUser?: { id: string; email: string }) {
    const { action } = body;

    switch (action) {
      case 'services': {
        const active = this.getPublicServices();
        return active.map(s => ({
          service: s.id,
          name: s.name,
          type: 'Default',
          category: s.category,
          rate: s.retailRateNgn,
          min: s.minQuantity,
          max: s.maxQuantity,
          desc: s.description,
          refill: Boolean(s.refillSupported)
        }));
      }

      case 'add': {
        const { service, link, quantity } = body;
        if (!service || !link || !quantity) {
          throw new AppError('Parameters service, link, and quantity are required', 400, 'MISSING_PARAMS');
        }

        const userId = authUser?.id || 'usr_reseller_api';
        const userEmail = authUser?.email || 'reseller@ojalogs.com';
        const qty = Number(quantity);

        const order = await this.placeOrder(
          userId,
          userEmail,
          String(service),
          String(link),
          qty,
          `idemp_smm_${Date.now()}`
        );

        return { order: order.reference };
      }

      case 'status': {
        const { order } = body;
        if (!order) {
          throw new AppError('Parameter order is required', 400, 'MISSING_PARAMS');
        }

        const matched = this.orders.find(o => o.reference === String(order) || o.id === String(order));
        if (!matched) {
          return { error: 'Incorrect order ID' };
        }

        return {
          status: matched.status === 'in_progress' ? 'In progress' : matched.status.charAt(0).toUpperCase() + matched.status.slice(1),
          charge: matched.totalNgn.toFixed(2),
          start_count: matched.startCount,
          remains: matched.remains,
          currency: 'NGN'
        };
      }

      case 'balance': {
        const userId = authUser?.id || 'usr_reseller_api';
        const bal = walletService.getBalance(userId);
        return {
          balance: bal.toFixed(2),
          currency: 'NGN'
        };
      }

      default:
        throw new AppError(`Unsupported action: ${action}`, 400, 'INVALID_ACTION');
    }
  }
}

export const smmService = new SMMManagerService();

