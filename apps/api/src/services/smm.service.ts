import fs from 'node:fs';
import path from 'node:path';
import { SMMService, SMMOrder, SMMProviderConfig, SMMPlatform } from '@ojalogs/shared';
import { linkocialAdapter, LinkocialRawService } from '../adapters/smm/linkocial.adapter.js';
import { walletService } from './wallet.service.js';
import { notificationService } from './notification.service.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

const DATA_DIR = fs.existsSync(path.join(process.cwd(), 'apps', 'api', 'data'))
  ? path.join(process.cwd(), 'apps', 'api', 'data')
  : path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'smm_config.json');
const SERVICES_FILE = path.join(DATA_DIR, 'smm_services.json');
const SMM_ORDERS_FILE = path.join(DATA_DIR, 'smm_orders.json');
const SMM_ORDERS_SLUG = 'smm_orders_master';

export class SMMManagerService {
  private config: SMMProviderConfig = {
    id: 'linkocial_primary',
    name: 'Linkocial Standard SMM v1.0',
    apiUrl: process.env.LINKOCIAL_BASE_URL || env.LINKOCIAL_BASE_URL || 'https://linkocial.com/api/v1',
    apiKey: process.env.LINKOCIAL_API_KEY || env.LINKOCIAL_API_KEY || '8pydsuH2oVPiQ2Lqq0rkA9cmczHbTZKjjXnWLhXD',
    isActive: true,
    balanceNgn: 1000.00,
    currency: 'NGN',
    defaultMarkupPercent: 30, // Default +30% profit margin
    autoSyncEnabled: true,
    lastSyncedAt: new Date().toISOString(),
    connectionStatus: 'connected'
  };

  constructor() {
    this.loadPersistedConfig();
    this.loadPersistedServices();
    this.loadPersistedOrders();
    // Auto-sync in the background on startup so Linkocial catalog is always up to date without admin login
    if (this.config.autoSyncEnabled && this.config.apiKey) {
      setTimeout(() => {
        this.syncServicesFromProvider().catch(err => {
          console.warn('[SMM_AUTO_SYNC] Startup sync notice:', err.message);
        });
      }, 3000);
    }
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

  private loadPersistedServices() {
    try {
      if (fs.existsSync(SERVICES_FILE)) {
        const raw = fs.readFileSync(SERVICES_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const MOCK_IDS = new Set(['101', '102', '103', '201', '202', '301', '302', '401', '402', '501', '502', '601', '602', '701']);
          const clean = parsed.filter((s: any) => !MOCK_IDS.has(String(s.providerServiceId)));
          if (clean.length > 0) {
            this.services = clean;
            console.log(`[SMM_PERSISTENCE] Loaded ${clean.length} live Linkocial services from disk.`);
            return;
          }
        }
      }
    } catch (err: any) {
      console.warn(`[SMM_PERSISTENCE] Notice loading services: ${err.message}`);
    }
  }

  private savePersistedServices() {
    try {
      fs.mkdirSync(path.dirname(SERVICES_FILE), { recursive: true });
      fs.writeFileSync(SERVICES_FILE, JSON.stringify(this.services, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn(`[SMM_PERSISTENCE] Notice saving services: ${err.message}`);
    }
  }

  private loadPersistedOrders() {
    try {
      if (fs.existsSync(SMM_ORDERS_FILE)) {
        const raw = fs.readFileSync(SMM_ORDERS_FILE, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          this.orders = list;
          console.log(`[SMM_PERSISTENCE] Loaded ${list.length} persisted SMM orders from disk.`);
        }
      }
    } catch (err: any) {
      console.warn(`[SMM_PERSISTENCE] Notice loading orders from disk: ${err.message}`);
    }

    // Load from Supabase site_pages asynchronously
    this.loadOrdersFromSupabase().catch(() => {});
  }

  private async loadOrdersFromSupabase(): Promise<void> {
    try {
      const { data, error } = await supabaseAdmin
        .from('site_pages')
        .select('content')
        .eq('slug', SMM_ORDERS_SLUG)
        .maybeSingle();

      if (!error && data?.content) {
        const list = JSON.parse(data.content);
        if (Array.isArray(list) && list.length > 0) {
          const existingIds = new Set(this.orders.map(o => o.id));
          let added = 0;
          for (const ord of list) {
            if (!existingIds.has(ord.id)) {
              this.orders.push(ord);
              existingIds.add(ord.id);
              added++;
            }
          }
          if (added > 0) {
            this.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            console.log(`[SMM_PERSISTENCE] Merged ${added} SMM orders from Supabase (Total: ${this.orders.length})`);
            this.saveOrdersToDisk();
          }
        }
      }
    } catch (err: any) {
      console.warn(`[SMM_SUPABASE] Notice loading orders: ${err.message}`);
    }
  }

  private saveOrdersToDisk() {
    try {
      if (process.env.NODE_ENV === 'test') return;
      fs.mkdirSync(path.dirname(SMM_ORDERS_FILE), { recursive: true });
      fs.writeFileSync(SMM_ORDERS_FILE, JSON.stringify(this.orders, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn(`[SMM_PERSISTENCE] Notice saving orders to disk: ${err.message}`);
    }
  }

  private savePersistedOrders() {
    this.saveOrdersToDisk();
    this.syncOrdersToSupabase().catch(() => {});
  }

  private async syncOrdersToSupabase(): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'test') return;
      const payload = JSON.stringify(this.orders);
      const { data: existing } = await supabaseAdmin
        .from('site_pages')
        .select('id')
        .eq('slug', SMM_ORDERS_SLUG)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from('site_pages')
          .update({
            content: payload,
            last_updated_at: new Date().toISOString()
          })
          .eq('slug', SMM_ORDERS_SLUG);
      } else {
        await supabaseAdmin
          .from('site_pages')
          .insert({
            slug: SMM_ORDERS_SLUG,
            title: 'SMM Customer Orders Master Store',
            category: 'system',
            summary: 'Persistent customer SMM social boost orders and fulfillment status',
            content: payload,
            last_updated_at: new Date().toISOString()
          });
      }
    } catch (err: any) {
      console.warn(`[SMM_SUPABASE] Notice syncing orders: ${err.message}`);
    }
  }

  private services: SMMService[] = [
    {
      id: 'smm_instagram_901',
      providerServiceId: '901',
      name: 'Instagram Likes | 30K | 1K/Day [Instant Start]',
      category: 'Instagram - Likes',
      platform: 'instagram',
      sourceRateNgn: 208.00,
      retailRateNgn: 270.00,
      minQuantity: 10,
      maxQuantity: 1000000,
      description: 'Instant delivery authentic likes for Instagram posts, reels, and carousels.',
      isActive: true
    },
    {
      id: 'smm_instagram_864',
      providerServiceId: '864',
      name: 'Instagram Followers Exclusive [Ultra Fast 10K/Day | Full Profiles]',
      category: 'Instagram - Followers',
      platform: 'instagram',
      sourceRateNgn: 1144.00,
      retailRateNgn: 1487.00,
      minQuantity: 10,
      maxQuantity: 100000,
      description: 'High retention authentic profiles with profile photos and posts.',
      isActive: true,
      refillSupported: true
    },
    {
      id: 'smm_tiktok_203',
      providerServiceId: '203',
      name: 'TikTok Likes & Hearts [Stable | Non-Drop]',
      category: 'TikTok - Likes',
      platform: 'tiktok',
      sourceRateNgn: 2100.00,
      retailRateNgn: 2730.00,
      minQuantity: 50,
      maxQuantity: 500000,
      description: 'Instant boost to push your video to the For You Page (FYP).',
      isActive: true
    },
    {
      id: 'smm_twitter_1599',
      providerServiceId: '1599',
      name: 'Twitter Space Listener [Global Users]',
      category: 'X / Twitter - Space Listeners',
      platform: 'twitter',
      sourceRateNgn: 337.00,
      retailRateNgn: 438.00,
      minQuantity: 50,
      maxQuantity: 10000,
      description: 'Active worldwide listeners for Twitter spaces and engagements.',
      isActive: true
    },
    {
      id: 'smm_youtube_1222',
      providerServiceId: '1222',
      name: 'YouTube Native Views [Real Human Views | Lowest Rate]',
      category: 'YouTube - Views',
      platform: 'youtube',
      sourceRateNgn: 1748.00,
      retailRateNgn: 2272.00,
      minQuantity: 100,
      maxQuantity: 500000,
      description: 'AdSense safe human views to trigger search ranking algorithm.',
      isActive: true
    },
    {
      id: 'smm_facebook_845',
      providerServiceId: '845',
      name: 'Facebook Page Followers [All Type Page & Profile | Non Drop]',
      category: 'Facebook - Page Growth',
      platform: 'facebook',
      sourceRateNgn: 289.00,
      retailRateNgn: 376.00,
      minQuantity: 50,
      maxQuantity: 50000,
      description: 'High authority page likes and followers to establish business credibility.',
      isActive: true
    },
    {
      id: 'smm_telegram_1309',
      providerServiceId: '1309',
      name: 'Telegram Channel/Group Members [30 Day NonDrop Guarantee]',
      category: 'Telegram - Members',
      platform: 'telegram',
      sourceRateNgn: 915.00,
      retailRateNgn: 1190.00,
      minQuantity: 50,
      maxQuantity: 100000,
      description: 'High quality members for channels and crypto groups.',
      isActive: true
    }
  ];

  private orders: SMMOrder[] = [];

  // ==========================================
  // Public Storefront Methods
  // ==========================================

  getPublicServices(platform?: string): SMMService[] {
    const MOCK_IDS = new Set(['101', '102', '103', '201', '202', '301', '302', '401', '402', '501', '502', '601', '602', '701']);
    // If services catalog has fewer than 50 services, auto-trigger provider sync in background
    if ((this.services.length < 50 || this.services.some(s => MOCK_IDS.has(String(s.providerServiceId)))) && this.config.apiKey) {
      this.syncServicesFromProvider().catch(err => {
        console.warn('[SMM_AUTO_SYNC] Background sync notice:', err.message);
      });
    }

    let list = this.services.filter(s => s.isActive && !MOCK_IDS.has(String(s.providerServiceId)));
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

    this.savePersistedServices();
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

    this.savePersistedServices();
    this.savePersistedConfig();
    return {
      updatedCount,
      defaultMarkupPercent: this.config.defaultMarkupPercent
    };
  }

  async syncServicesFromProvider(): Promise<{ syncedCount: number; newCount: number }> {
    const rawServices: LinkocialRawService[] = await linkocialAdapter.getServices();
    let newCount = 0;
    let syncedCount = 0;

    const MOCK_IDS = new Set(['101', '102', '103', '201', '202', '301', '302', '401', '402', '501', '502', '601', '602', '701']);
    this.services = this.services.filter(s => !MOCK_IDS.has(String(s.providerServiceId)));

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
    this.savePersistedServices();
    this.savePersistedConfig();
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

    const cleanQty = Math.floor(Number(quantity));
    if (isNaN(cleanQty) || cleanQty < service.minQuantity || cleanQty > service.maxQuantity) {
      throw new AppError(
        `Quantity must be between ${service.minQuantity.toLocaleString()} and ${service.maxQuantity.toLocaleString()}`,
        400,
        'INVALID_QUANTITY'
      );
    }

    const totalNgn = Math.round((service.retailRateNgn / 1000) * cleanQty);
    const sourceCostNgn = Math.round((service.sourceRateNgn / 1000) * cleanQty);
    const profitNgn = totalNgn - sourceCostNgn;
    const orderRef = `ord_smm_${Math.floor(100000 + Math.random() * 900000)}`;

    // Debit Wallet
    walletService.debitWallet(
      userId,
      totalNgn,
      'order_payment',
      `ref_oj_${Math.floor(1000000 + Math.random() * 9000000)}`,
      `SMM Boost: ${service.name} (${cleanQty.toLocaleString()} units)`,
      idempotencyKey,
      orderRef
    );

    // Dispatch to Linkocial API
    let upstreamRes: any;
    try {
      upstreamRes = await linkocialAdapter.placeOrder(
        service.providerServiceId,
        targetLink.trim(),
        cleanQty
      );

      if (upstreamRes.error) {
        throw new Error(upstreamRes.error);
      }
    } catch (smmErr: any) {
      console.error(`[SMM_DISPATCH_FAIL] ${smmErr.message}. Auto-refunding customer...`);
      try {
        walletService.creditWallet(
          userId,
          totalNgn,
          'refund',
          `ref_oj_rf_${Math.floor(1000000 + Math.random() * 9000000)}`,
          `Auto-refund: SMM Provider Maintenance (${orderRef})`,
          `refund_${idempotencyKey}`,
          customerEmail
        );
      } catch (rfErr: any) {
        console.error(`[SMM_AUTO_REFUND_FAIL] ${rfErr.message}`);
      }

      try {
        notificationService.recordAdminNotification({
          id: `notif_smm_${Date.now()}`,
          type: 'SECURITY_ALERT',
          title: '🚨 SMM Upstream Balance / Order Rejection Alert',
          message: `User ${customerEmail} ordered ${service.name} for ₦${totalNgn.toLocaleString()} (${orderRef}), but the upstream SMM provider rejected the order (${smmErr.message}). Wallet was auto-refunded. Please fund your SMM provider balance!`,
          timestamp: new Date().toISOString(),
          read: false,
          userEmail: customerEmail
        });
      } catch {}

      throw new AppError(
        'The SMM boost network node is currently undergoing routine maintenance. Your wallet was NOT charged. Please try again shortly or contact support on WhatsApp (07069659752).',
        503,
        'SMM_UNAVAILABLE'
      );
    }

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
    this.savePersistedOrders();

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
        this.savePersistedOrders();
      }
    }

    return order;
  }

  getOrders(userId?: string, userEmail?: string): SMMOrder[] {
    if (userId || userEmail) {
      const cleanUid = userId?.trim();
      const cleanEmail = userEmail?.toLowerCase().trim();
      return this.orders.filter(o => 
        (cleanUid && o.userId === cleanUid) ||
        (cleanEmail && o.customerEmail?.toLowerCase() === cleanEmail) ||
        (cleanEmail && o.userId?.toLowerCase() === cleanEmail) ||
        (cleanUid && o.customerEmail?.toLowerCase() === cleanUid.toLowerCase())
      );
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
      const multiplier = 1 + (this.config.defaultMarkupPercent / 100);
      this.services.forEach(s => {
        s.retailRateNgn = Math.round(s.sourceRateNgn * multiplier);
      });
      this.savePersistedServices();
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

