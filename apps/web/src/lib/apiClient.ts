import {
  Product,
  Order,
  VirtualNumberSession,
  LedgerTransaction,
  CountryOption,
  ServiceOption
} from '@ojalogs/shared';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private token: string = 'mock_jwt_customer_usr_oj_001';

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('oj_auth_token', token);
  }

  getToken(): string {
    return localStorage.getItem('oj_auth_token') || this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
      ...(options.headers as Record<string, string> || {})
    };

    const res = await fetch(url, {
      ...options,
      headers
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.error?.message || `API request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return json.data as T;
  }

  // Catalog
  async getCatalog(params?: { category?: string; serverCluster?: string; search?: string }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.serverCluster) query.set('serverCluster', params.serverCluster);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString();
    return this.request<Product[]>(`/catalog/products${qs ? `?${qs}` : ''}`);
  }

  async getProduct(idOrSlug: string): Promise<Product> {
    return this.request<Product>(`/catalog/products/${idOrSlug}`);
  }

  // Wallet
  async getWalletBalance(): Promise<{ balanceNgn: number; currency: string }> {
    return this.request<{ balanceNgn: number; currency: string }>('/wallet/balance');
  }

  async getLedger(category?: string): Promise<{ transactions: LedgerTransaction[]; count: number }> {
    const qs = category && category !== 'all' ? `?category=${category}` : '';
    return this.request<{ transactions: LedgerTransaction[]; count: number }>(`/wallet/ledger${qs}`);
  }

  async initiateFunding(amountNgn: number): Promise<{
    reference: string;
    amountNgn: number;
    currency: string;
    gateway: string;
    gatewayReference: string;
    checkoutUrl?: string;
    dynamicAccountDetails?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      amountNgn: number;
      expiresInMinutes: number;
    };
  }> {
    const idempotencyKey = `idem_fund_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.request('/wallet/fund', {
      method: 'POST',
      body: JSON.stringify({ amountNgn, idempotencyKey })
    });
  }

  async verifyFunding(paymentReference: string, gatewayReference: string) {
    return this.request('/wallet/verify-fund', {
      method: 'POST',
      body: JSON.stringify({ paymentReference, gatewayReference })
    });
  }

  // Orders
  async checkout(
    items: Array<{
      productId: string;
      serverCluster: 'Server 1' | 'Server 2' | 'Server 3' | 'Server 4';
      title: string;
      quantity: number;
      unitPriceNgn: number;
    }>,
    paymentMethod: 'wallet' | 'bach_direct' = 'wallet'
  ): Promise<Order & { gatewayCheckoutUrl?: string }> {
    const idempotencyKey = `idem_ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.request<Order & { gatewayCheckoutUrl?: string }>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({ items, paymentMethod, idempotencyKey })
    });
  }

  async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/orders');
  }

  async revealSecret(orderId: string, orderItemId: string): Promise<{
    revealed: boolean;
    secret: string;
    instruction: string;
    revealCount?: number;
    lastRevealedAt?: string;
  }> {
    return this.request(`/orders/${orderId}/reveal`, {
      method: 'POST',
      body: JSON.stringify({ orderItemId })
    });
  }

  // Virtual Numbers
  async getNumberOptions(): Promise<{ countries: CountryOption[]; services: ServiceOption[] }> {
    return this.request('/numbers/options');
  }

  async getNumbers(): Promise<VirtualNumberSession[]> {
    return this.request<VirtualNumberSession[]>('/numbers');
  }

  async requestNumber(
    country: CountryOption,
    service: ServiceOption,
    rentalType: 'one_time_sms' | 'long_term_rental' = 'one_time_sms'
  ): Promise<VirtualNumberSession> {
    const idempotencyKey = `idem_num_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.request<VirtualNumberSession>('/numbers/request', {
      method: 'POST',
      body: JSON.stringify({ country, service, rentalType, idempotencyKey })
    });
  }

  async cancelNumber(sessionId: string): Promise<{ cancelled: boolean; refundedAmount: number; refundReference: string }> {
    return this.request(`/numbers/${sessionId}/cancel`, {
      method: 'POST'
    });
  }

  async simulateIncomingSms(sessionId: string, sender?: string, code?: string) {
    return this.request(`/numbers/${sessionId}/simulate-sms`, {
      method: 'POST',
      body: JSON.stringify({ sender, code })
    });
  }

  async renewNumber(sessionId: string): Promise<VirtualNumberSession> {
    const idempotencyKey = `idem_renew_${Date.now()}`;
    return this.request<VirtualNumberSession>(`/numbers/${sessionId}/renew`, {
      method: 'POST',
      body: JSON.stringify({ idempotencyKey })
    });
  }

  // Cron / Reconciliations
  async triggerRentalReconciliation(): Promise<{ expiredCount: number; totalRefundedNgn: number }> {
    return this.request('/cron/reconcile-rentals', {
      method: 'POST'
    });
  }
}

export const apiClient = new ApiClient();
