import {
  Product,
  Order,
  VirtualNumberSession,
  LedgerTransaction,
  CountryOption,
  ServiceOption,
  ServerClusterConfig,
  PaymentGatewayConfig,
  TelephonyProviderConfig,
  AdminManagedUser,
  AdminNotification,
  UserRole
} from '@ojalogs/shared';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://ojalogs-api.onrender.com/api/v1';

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
    
    // Check if authenticated as administrator
    let adminEmail = '';
    try {
      const storedUser = localStorage.getItem('oj_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const emailLower = (parsed.email || '').toLowerCase();
        if (emailLower === 'visioreach@gmail.com' || emailLower === 'ojalogs@gmail.com' || emailLower === 'dahfaith@gmail.com') {
          adminEmail = emailLower;
        }
      }
    } catch {}

    const activeToken = this.getToken();
    const tokenToSend = adminEmail
      ? (activeToken.includes('.') ? activeToken : 'mock_jwt_admin_visioreach')
      : activeToken;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenToSend}`,
      ...(adminEmail ? { 'x-admin-email': adminEmail } : {}),
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

  // Auth
  async sendMagicLink(email: string, redirectTo?: string): Promise<{
    sent: boolean;
    email: string;
    supabaseSent: boolean;
    previewCode?: string;
    message: string;
  }> {
    return this.request('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email, redirectTo })
    });
  }

  async verifyOtp(email: string, token: string): Promise<{
    token: string;
    user: any;
  }> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, token })
    });
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

  // Admin Server Configurations
  async getServerConfigs(): Promise<ServerClusterConfig[]> {
    return this.request<ServerClusterConfig[]>('/admin/servers/configs');
  }

  async updateServerConfig(cluster: string, updates: Partial<ServerClusterConfig>): Promise<ServerClusterConfig> {
    return this.request<ServerClusterConfig>(`/admin/servers/${encodeURIComponent(cluster)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async testServerConnection(cluster: string): Promise<{ healthy: boolean; latencyMs: number; message: string }> {
    return this.request<{ healthy: boolean; latencyMs: number; message: string }>(`/admin/servers/${encodeURIComponent(cluster)}/test`, {
      method: 'POST'
    });
  }

  // Admin Payment Gateways
  async getGatewayConfigs(): Promise<PaymentGatewayConfig[]> {
    return this.request<PaymentGatewayConfig[]>('/admin/gateways/configs');
  }

  async updateGatewayConfig(id: string, updates: Partial<PaymentGatewayConfig>): Promise<PaymentGatewayConfig> {
    return this.request<PaymentGatewayConfig>(`/admin/gateways/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async testGatewayConnection(id: string): Promise<{ healthy: boolean; latencyMs: number; message: string }> {
    return this.request<{ healthy: boolean; latencyMs: number; message: string }>(`/admin/gateways/${encodeURIComponent(id)}/test`, {
      method: 'POST'
    });
  }

  // Admin Telephony Providers
  async getTelephonyConfigs(): Promise<TelephonyProviderConfig[]> {
    return this.request<TelephonyProviderConfig[]>('/admin/numbers/configs');
  }

  async updateTelephonyConfig(id: string, updates: Partial<TelephonyProviderConfig>): Promise<TelephonyProviderConfig> {
    return this.request<TelephonyProviderConfig>(`/admin/numbers/configs/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async testTelephonyConnection(id: string): Promise<{ healthy: boolean; latencyMs: number; message: string }> {
    return this.request<{ healthy: boolean; latencyMs: number; message: string }>(`/admin/numbers/configs/${encodeURIComponent(id)}/test`, {
      method: 'POST'
    });
  }

  // Admin User Management
  async getAdminUsers(): Promise<AdminManagedUser[]> {
    return this.request<AdminManagedUser[]>('/admin/users');
  }

  async updateUserStatus(userId: string, status: 'active' | 'frozen' | 'suspended'): Promise<AdminManagedUser> {
    return this.request<AdminManagedUser>(`/admin/users/${encodeURIComponent(userId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async updateUserRole(userId: string, role: UserRole): Promise<AdminManagedUser> {
    return this.request<AdminManagedUser>(`/admin/users/${encodeURIComponent(userId)}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  }

  async adjustUserBalance(userId: string, amountNgn: number, type: 'credit' | 'debit', reason: string): Promise<AdminManagedUser> {
    return this.request<AdminManagedUser>(`/admin/users/${encodeURIComponent(userId)}/adjust-balance`, {
      method: 'POST',
      body: JSON.stringify({ amountNgn, type, reason })
    });
  }

  // Admin Metrics
  async getAdminMetrics(): Promise<{
    totalRevenueNgn: number;
    walletLiabilitiesNgn: number;
    totalOrders: number;
    activeRentals: number;
    registeredCustomers: number;
    systemHealth: string;
  }> {
    return this.request<{
      totalRevenueNgn: number;
      walletLiabilitiesNgn: number;
      totalOrders: number;
      activeRentals: number;
      registeredCustomers: number;
      systemHealth: string;
    }>('/admin/metrics');
  }

  // Admin Notifications & Signup Alerts
  async getAdminNotifications(): Promise<AdminNotification[]> {
    return this.request<AdminNotification[]>('/admin/notifications');
  }

  async markAdminNotificationsRead(): Promise<AdminNotification[]> {
    return this.request<AdminNotification[]>('/admin/notifications/mark-read', {
      method: 'POST'
    });
  }

  async notifySignupAlert(email: string, name?: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/admin/notifications/signup-alert', {
      method: 'POST',
      body: JSON.stringify({ email, name })
    });
  }

  async testAdminEmailAlert(): Promise<{ success: boolean; message: string; data?: any }> {
    return this.request<{ success: boolean; message: string; data?: any }>('/admin/notifications/test-email', {
      method: 'POST'
    });
  }
}

export const apiClient = new ApiClient();
