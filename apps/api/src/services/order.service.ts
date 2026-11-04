import { walletService } from './wallet.service.js';
import { serverApiRegistry } from '../adapters/server/server.registry.js';
import { encryptPayload, decryptPayload } from '../utils/crypto.js';
import { AppError } from '../middleware/errorHandler.js';
import { Order, OrderItem } from '@ojalogs/shared';
import { bachGateway } from '../gateways/bach.gateway.js';

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

    // Provision each item through its dedicated Server API adapter!
    const orderItems: OrderItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const adapter = serverApiRegistry.getAdapter(item.serverCluster);
      const provisioned = await adapter.provisionSecret(item.productId, orderRef);

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

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      reference: orderRef,
      createdAt: new Date().toISOString(),
      status: 'completed',
      paymentMethod,
      totalNgn,
      items: orderItems,
      customerEmail
    };

    const userOrders = this.orders.get(userId) || [];
    this.orders.set(userId, [newOrder, ...userOrders]);
    return { ...newOrder, gatewayCheckoutUrl };
  }

  getOrders(userId: string): Order[] {
    return this.orders.get(userId) || [];
  }

  revealSecret(userId: string, orderId: string, orderItemId: string) {
    const userOrders = this.orders.get(userId) || [];
    const order = userOrders.find(o => o.id === orderId);
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
