import fs from 'node:fs';
import path from 'node:path';
import { walletService } from './wallet.service.js';
import { serverApiRegistry } from '../adapters/server/server.registry.js';
import { ProvisionResult } from '../adapters/server/server.interface.js';
import { logspollAdapter } from '../adapters/logspoll/logspoll.adapter.js';
import { encryptPayload, decryptPayload } from '../utils/crypto.js';
import { AppError } from '../middleware/errorHandler.js';
import { Order, OrderItem, parseCredentialsPayload, SecretField, StructuredAccountPayload } from '@ojalogs/shared';
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
  structuredFields?: SecretField[];
  accounts?: StructuredAccountPayload[];
  rawString?: string;
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
  private inFlightOrders = new Set<string>();

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

    // 0b. Concurrency Protection (prevent concurrent double-checkout)
    const lockKey = idempotencyKey || `${userId}_${items.map(it => it.productId).sort().join('_')}`;
    if (this.inFlightOrders.has(lockKey)) {
      throw new AppError('An order checkout is currently in progress. Please wait a moment.', 409, 'ORDER_IN_PROGRESS');
    }
    this.inFlightOrders.add(lockKey);

    try {
      const totalNgn = items.reduce((acc, item) => acc + item.unitPriceNgn * item.quantity, 0);
    const orderRef = `ord_oj_${Math.floor(1000 + Math.random() * 9000)}`;
    let gatewayCheckoutUrl: string | undefined;

    // 1. Pre-Checkout Wallet Balance Check (Fail before any transaction)
    if (paymentMethod === 'wallet') {
      const currentBalance = walletService.getBalance(userId, customerEmail);
      if (currentBalance < totalNgn) {
        throw new AppError(
          `Insufficient wallet balance. Required: ₦${totalNgn.toLocaleString()}, Available: ₦${currentBalance.toLocaleString()}. Please fund your wallet to complete this purchase.`,
          400,
          'INSUFFICIENT_FUNDS'
        );
      }
    }

    // 2. Pre-Checkout Validation (Server cluster mismatch & Live upstream stock verification)
    const isTestMode = process.env.NODE_ENV === 'test' || items.some(it => it.productId.includes('test'));

    for (const item of items) {
      // Server 1 guard: Server 1 rejects social accounts with cluster mismatch
      if (item.serverCluster === 'Server 1') {
        const titleLower = (item.title || '').toLowerCase();
        if (
          titleLower.includes('facebook') ||
          titleLower.includes('fb') ||
          titleLower.includes('instagram') ||
          titleLower.includes('twitter') ||
          titleLower.includes('tiktok')
        ) {
          throw new AppError(
            'This server cluster is temporarily undergoing routine restocking / maintenance. Your wallet was NOT charged. Please try again shortly or contact support on WhatsApp (07069659752).',
            503,
            'SERVER_RESTOCKING'
          );
        }
      }

      // Live LogsPoll Pre-Checkout Stock & Verification Check
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId.replace(/^lp_/, ''));
      const isLogsPollSku = item.productId.startsWith('lp_') || isUuid;

      const shouldDispatchSupplier = (!isTestMode || process.env.TEST_SUPPLIER_DISPATCH === 'true') &&
        (isLogsPollSku || (logspollAdapter.getCredentials().isConfigured && !item.productId.startsWith('prod_')));

      if (shouldDispatchSupplier) {
        try {
          const avail = await logspollAdapter.validateProductAvailability(item.productId, item.quantity);
          if (!avail.purchasable) {
            if (avail.reason === 'OUT_OF_STOCK') {
              throw new AppError(
                avail.message || `The product "${item.title}" is currently out of stock. Please check back later or choose another item.`,
                400,
                'OUT_OF_STOCK'
              );
            } else if (avail.reason === 'SUPPLIER_UNVERIFIED') {
              throw new AppError(
                `The supplier inventory for "${item.title}" is currently undergoing routine stock verification. Please try again shortly.`,
                400,
                'SUPPLIER_UNVERIFIED'
              );
            } else {
              throw new AppError(
                avail.message || `The product "${item.title}" is currently unavailable.`,
                400,
                'PRODUCT_UNAVAILABLE'
              );
            }
          }
        } catch (vErr: any) {
          if (vErr instanceof AppError) throw vErr;
          console.warn(`[ORDER_PRECHECK_NOTICE] ${vErr.message}`);
        }
      }
    }

    // 3. Debit Wallet (only after all pre-flight checks pass cleanly)
    if (paymentMethod === 'wallet') {
      walletService.debitWallet(
        userId,
        totalNgn,
        'order_payment',
        `ref_oj_${Math.floor(1000000 + Math.random() * 9000000)}`,
        `Marketplace order payment (${orderRef})`,
        idempotencyKey,
        orderRef,
        customerEmail
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
    let hasPendingManualFulfillment = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let provisioned: ProvisionResult | null = null;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId.replace(/^lp_/, ''));
      const isLogsPollSku = item.productId.startsWith('lp_') || isUuid;

      // If Bach Direct, skip upstream automated provisioning until payment is completed
      if (paymentMethod === 'bach_direct') {
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
            deliveryFormat: 'Automated / Manual Fulfillment',
            validityDuration: 'Standard',
            region: 'Global'
          },
          quantity: item.quantity,
          unitPriceNgn: item.unitPriceNgn,
          totalNgn: item.unitPriceNgn * item.quantity,
          deliveredSecrets: []
        });
        continue;
      }

      // Check if item is designated for manual operations fulfillment
      const isManual = (item.title || '').toLowerCase().includes('manual fulfillment') ||
        (item.serverCluster === 'Server 2' && (item.title || '').toLowerCase().includes('manual'));

      if (isManual && !isTestMode) {
        hasPendingManualFulfillment = true;
        orderItems.push({
          id: `ord_item_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          product: {
            id: item.productId,
            slug: item.productId,
            title: item.title,
            category: 'Social Media Accounts',
            categoryId: 'social-media',
            division: 'A',
            serverCluster: item.serverCluster,
            priceNgn: item.unitPriceNgn,
            inStock: true,
            stockCount: 50,
            rating: 5.0,
            verifiedResale: true,
            coverImage: '',
            summary: 'Aged social media account pending operations manual verification.',
            descriptionHtml: `<p>${item.title}</p><p>Guaranteed authentic delivery via Ojalogs operations team.</p>`,
            specifications: {
              title: item.title,
              serverOrigin: `${item.serverCluster} (Verified Stock)`,
              deliveryType: 'manual_fulfillment',
              validityDuration: 'Permanent Access',
              fulfillmentSpeed: 'Operations Manual Fulfillment'
            } as any,
            deliveryFormat: 'Manual fulfillment',
            validityDuration: 'Permanent',
            region: 'Global'
          },
          quantity: item.quantity,
          unitPriceNgn: item.unitPriceNgn,
          totalNgn: item.unitPriceNgn * item.quantity,
          deliveredSecrets: [
            {
              type: 'pending_fulfillment',
              revealed: false,
              value: 'PENDING_DISPATCH',
              encryptedPayload: '',
              instruction: 'Order verified & confirmed. Our operations desk is preparing and verifying your login credentials from the provider fleet. They will appear here in your vault shortly. For priority dispatch, contact support on WhatsApp (07069659752).'
            } as any
          ]
        });

        // Notify admin of manual fulfillment dispatch needed
        try {
          notificationService.recordAdminNotification({
            id: `notif_manual_${Date.now()}_${i}`,
            type: 'ORDER_PLACED',
            title: '📋 New Manual Fulfillment Order',
            message: `Customer ${customerEmail} placed manual fulfillment order ${orderRef} for "${item.title}". Please fulfill credentials in Admin Console.`,
            timestamp: new Date().toISOString(),
            read: false,
            userEmail: customerEmail
          });
        } catch {}

        continue;
      }

      // 1. Direct LogsPoll Upstream Dispatch for LogsPoll Products or configured accounts (in live mode)
      let upstreamError: string | null = null;
      let upstreamOrderId: string | number | undefined = undefined;
      let upstreamReference: string | undefined = undefined;

      const shouldDispatchSupplier = (!isTestMode || process.env.TEST_SUPPLIER_DISPATCH === 'true') &&
        (isLogsPollSku || (logspollAdapter.getCredentials().isConfigured && !item.productId.startsWith('prod_')));

      if (shouldDispatchSupplier) {
        try {
          console.log(`[ORDER_SERVICE] Dispatching live LogsPoll order for ${item.productId} (${item.title})...`);
          const lpRes = await logspollAdapter.orderProduct(item.productId, item.quantity, orderRef);
          upstreamOrderId = lpRes.orderId;
          upstreamReference = lpRes.reference;

          if (lpRes.success && lpRes.secretKey) {
            console.log(`[ORDER_SERVICE] ✓ Successfully ordered from LogsPoll: ${lpRes.orderId}`);
            provisioned = {
              secretKey: lpRes.secretKey,
              deliveryFormat: lpRes.deliveryFormat || 'Encrypted Account Credentials & 2FA Token',
              instructions: lpRes.instructions || 'Delivered via LogsPoll automated upstream API.',
              externalTransactionId: `lp_${lpRes.orderId || Date.now()}`,
              structuredFields: lpRes.structuredFields,
              structuredAccounts: lpRes.structuredAccounts,
              rawString: lpRes.rawString
            };
          } else {
            upstreamError = lpRes.error || null;
            console.warn(`[ORDER_SERVICE] LogsPoll upstream notice for ${item.productId}: ${upstreamError || 'Pending manual fulfillment'}`);
            // Note: If orderId exists, the supplier accepted the order and debited balance! Never auto-refund.
            hasPendingManualFulfillment = true;
          }
        } catch (lpErr: any) {
          upstreamError = lpErr.message;
          console.warn(`[ORDER_SERVICE] LogsPoll error notice: ${lpErr.message}`);
          hasPendingManualFulfillment = true;
        }
      }

      // 2. Dedicated Server API Adapter with metadata (if not already provisioned and no pending manual item)
      if (!provisioned && !hasPendingManualFulfillment) {
        try {
          const adapter = serverApiRegistry.getAdapter(item.serverCluster);
          provisioned = await adapter.provisionSecret(item.productId, orderRef, {
            title: item.title,
            quantity: item.quantity,
            serverCluster: item.serverCluster
          });
        } catch (adapterErr: any) {
          console.warn(`[ORDER_SERVICE] Adapter notice for ${item.productId}: ${adapterErr.message}`);
          hasPendingManualFulfillment = true;
        }
      }

      // 3. Strict Fulfillment Validation: Guarantee delivered credentials match product category
      if (provisioned && provisioned.secretKey) {
        const validation = validateFulfillmentSecret(item, provisioned.secretKey, provisioned.deliveryFormat);
        if (!validation.valid) {
          console.error(`[FULFILLMENT_VALIDATION_ERROR] ${orderRef}: ${validation.reason}`);
          provisioned = null; // Do not deliver invalid secret; transition to manual review
          hasPendingManualFulfillment = true;
        }
      }

      if (provisioned && provisioned.secretKey) {
        // Encrypt payload with AES-256-GCM before saving to delivery vault
        const encryptedSecret = encryptPayload(provisioned.secretKey);

        // Extract structured credentials or parse raw payload accurately
        const parsed = (provisioned.structuredFields && provisioned.structuredFields.length > 0)
          ? {
              isStructured: true,
              fields: provisioned.structuredFields,
              accounts: provisioned.structuredAccounts || [
                {
                  accountNumber: 1,
                  title: 'Account Credentials',
                  fields: provisioned.structuredFields,
                  raw: provisioned.rawString || provisioned.secretKey
                }
              ],
              raw: provisioned.rawString || provisioned.secretKey
            }
          : parseCredentialsPayload(provisioned.secretKey, item.title, provisioned.deliveryFormat);

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
              rawString: provisioned.secretKey,
              instruction: provisioned.instructions,
              structuredFields: parsed.fields,
              accounts: parsed.accounts
            } as any
          ]
        });
      } else {
        // Upstream automated API is pending, unverified, restocking, or network-delayed:
        // Hold order safely in "processing" state. Customer wallet is charged and payment is preserved!
        // DO NOT automatically refund customer! Flag for operations review / manual dispatch.
        hasPendingManualFulfillment = true;

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
            specifications: {
              title: item.title,
              supplierOrderId: upstreamOrderId,
              supplierReference: upstreamReference
            } as any,
            deliveryFormat: 'Manual fulfillment / Supplier Extraction',
            validityDuration: 'Standard',
            region: 'Global'
          },
          quantity: item.quantity,
          unitPriceNgn: item.unitPriceNgn,
          totalNgn: item.unitPriceNgn * item.quantity,
          deliveredSecrets: [
            {
              type: 'pending_fulfillment',
              revealed: false,
              value: 'PENDING_DISPATCH',
              encryptedPayload: '',
              instruction: 'Order verified & confirmed. Our operations desk is preparing and verifying your login credentials from the provider fleet. They will appear here in your vault shortly. For priority dispatch, contact support on WhatsApp (07069659752).'
            } as any
          ]
        });

        // Notify Super Admin of manual review / dispatch required
        try {
          notificationService.recordAdminNotification({
            id: `notif_pending_disp_${Date.now()}_${i}`,
            type: 'SECURITY_ALERT',
            title: '⚠️ Fulfillment In Progress - Operations Review Required',
            message: `User ${customerEmail} paid ₦${(item.unitPriceNgn * item.quantity).toLocaleString()} for "${item.title}" (${orderRef}). Supplier response: ${upstreamError || 'Pending extraction / unverified'}. Payment preserved in PROCESSING (NO auto-refund). Verify supplier ledger or dispatch manually in Admin Console.`,
            timestamp: new Date().toISOString(),
            read: false,
            userEmail: customerEmail
          });
        } catch {}
      }
    }

    const orderStatus: Order['status'] = paymentMethod === 'bach_direct'
      ? 'pending'
      : (hasPendingManualFulfillment ? 'processing' : 'completed');

    const newOrder: Order & { userId?: string; fulfillmentStatus?: string } = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      reference: orderRef,
      createdAt: new Date().toISOString(),
      status: orderStatus,
      fulfillmentStatus: hasPendingManualFulfillment ? 'reconciliation_required' : 'completed',
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
    } finally {
      this.inFlightOrders.delete(lockKey);
    }
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

          let structuredFields = sec.structuredFields;
          let accounts = sec.accounts;
          let rawString = sec.rawString || val;
          if ((!structuredFields || structuredFields.length === 0) && val && !val.includes('••••')) {
            const parsed = parseCredentialsPayload(val, item.product?.title || '', item.product?.deliveryFormat || '');
            structuredFields = parsed.fields;
            accounts = parsed.accounts;
            rawString = parsed.raw;
          }

          return {
            ...sec,
            type: structuredFields?.some((f: any) => f.type === 'email' || f.type === 'uid') ? 'account' : (sec.type || 'license_key'),
            revealed: true,
            value: val || sec.value,
            rawString: rawString || val,
            structuredFields,
            accounts
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

          let structuredFields = sec.structuredFields;
          let accounts = sec.accounts;
          let rawString = sec.rawString || val;
          if ((!structuredFields || structuredFields.length === 0) && val && !val.includes('••••')) {
            const parsed = parseCredentialsPayload(val, item.product?.title || '', item.product?.deliveryFormat || '');
            structuredFields = parsed.fields;
            accounts = parsed.accounts;
            rawString = parsed.raw;
          }

          return {
            ...sec,
            type: structuredFields?.some((f: any) => f.type === 'email' || f.type === 'uid') ? 'account' : (sec.type || 'license_key'),
            revealed: true,
            value: val || sec.value,
            rawString: rawString || val,
            structuredFields,
            accounts
          };
        })
      }))
    }));
  }

  getOrder(orderId: string): Order | null {
    return this.allOrders.find(o => o.id === orderId || o.reference === orderId) || null;
  }

  refundOrder(orderId: string, reason?: string, adminEmail?: string): Order {
    const order = this.allOrders.find(o => o.id === orderId || o.reference === orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    if (order.status === 'refunded') {
      return order;
    }

    order.status = 'refunded';
    (order as any).fulfillmentStatus = 'refunded';
    (order as any).refundDetails = {
      refundedAt: new Date().toISOString(),
      refundedBy: adminEmail || 'admin@ojalogs.com.ng',
      reason: reason || 'Authorized manual refund issued by operations administrator'
    };

    // Credit customer wallet back safely
    const uId = order.userId || order.customerEmail || 'default';
    if (order.paymentMethod === 'wallet' && order.totalNgn > 0) {
      walletService.creditWallet(
        uId,
        order.totalNgn,
        'refund',
        `ref_rf_${Math.floor(1000000 + Math.random() * 9000000)}`,
        reason || `Manual Admin Refund for Order ${order.reference}`,
        undefined,
        order.customerEmail
      );
    }

    this.saveOrders();
    this.syncToSupabase().catch(() => {});

    try {
      notificationService.recordAdminNotification({
        id: `notif_manual_refund_${Date.now()}`,
        type: 'SECURITY_ALERT',
        title: '↩ Manual Refund Issued by Admin',
        message: `Administrator ${adminEmail || 'admin@ojalogs.com.ng'} issued ₦${order.totalNgn.toLocaleString()} refund for order ${order.reference}. Reason: ${reason || 'Manual authorization'}.`,
        timestamp: new Date().toISOString(),
        read: false,
        userEmail: order.customerEmail
      });
    } catch {}

    return order;
  }

  dispatchManualSecret(orderId: string, orderItemId: string, secretValue: string, instructions?: string): Order {
    const order = this.allOrders.find(o => o.id === orderId || o.reference === orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    const item = order.items.find(i => i.id === orderItemId) || order.items[0];
    if (!item) {
      throw new AppError('Order item not found', 404, 'ITEM_NOT_FOUND');
    }

    const trimmedSecret = secretValue.trim();
    const encryptedSecret = encryptPayload(trimmedSecret);
    const parsed = parseCredentialsPayload(trimmedSecret, item.product?.title || '', item.product?.deliveryFormat || '');

    item.deliveredSecrets = [
      {
        type: parsed.fields.some(f => f.type === 'email' || f.type === 'uid') ? 'account' : 'license_key',
        revealed: false,
        encryptedPayload: encryptedSecret,
        value: trimmedSecret,
        rawString: trimmedSecret,
        structuredFields: parsed.fields,
        accounts: parsed.accounts,
        instruction: instructions || 'Dispatched by Ojalogs Operations Team. Secure with 2FA.'
      } as any
    ];

    // If all items have secrets, transition order to completed
    const allDelivered = order.items.every(
      it => it.deliveredSecrets && it.deliveredSecrets.length > 0 && it.deliveredSecrets[0].value !== 'PENDING_DISPATCH'
    );
    if (allDelivered) {
      order.status = 'completed';
    }

    this.saveOrders();
    this.syncToSupabase().catch(() => {});

    // Notify customer
    try {
      notificationService.recordAdminNotification({
        id: `notif_disp_${Date.now()}`,
        type: 'ORDER_PLACED',
        title: `Credentials Dispatched: ${order.reference}`,
        message: `Credentials have been securely dispatched to ${order.customerEmail}'s vault for ${item.product.title}.`,
        timestamp: new Date().toISOString(),
        read: false,
        userEmail: order.customerEmail
      });
    } catch {}

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
    
    // If pending dispatch, return helpful message without throwing error
    if (secretObj.value === 'PENDING_DISPATCH' || secretObj.type === ('pending_fulfillment' as any)) {
      return {
        revealed: false,
        secret: 'PENDING_DISPATCH',
        instruction: secretObj.instruction || 'Credentials pending manual verification and dispatch by operations team.',
        revealCount: 0,
        lastRevealedAt: new Date().toISOString()
      };
    }

    // Decrypt AES-256-GCM ciphertext
    let decryptedValue = secretObj.value;
    if (secretObj.encryptedPayload) {
      try {
        decryptedValue = decryptPayload(secretObj.encryptedPayload);
      } catch (err: any) {
        console.error('[VAULT_DECRYPT_FAIL]', err.message);
      }
    }

    // Hydrate structured fields if missing
    let structuredFields = (secretObj as any).structuredFields;
    let accounts = (secretObj as any).accounts;
    let rawString = (secretObj as any).rawString || decryptedValue;
    if ((!structuredFields || structuredFields.length === 0) && decryptedValue && !decryptedValue.includes('••••')) {
      const parsed = parseCredentialsPayload(decryptedValue, item.product?.title || '', item.product?.deliveryFormat || '');
      structuredFields = parsed.fields;
      accounts = parsed.accounts;
      rawString = parsed.raw;
    }

    // Audit and update reveal metadata
    secretObj.revealed = true;
    secretObj.value = decryptedValue;
    secretObj.type = structuredFields?.some((f: any) => f.type === 'email' || f.type === 'uid') ? 'account' : (secretObj.type || 'license_key');
    (secretObj as any).structuredFields = structuredFields;
    (secretObj as any).accounts = accounts;
    (secretObj as any).rawString = rawString;
    secretObj.revealCount = (secretObj.revealCount || 0) + 1;
    secretObj.lastRevealedAt = new Date().toISOString();

    this.saveOrders();
    this.syncToSupabase().catch(() => {});

    return {
      revealed: true,
      secret: decryptedValue,
      rawString,
      structuredFields,
      accounts,
      instruction: secretObj.instruction,
      revealCount: secretObj.revealCount,
      lastRevealedAt: secretObj.lastRevealedAt
    };
  }
}

export const orderService = new OrderService();
