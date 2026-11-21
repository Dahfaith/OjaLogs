import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { SEO } from '../components/common/SEO';
import {
  Shield,
  Bell,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  Product,
  ServerClusterConfig,
  PaymentGatewayConfig,
  TelephonyProviderConfig,
  AdminManagedUser,
  AdminNotification,
  Order,
  SMMProviderConfig
} from '@ojalogs/shared';
import { apiClient } from '../lib/apiClient';

// Modular Admin Components
import { AdminSidebar, AdminTabId } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { OverviewView } from '../components/admin/OverviewView';
import { OrdersView } from '../components/admin/OrdersView';
import { ProductsView } from '../components/admin/ProductsView';
import { ApisSuppliersView } from '../components/admin/ApisSuppliersView';
import { CustomersView } from '../components/admin/CustomersView';
import { WalletsLedgerView } from '../components/admin/WalletsLedgerView';
import { PaymentsView } from '../components/admin/PaymentsView';
import { ReportsView } from '../components/admin/ReportsView';
import { AuditLogView } from '../components/admin/AuditLogView';
import { SettingsView } from '../components/admin/SettingsView';

const defaultSmmConfig: SMMProviderConfig = {
  id: 'linkocial_primary',
  name: 'Linkocial SMM Engine',
  apiUrl: 'https://linkocial.com/api/v1',
  apiKey: '8pydsuH2oVPiQ2Lqq0rkA9cmczHbTZKjjXnWLhXD',
  isActive: true,
  autoSyncEnabled: true,
  defaultMarkupPercent: 30,
  connectionStatus: 'connected',
  currency: 'NGN',
  balanceNgn: 1000.00
};

export const AdminPage: React.FC = () => {
  const { user, setUser, role, setRole, products: appProducts, orders: appOrders } = useApp();

  // Navigation State
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Data State
  const [adminOrders, setAdminOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('oj_admin_orders');
      if (saved) return JSON.parse(saved);
    } catch {}
    return appOrders || [];
  });

  const [adminProducts, setAdminProducts] = useState<Product[]>(appProducts || []);

  const [usersList, setUsersList] = useState<AdminManagedUser[]>(() => {
    try {
      const saved = localStorage.getItem('oj_managed_users');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'usr_001', name: 'Admin User', email: 'ojalogs@gmail.com', role: 'admin', balanceNgn: 1045, status: 'active', isVerified: true, totalOrders: 12, createdAt: '2026-11-01' },
      { id: 'usr_002', name: 'Customer Test', email: 'customer@ojalogs.com.ng', role: 'customer', balanceNgn: 320, status: 'active', isVerified: true, totalOrders: 3, createdAt: '2026-11-10' }
    ];
  });

  const [servers, setServers] = useState<ServerClusterConfig[]>([
    {
      id: 'srv_1',
      cluster: 'Server 1',
      name: 'Server 1: VPN, Proxies & eSIM',
      description: 'VPNs, Proxies & Data Plans',
      apiUrl: 'https://vpn-upstream.api.com',
      apiKey: 'sec_srv1_live_token_7721',
      fulfillmentMode: 'automated_api',
      markupPercent: 20,
      status: 'connected',
      latencyMs: 45,
      lastChecked: 'Just now'
    },
    {
      id: 'srv_2',
      cluster: 'Server 2',
      name: 'Server 2: Social Media Accounts',
      description: 'Social Media Accounts & Cloud',
      apiUrl: 'https://logspoll.com/api/reseller/v1',
      apiKey: 'sec_lp_892348_f12b07',
      fulfillmentMode: 'automated_api',
      markupPercent: 20,
      status: 'connected',
      latencyMs: 38,
      lastChecked: 'Just now'
    },
    {
      id: 'srv_3',
      cluster: 'Server 3',
      name: 'Server 3: Software & OS Keys',
      description: 'Software & Operating Systems',
      apiUrl: 'https://keys-upstream.api.com',
      apiKey: 'sec_srv3_token_3391',
      fulfillmentMode: 'vault_inventory',
      markupPercent: 15,
      status: 'connected',
      latencyMs: 62,
      lastChecked: '15 mins ago'
    },
    {
      id: 'srv_4',
      cluster: 'Server 4',
      name: 'Server 4: AI Tools & Dev Subscriptions',
      description: 'AI Subscriptions & Development',
      apiUrl: 'https://ai-upstream.api.com',
      apiKey: 'sec_srv4_token_9918',
      fulfillmentMode: 'hybrid',
      markupPercent: 25,
      status: 'connected',
      latencyMs: 40,
      lastChecked: '5 mins ago'
    }
  ]);

  const [telephonyConfigs, setTelephonyConfigs] = useState<TelephonyProviderConfig[]>([
    {
      id: 'textplug',
      name: 'TextPlug Telephony Hub',
      badge: 'Primary',
      apiUrl: 'https://textplug.net/api/v1',
      apiKey: 'tp_live_99812739812_ojalogs',
      markupPercent: 25,
      autoRefundTimeoutSeconds: 900,
      status: 'connected',
      latencyMs: 32,
      webhookSecret: 'whsec_tp_d8a23bf018a3819c9e'
    },
    {
      id: 'fivesim',
      name: '5sim Global Telephony Backup',
      badge: 'Backup',
      apiUrl: 'https://5sim.net/v1',
      apiKey: 'fivesim_tok_88291029',
      markupPercent: 30,
      autoRefundTimeoutSeconds: 900,
      status: 'standby',
      latencyMs: 85
    }
  ]);

  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig[]>([
    {
      id: 'bach',
      name: 'Bachs Pay Checkout & Dynamic Accounts',
      badge: 'Primary',
      isActive: true,
      isLiveMode: true,
      publicKey: 'pk_live_bach_9912',
      secretKey: 'bach_live_sec_key_99817',
      webhookSecret: 'whsec_bach_88291',
      baseUrl: 'https://api.bachpay.com/v1',
      dynamicAccountsEnabled: true,
      settlementBank: 'Wema Bank',
      settlementAccountNumber: '0123456789',
      status: 'connected',
      latencyMs: 25
    },
    {
      id: 'paystack',
      name: 'Paystack Payment Gateway',
      badge: 'Alternative',
      isActive: false,
      isLiveMode: false,
      publicKey: 'pk_test_paystack_119',
      secretKey: 'sk_live_paystack_88910',
      webhookSecret: 'whsec_pst_8812',
      baseUrl: 'https://api.paystack.co',
      dynamicAccountsEnabled: false,
      settlementBank: 'Access Bank',
      settlementAccountNumber: '9876543210',
      status: 'standby',
      latencyMs: 50
    }
  ]);

  const [smmConfig, setSmmConfig] = useState<SMMProviderConfig>(defaultSmmConfig);
  const [smmStatus, setSmmStatus] = useState({ isConnected: true, balanceNgn: 1000.00 });

  // Sync & Alerts State
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Sync Engine
  const refreshAllAdminData = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setIsSyncingAll(true);
    try {
      const [
        usersRes,
        ordersRes,
        serversRes,
        telephonyRes,
        gatewaysRes,
        notifsRes,
        smmConfigRes
      ] = await Promise.allSettled([
        apiClient.getAdminUsers(),
        apiClient.getAdminOrders(),
        apiClient.getServerConfigs(),
        apiClient.getTelephonyConfigs(),
        apiClient.getGatewayConfigs(),
        apiClient.getAdminNotifications(),
        apiClient.getSMMProviderConfig()
      ]);

      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
        const cleaned = usersRes.value.filter(u => u.email !== 'info.masontyler@gmail.com');
        setUsersList(cleaned);
        try { localStorage.setItem('oj_managed_users', JSON.stringify(cleaned)); } catch {}
      }

      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
        setAdminOrders(ordersRes.value);
        try { localStorage.setItem('oj_admin_orders', JSON.stringify(ordersRes.value)); } catch {}
      }

      if (serversRes.status === 'fulfilled' && Array.isArray(serversRes.value) && serversRes.value.length > 0) {
        setServers(serversRes.value);
      }

      if (telephonyRes.status === 'fulfilled' && Array.isArray(telephonyRes.value) && telephonyRes.value.length > 0) {
        setTelephonyConfigs(telephonyRes.value);
      }

      if (gatewaysRes.status === 'fulfilled' && Array.isArray(gatewaysRes.value) && gatewaysRes.value.length > 0) {
        setPaymentGateways(gatewaysRes.value);
      }

      if (notifsRes.status === 'fulfilled' && Array.isArray(notifsRes.value)) {
        setAdminNotifications(notifsRes.value);
      }

      if (smmConfigRes.status === 'fulfilled' && smmConfigRes.value) {
        setSmmConfig(smmConfigRes.value);
        setSmmStatus({
          isConnected: smmConfigRes.value.isActive ?? true,
          balanceNgn: smmConfigRes.value.balanceNgn || 1000.00
        });
      }

      const now = new Date();
      setLastSyncedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (!options?.silent) {
        showToast('All administrative modules & supplier catalogs synchronized.');
      }
    } catch (err: any) {
      console.warn(`[ADMIN_SYNC] Notice: ${err.message}`);
    } finally {
      if (!options?.silent) setIsSyncingAll(false);
    }
  }, [showToast]);

  // Initial and Periodic Sync (every 30s)
  useEffect(() => {
    refreshAllAdminData({ silent: true });
    const timer = setInterval(() => {
      refreshAllAdminData({ silent: true });
    }, 30000);
    return () => clearInterval(timer);
  }, [refreshAllAdminData]);

  // Authorization Check
  const isAuthorizedEmail = user?.email === 'ojalogs@gmail.com' || user?.email === 'admin@ojalogs.com.ng';
  const isAdmin = role === 'admin' || isAuthorizedEmail;

  useEffect(() => {
    if (isAuthorizedEmail) {
      if (user && user.role !== 'administrator') {
        const upgraded = { ...user, role: 'administrator' as const };
        setUser(upgraded);
        try { localStorage.setItem('oj_user', JSON.stringify(upgraded)); } catch {}
      }
      if (role !== 'admin') {
        setRole('admin');
      }
    }
  }, [isAuthorizedEmail, user, role, setUser, setRole]);

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <SEO title="Admin Console Access" noindex={true} />
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center border border-rose-200 dark:border-rose-800">
            <Shield className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">
            Administrative Access Restricted
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            This area requires authenticated administrator credentials. Please sign in with an authorized administrator email.
          </p>
        </div>
      </div>
    );
  }

  const unreadAlertsCount = adminNotifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col">
      <SEO title="Ojalogs Admin Console | Enterprise Governance" noindex={true} />

      {/* Professional Dark Teal Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        adminEmail={user?.email || 'admin@ojalogs.com.ng'}
        adminRole={user?.role || 'Administrator'}
      />

      {/* Main Administrative Canvas */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Sticky Admin Header */}
        <AdminHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onSyncAll={() => refreshAllAdminData({ silent: false })}
          isSyncing={isSyncingAll}
          lastSyncedTime={lastSyncedTime}
          unreadAlertsCount={unreadAlertsCount}
          onToggleAlerts={() => setIsAlertsOpen(!isAlertsOpen)}
        />

        {/* Dynamic View Routing Canvas */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              orders={adminOrders}
              products={adminProducts}
              users={usersList}
              servers={servers}
              telephonyConfigs={telephonyConfigs}
              smmStatus={smmStatus}
              onSelectTab={setActiveTab}
              onViewOrderDetails={() => setActiveTab('orders')}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              orders={adminOrders}
              onOrderUpdated={(updated) => {
                setAdminOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
              }}
              showToast={showToast}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={adminProducts}
              onProductUpdated={(updated) => {
                setAdminProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
              }}
              showToast={showToast}
            />
          )}

          {activeTab === 'apis' && (
            <ApisSuppliersView
              servers={servers}
              telephonyConfigs={telephonyConfigs}
              paymentGateways={paymentGateways}
              smmConfig={smmConfig}
              onUpdateServer={(updated) => {
                setServers(prev => prev.map(s => s.id === updated.id ? updated : s));
              }}
              onUpdateTelephony={(updated) => {
                setTelephonyConfigs(prev => prev.map(t => t.id === updated.id ? updated : t));
              }}
              onUpdateGateway={(updated) => {
                setPaymentGateways(prev => prev.map(g => g.id === updated.id ? updated : g));
              }}
              onUpdateSmm={(updated) => {
                setSmmConfig(updated);
              }}
              showToast={showToast}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              users={usersList}
              onUserUpdated={(updated) => {
                setUsersList(prev => prev.map(u => u.id === updated.id ? updated : u));
              }}
              showToast={showToast}
              onRefreshUsers={() => refreshAllAdminData({ silent: false })}
              isRefreshing={isSyncingAll}
            />
          )}

          {activeTab === 'wallets' && (
            <WalletsLedgerView
              users={usersList}
              onUserBalanceUpdated={(userId, newBal) => {
                setUsersList(prev => prev.map(u => u.id === userId ? { ...u, balanceNgn: newBal } : u));
              }}
              showToast={showToast}
              adminEmail={user?.email || 'admin@ojalogs.com.ng'}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsView
              gateways={paymentGateways}
              onUpdateGateway={(updated) => {
                setPaymentGateways(prev => prev.map(g => g.id === updated.id ? updated : g));
              }}
              showToast={showToast}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              orders={adminOrders}
              products={adminProducts}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogView
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              showToast={showToast}
              adminEmail={user?.email || 'admin@ojalogs.com.ng'}
            />
          )}
        </main>
      </div>

      {/* Real-Time System Alerts Slide-over Drawer */}
      {isAlertsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAlertsOpen(false)}
          />
          <div className="relative w-full max-w-sm h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-5 flex flex-col z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-600" />
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Real-Time Alerts ({adminNotifications.length})
                </h3>
              </div>
              <button
                onClick={() => setIsAlertsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {adminNotifications.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No active system alerts. All services operating normally.
                </div>
              ) : (
                adminNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg border text-xs space-y-1 transition-colors ${
                      notif.read
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600'
                        : 'bg-teal-50/60 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/40 text-slate-900 dark:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-teal-700 dark:text-teal-300">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
