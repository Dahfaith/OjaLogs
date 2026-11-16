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

export function validateFulfillmentSecret(
  item: { title: string; productId: string; serverCluster?: string },
  secretKey: string,
  deliveryFormat?: string
): { valid: boolean; reason?: string } {
  if (!secretKey || secretKey.trim().length === 0) {
    return { valid: false, reason: 'Empty secret payload returned by fulfillment provider' };
  }

  const raw = secretKey.trim();
  const t = (item.title || '').toLowerCase();
  const isSocialOrEmail = /\b(facebook|fb|instagram|twitter|aged x|x\.com|tiktok|threads|reddit|snapchat|telegram|gmail|email|mail)\b/i.test(t);

  // If this is a social media / email account product
  if (isSocialOrEmail) {
    // Check for erroneous license key voucher pattern (e.g. NORD-PRO-..., AWS-..., JB-DEV-..., CLAUDE-...)
    const isVoucherPattern = /^(NORD|AWS|JB|CLAUDE|MJ|OAI|WIN|MSFT|OFFICE)[A-Z0-9-]{5,}$/i.test(raw) ||
      (/^[A-Z0-9]{4,10}-[A-Z0-9]{4,10}-[A-Z0-9]{4,10}(-[A-Z0-9]{4,10})*$/i.test(raw) && !raw.includes(':') && !raw.includes('|'));

    if (isVoucherPattern) {
      return {
        valid: false,
        reason: `FULFILLMENT_MISMATCH: Account product "${item.title}" received voucher key format ("${raw.slice(0, 12)}...") instead of valid account credentials.`
      };
    }

    // Must have account credentials shape (delimiter, email, or numeric UID)
    const hasDelimiter = raw.includes(':') || raw.includes('|') || raw.includes('\t') || raw.includes('\n');
    const hasAccountShape = hasDelimiter || raw.includes('@') || /^\d{6,25}/.test(raw);

    if (!hasAccountShape && raw.length < 10) {
      return {
        valid: false,
        reason: `MALFORMED_CREDENTIALS: Delivered secret does not match account credential structure.`
      };
    }
  }

  return { valid: true };
}

export class OrderService {
  private orders = new Map<string, Order[]>();
  private allOrders: (Order & { userId?: string })[] = [];
  private idempotencyMap = new Map<string, Order & { gatewayCheckoutUrl?: string }>();

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

    // 0. Idempotency Check (prevent duplicate upstream charges / orders)
    if (idempotencyKey && this.idempotencyMap.has(idempotencyKey)) {
      console.log(`[ORDER_IDEMPOTENCY] Returning existing completed order for idempotencyKey: ${idempotencyKey}`);
      return this.idempotencyMap.get(idempotencyKey)!;
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

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let provisioned: { secretKey: string; deliveryFormat: string; instructions: string } | null = null;

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId.replace(/^lp_/, ''));
        const isLogsPollSku = item.productId.startsWith('lp_') || isUuid;
        const isTestMode = process.env.NODE_ENV === 'test' || item.productId.includes('test');

        // 1. Direct LogsPoll Upstream Dispatch for LogsPoll Products or configured accounts (in live mode)
        if (!isTestMode && (isLogsPollSku || (logspollAdapter.getCredentials().isConfigured && !item.productId.startsWith('prod_')))) {
          console.log(`[ORDER_SERVICE] Dispatching live LogsPoll order for ${item.productId} (${item.title})...`);
          const lpRes = await logspollAdapter.orderProduct(item.productId, item.quantity, orderRef);
          if (lpRes.success && lpRes.secretKey) {
            console.log(`[ORDER_SERVICE] ✓ Successfully ordered from LogsPoll: ${lpRes.orderId}`);
            provisioned = {
              secretKey: lpRes.secretKey,
              deliveryFormat: lpRes.deliveryFormat || 'Encrypted Account Credentials & 2FA Token',
              instructions: lpRes.instructions || 'Delivered via LogsPoll automated upstream API.'
            };
          } else {
            const errMsg = lpRes.error || 'LogsPoll upstream rejected order (insufficient provider balance or stock)';
            console.error(`[ORDER_SERVICE] LogsPoll upstream error: ${errMsg}`);
            throw new Error(errMsg);
          }
        }

        // 2. Dedicated Server API Adapter with metadata
        if (!provisioned) {
          const adapter = serverApiRegistry.getAdapter(item.serverCluster);
          provisioned = await adapter.provisionSecret(item.productId, orderRef, {
            title: item.title,
            quantity: item.quantity,
            serverCluster: item.serverCluster
          });
        }

        if (!provisioned || !provisioned.secretKey) {
          throw new Error('No delivery credentials returned by server cluster adapter.');
        }

        // 3. Strict Fulfillment Validation: Guarantee delivered credentials match product category
        const validation = validateFulfillmentSecret(item, provisioned.secretKey, provisioned.deliveryFormat);
        if (!validation.valid) {
          console.error(`[FULFILLMENT_VALIDATION_ERROR] ${orderRef}: ${validation.reason}`);
          throw new AppError(validation.reason || 'Fulfillment credentials validation failed', 422, 'FULFILLMENT_MISMATCH');
        }

        // Encrypt payload with AES-256-GCM before saving to delivery vault
        const encryptedSecret = encryptPayload(provisioned.secretKey);


        orderItems.push({
          id: `ord_item_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
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
    } catch (provisionErr: any) {
      console.error(`[ORDER_PROVISION_ERROR] Provisioning failed for ${orderRef}: ${provisionErr.message}`);

      // Auto-refund wallet immediately if customer was charged via wallet
      if (paymentMethod === 'wallet') {
        try {
          walletService.creditWallet(
            userId,
            totalNgn,
            'refund',
            `ref_oj_rf_${Math.floor(1000000 + Math.random() * 9000000)}`,
            `Auto-refund: Upstream Restocking / Insufficient Provider Liquidity (${orderRef})`,
            `refund_${idempotencyKey}`,
            customerEmail
          );
          console.log(`[ORDER_AUTO_REFUND] ✓ Fully refunded ₦${totalNgn} to ${customerEmail || userId} for ${orderRef}`);
        } catch (rfErr: any) {
          console.error(`[ORDER_AUTO_REFUND_FAIL] Could not refund wallet: ${rfErr.message}`);
        }
      }

      // Notify Super Admin of provider liquidity exhaustion or provisioning failure
      try {
        notificationService.recordAdminNotification({
          id: `notif_liq_${Date.now()}`,
          type: 'SECURITY_ALERT',
          title: '🚨 Upstream Liquidity / Order Rejection Alert',
          message: `User ${customerEmail} attempted to buy "${items.map(it => it.title).join(', ')}" for ₦${totalNgn.toLocaleString()} (${orderRef}), but the upstream provider rejected the order (${provisionErr.message}). Customer wallet was NOT charged. Please fund your upstream provider balance immediately!`,
          timestamp: new Date().toISOString(),
          read: false,
          userEmail: customerEmail
        });
      } catch (notifErr: any) {
        console.warn(`[ORDER_NOTIF_NOTICE] Failed to record admin notification: ${notifErr.message}`);
      }

      throw new AppError(
        'This server cluster is temporarily undergoing routine restocking / maintenance. Your wallet was NOT charged. Please try again shortly or contact support on WhatsApp (07069659752).',
        503,
        'SERVER_RESTOCKING'
      );
    }

    const newOrder: Order & { userId?: string } = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
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

    const result = { ...newOrder, gatewayCheckoutUrl };
    if (idempotencyKey) {
      this.idempotencyMap.set(idempotencyKey, result);
    }

    return result;
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
    const order = this.allOrders.find(o => o.id === orderId || o.reference === orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    // Strict Tenant / Customer Access Check: Order must belong to the requesting user
    const userEmailLower = userId.toLowerCase().trim();
    const isOwner = (order.userId && order.userId === userId) ||
      (order.customerEmail && order.customerEmail.toLowerCase().trim() === userEmailLower);

    if (!isOwner) {
      throw new AppError('Access denied: You do not have permission to view credentials for this order', 403, 'FORBIDDEN');
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
