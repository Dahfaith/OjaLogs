import fs from 'node:fs';
import path from 'node:path';
import { walletService } from './wallet.service.js';
import { serverApiRegistry } from '../adapters/server/server.registry.js';
import { logspollAdapter } from '../adapters/logspoll/logspoll.adapter.js';
import { encryptPayload, decryptPayload } from '../utils/crypto.js';
import { AppError } from '../middleware/errorHandler.js';
import { Order, OrderItem } from '@ojalogs/shared';
import { bachGateway } from '../gateways/bach.gateway.js';
import { notificationService } from './notification.service.js';
import { supabaseAdmin } from '../config/supabase.js';

const DATA_DIR = fs.existsSync(path.join(process.cwd(), 'apps', 'api', 'data'))
  ? path.join(process.cwd(), 'apps', 'api', 'data')
  : fs.existsSync(path.join(process.cwd(), 'data'))
  ? path.join(process.cwd(), 'data')
  : path.join(process.cwd(), 'data');

const ORDERS_FILE = path.join(DATA_DIR, 'orders_store.json');
const ORDERS_SLUG = '_system_orders_master';

interface CheckoutItemInput {
  productId: string;
  serverCluster: 'Server 1' | 'Server 2' | 'Server 3' | 'Server 4';
  title: string;
  quantity: number;
  unitPriceNgn: number;
}

interface StoredSecret {
  type: string;
  revealed: boolean;
  value: string;
  encryptedPayload: string;
  instruction: string;
  revealCount?: number;
  lastRevealedAt?: string;
}

export class OrderService {
  private orders = new Map<string, Order[]>();
  private allOrders: (Order & { userId?: string })[] = [];

  constructor() {
    this.loadOrders();
    this.loadFromSupabase().catch(() => {});
  }

  private isTestRuntime(): boolean {
    return (
      process.env.NODE_ENV === 'test' ||
      process.argv.some((a) => a.includes('test') || a.includes('vitest'))
    );
  }

  private loadOrders() {
    try {
      if (fs.existsSync(ORDERS_FILE)) {
        const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.allOrders = list;
          this.rebuildUserMap();
        }
      }
    } catch (err: any) {
      console.warn(`[ORDER_STORE] Notice loading disk orders: ${err.message}`);
    }
  }

  private saveOrders() {
    if (this.isTestRuntime()) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(this.allOrders, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn(`[ORDER_STORE] Notice saving disk orders: ${err.message}`);
    }
  }

  async loadFromSupabase(): Promise<void> {
    try {
      const { data, error } = await supabaseAdmin
        .from('site_pages')
        .select('content')
        .eq('slug', ORDERS_SLUG)
        .maybeSingle();

      if (!error && data?.content) {
        const list = JSON.parse(data.content);
        if (Array.isArray(list) && list.length > 0) {
          const existingIds = new Set(this.allOrders.map(o => o.id));
          for (const ord of list) {
            if (!existingIds.has(ord.id)) {
              this.allOrders.push(ord);
              existingIds.add(ord.id);
            }
          }
          this.rebuildUserMap();
        }
      }
    } catch (err: any) {
      console.warn(`[ORDER_SUPABASE] Notice loading orders from Supabase: ${err.message}`);
    }
  }

  async syncToSupabase(): Promise<void> {
    try {
      const payload = JSON.stringify(this.allOrders);
      const { data: existing } = await supabaseAdmin
        .from('site_pages')
        .select('id')
        .eq('slug', ORDERS_SLUG)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from('site_pages')
          .update({
            content: payload,
            last_updated_at: new Date().toISOString()
          })
          .eq('slug', ORDERS_SLUG);
      } else {
        await supabaseAdmin
          .from('site_pages')
          .insert({
            slug: ORDERS_SLUG,
            title: 'Customer Orders Master Store',
            category: 'system',
            summary: 'Persistent customer digital orders and vault secrets',
            content: payload,
            last_updated_at: new Date().toISOString()
          });
      }
    } catch (err: any) {
      console.warn(`[ORDER_SUPABASE] Notice syncing orders to Supabase: ${err.message}`);
    }
  }

  private rebuildUserMap() {
    this.orders.clear();
    for (const ord of this.allOrders) {
      const uId = ord.userId || ord.customerEmail || 'default';
      const current = this.orders.get(uId) || [];
      this.orders.set(uId, [...current, ord]);
    }
  }

  async checkout(
    userId: string,
    customerEmail: string,
    items: CheckoutItemInput[],
    paymentMethod: 'wallet' | 'bach_direct',
    idempotencyKey: string
  ): Promise<Order & { gatewayCheckoutUrl?: string }> {
    if (items.length === 0) {
      throw new AppError('Cannot checkout an empty cart', 400, 'EMPTY_CART');
    }

    const totalNgn = items.reduce((acc, item) => acc + item.unitPriceNgn * item.quantity, 0);
    const orderRef = `ord_oj_${Math.floor(1000 + Math.random() * 9000)}`;
    let gatewayCheckoutUrl: string | undefined;

    // Debit Wallet if Wallet Checkout
    if (paymentMethod === 'wallet') {
      walletService.debitWallet(
        userId,
        totalNgn,
        'order_payment',
        `ref_oj_${Math.floor(1000000 + Math.random() * 9000000)}`,
        `Marketplace order payment (${orderRef})`,
        idempotencyKey,
        orderRef
      );
    } else {
      // Direct BACH Gateway Checkout Session
      const gatewayRes = await bachGateway.initializePayment({
        userId,
        amountNgn: totalNgn,
        customerEmail,
        reference: orderRef,
        metadata: { order_reference: orderRef, idempotencyKey }
      });
      gatewayCheckoutUrl = gatewayRes.checkoutUrl;
    }

    // Provision each item through its dedicated Server API adapter or LogsPoll upstream
    const orderItems: OrderItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let provisioned: { secretKey: string; deliveryFormat: string; instructions: string } | null = null;

      // 1. Direct LogsPoll Upstream Dispatch for LogsPoll Products or configured accounts
      if (item.productId.startsWith('lp_') || (logspollAdapter.getCredentials().isConfigured && !item.productId.includes('test'))) {
        try {
          console.log(`[ORDER_SERVICE] Dispatching live LogsPoll order for ${item.productId} (${item.title})...`);
          const lpRes = await logspollAdapter.orderProduct(item.productId, item.quantity, orderRef);
          if (lpRes.success && lpRes.secretKey) {
            console.log(`[ORDER_SERVICE] ✓ Successfully ordered from LogsPoll: ${lpRes.orderId}`);
            provisioned = {
              secretKey: lpRes.secretKey,
              deliveryFormat: lpRes.deliveryFormat || 'Encrypted Account Credentials & 2FA Token',
              instructions: lpRes.instructions || 'Delivered via LogsPoll automated upstream API.'
            };
          }
        } catch (err: any) {
          console.warn(`[ORDER_SERVICE] LogsPoll live dispatch notice: ${err.message}`);
        }
      }

      // 2. Fallback to Dedicated Server API Adapter with metadata
      if (!provisioned) {
        const adapter = serverApiRegistry.getAdapter(item.serverCluster);
        provisioned = await adapter.provisionSecret(item.productId, orderRef, {
          title: item.title,
          quantity: item.quantity,
          serverCluster: item.serverCluster
        });
      }

      // Encrypt payload with AES-256-GCM before saving to delivery vault
      const encryptedSecret = encryptPayload(provisioned.secretKey);

      orderItems.push({
        id: `ord_item_${Date.now()}_${i}`,
        product: {
          id: item.productId,
          slug: item.productId,
          title: item.title,
          category: 'Marketplace Good',
          categoryId: 'general',
          division: 'A',
          serverCluster: item.serverCluster,
          priceNgn: item.unitPriceNgn,
          inStock: true,
          stockCount: 50,
          rating: 5.0,
          verifiedResale: true,
          coverImage: '',
          summary: '',
          descriptionHtml: '',
          specifications: {} as any,
          deliveryFormat: provisioned.deliveryFormat,
          validityDuration: 'Standard',
          region: 'Global'
        },
        quantity: item.quantity,
        unitPriceNgn: item.unitPriceNgn,
        totalNgn: item.unitPriceNgn * item.quantity,
        deliveredSecrets: [
          {
            type: 'license_key',
            revealed: false,
            encryptedPayload: encryptedSecret,
            value: '••••••••••••••••••••••••••••••',
            instruction: provisioned.instructions
          } as any
        ]
      });
    }

    const newOrder: Order & { userId?: string } = {
      id: `ord_${Date.now()}`,
      reference: orderRef,
      createdAt: new Date().toISOString(),
      status: 'completed',
      paymentMethod,
      totalNgn,
      items: orderItems,
      customerEmail,
      userId
    };

    const userOrders = this.orders.get(userId) || [];
    this.orders.set(userId, [newOrder, ...userOrders]);
    this.allOrders.unshift(newOrder);

    this.saveOrders();
    this.syncToSupabase().catch(() => {});

    // Dispatch automated purchase confirmation to customer and operations alert to admin
    notificationService.recordOrderAlert(newOrder, customerEmail).catch(err => {
      console.warn('[ORDER_NOTIF_ERROR]', err.message);
    });

    return { ...newOrder, gatewayCheckoutUrl };
  }

  getOrders(userId: string, userEmail?: string): Order[] {
    const emailLower = (userEmail || '').toLowerCase().trim();
    const matched = this.allOrders.filter(o => {
      const oEmail = (o.customerEmail || '').toLowerCase().trim();
      return (
        (o.userId && o.userId === userId) ||
        (emailLower && oEmail === emailLower) ||
        (userEmail && o.userId === userEmail)
      );
    });

    return matched.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        deliveredSecrets: (item.deliveredSecrets || []).map((sec: any) => {
          let val = sec.value;
          if ((!val || val.includes('••••')) && sec.encryptedPayload) {
            try {
              val = decryptPayload(sec.encryptedPayload);
            } catch {}
          }
          return {
            ...sec,
            revealed: true,
            value: val || sec.value
          };
        })
      }))
    }));
  }

  getAllOrders(): Order[] {
    return this.allOrders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        deliveredSecrets: (item.deliveredSecrets || []).map((sec: any) => {
          let val = sec.value;
          if ((!val || val.includes('••••')) && sec.encryptedPayload) {
            try {
              val = decryptPayload(sec.encryptedPayload);
            } catch {}
          }
          return {
            ...sec,
            revealed: true,
            value: val || sec.value
          };
        })
      }))
    }));
  }

  getOrder(orderId: string): Order | null {
    return this.allOrders.find(o => o.id === orderId || o.reference === orderId) || null;
  }

  refundOrder(orderId: string, reason?: string): Order {
    const order = this.allOrders.find(o => o.id === orderId || o.reference === orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    if (order.status === 'refunded') {
      return order;
    }

    order.status = 'refunded';

    // Credit customer wallet back
    const uId = order.userId || order.customerEmail || 'default';
    if (order.paymentMethod === 'wallet' && order.totalNgn > 0) {
      walletService.creditWallet(
        uId,
        order.totalNgn,
        'refund',
        `ref_rf_${Math.floor(1000000 + Math.random() * 9000000)}`,
        reason || `Refund for Order ${order.reference}`,
        undefined,
        order.customerEmail
      );
    }

    this.saveOrders();
    this.syncToSupabase().catch(() => {});

    return order;
  }

  revealSecret(userId: string, orderId: string, orderItemId: string) {
    const userOrders = this.orders.get(userId) || [];
    let order = userOrders.find(o => o.id === orderId);
    if (!order) {
      order = this.allOrders.find(o => o.id === orderId);
    }
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    const item = order.items.find(i => i.id === orderItemId);
    if (!item || !item.deliveredSecrets || item.deliveredSecrets.length === 0) {
      throw new AppError('Delivered secret not found for this item', 404, 'ITEM_NOT_FOUND');
    }

    const secretObj = item.deliveredSecrets[0] as unknown as StoredSecret;
    
    // Decrypt AES-256-GCM ciphertext
    let decryptedValue = secretObj.value;
    if (secretObj.encryptedPayload) {
      try {
        decryptedValue = decryptPayload(secretObj.encryptedPayload);
      } catch (err: any) {
        console.error('[VAULT_DECRYPT_FAIL]', err.message);
      }
    }

    // Audit and update reveal metadata
    secretObj.revealed = true;
    secretObj.value = decryptedValue;
    secretObj.revealCount = (secretObj.revealCount || 0) + 1;
    secretObj.lastRevealedAt = new Date().toISOString();

    this.saveOrders();
    this.syncToSupabase().catch(() => {});

    return {
      revealed: true,
      secret: decryptedValue,
      instruction: secretObj.instruction,
      revealCount: secretObj.revealCount,
      lastRevealedAt: secretObj.lastRevealedAt
    };
  }
}

export const orderService = new OrderService();
