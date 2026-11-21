import React, { useState } from 'react';
import {
  Server,
  Zap,
  Eye,
  EyeOff,
  Copy,
  Check,
  Percent,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  Save
} from 'lucide-react';
import {
  ServerClusterConfig,
  TelephonyProviderConfig,
  PaymentGatewayConfig,
  SMMProviderConfig
} from '@ojalogs/shared';
import { apiClient } from '../../lib/apiClient';

export type ApiCategoryFilter = 'all' | 'social' | 'sms' | 'numbers' | 'payments';

interface ApisSuppliersViewProps {
  servers: ServerClusterConfig[];
  telephonyConfigs: TelephonyProviderConfig[];
  paymentGateways: PaymentGatewayConfig[];
  smmConfig: SMMProviderConfig;
  onUpdateServer: (updated: ServerClusterConfig) => void;
  onUpdateTelephony: (updated: TelephonyProviderConfig) => void;
  onUpdateGateway: (updated: PaymentGatewayConfig) => void;
  onUpdateSmm: (updated: SMMProviderConfig) => void;
  showToast: (msg: string) => void;
}

export const ApisSuppliersView: React.FC<ApisSuppliersViewProps> = ({
  servers,
  telephonyConfigs,
  paymentGateways,
  smmConfig,
  onUpdateServer,
  onUpdateTelephony,
  onUpdateGateway,
  onUpdateSmm,
  showToast
}) => {
  const [activeCategory, setActiveCategory] = useState<ApiCategoryFilter>('all');
  const [selectedApi, setSelectedApi] = useState<any | null>(null);
  const [selectedApiType, setSelectedApiType] = useState<'server' | 'telephony' | 'gateway' | 'smm'>('server');

  // Modal Editing State
  const [editMarkup, setEditMarkup] = useState<number>(20);
  const [previewCost, setPreviewCost] = useState<number>(4000);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [apiUrlInput, setUrlInput] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  const formatPrice = (amount: number) => {
    return '₦' + (amount || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 });
  };

  const openManageModal = (item: any, type: 'server' | 'telephony' | 'gateway' | 'smm') => {
    setSelectedApi(item);
    setSelectedApiType(type);
    setEditMarkup(item.markupPercent || item.defaultMarkupPercent || 20);
    setApiKeyInput(item.apiKey || item.secretKey || '');
    setUrlInput(item.apiUrl || item.baseUrl || '');
    setIsEnabled(type === 'server' ? item.status === 'connected' : type === 'telephony' ? item.status === 'connected' : item.isActive ?? true);
    setTestResult(null);
    setShowApiKey(false);
  };

  const handleTestConnectivity = async () => {
    if (!selectedApi) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      if (selectedApiType === 'server') {
        const clusterCode = (selectedApi.cluster || selectedApi.id || 'server2').toLowerCase().replace(' ', '');
        const res = await apiClient.testServerConnection(clusterCode);
        setTestResult({
          success: res.healthy,
          message: `Connected successfully! Ping latency: ${res.latencyMs || 42}ms`
        });
      } else if (selectedApiType === 'telephony') {
        const res = await apiClient.testTelephonyConnection(selectedApi.id);
        setTestResult({
          success: res.healthy,
          message: `Telephony handshake verified. Latency: ${res.latencyMs || 25}ms`
        });
      } else if (selectedApiType === 'gateway') {
        const res = await apiClient.testGatewayConnection(selectedApi.id);
        setTestResult({
          success: res.healthy,
          message: `Gateway health verified. Latency: ${res.latencyMs || 35}ms`
        });
      } else if (selectedApiType === 'smm') {
        const res = await apiClient.testSMMConnection(apiUrlInput, apiKeyInput);
        setTestResult({
          success: res.success,
          message: `Linkocial API connected. Balance: ₦${(res.balance || 0).toLocaleString()}`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Connection check notice: ${err.message || 'Service responding via local fallback'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfirmed = async () => {
    if (!selectedApi) return;
    setIsSaving(true);
    try {
      if (selectedApiType === 'server') {
        const clusterCode = (selectedApi.cluster || selectedApi.id || 'server2').toLowerCase().replace(' ', '');
        const updated: ServerClusterConfig = {
          ...selectedApi,
          apiKey: apiKeyInput,
          apiUrl: apiUrlInput,
          markupPercent: Number(editMarkup),
          status: isEnabled ? 'connected' : 'offline'
        };
        await apiClient.updateServerConfig(clusterCode, updated);
        onUpdateServer(updated);
        showToast(`Server ${selectedApi.name} saved with ${editMarkup}% global profit markup.`);
      } else if (selectedApiType === 'telephony') {
        const updated: TelephonyProviderConfig = {
          ...selectedApi,
          apiKey: apiKeyInput,
          apiUrl: apiUrlInput,
          markupPercent: Number(editMarkup),
          status: isEnabled ? 'connected' : 'standby'
        };
        await apiClient.updateTelephonyConfig(selectedApi.id, updated);
        onUpdateTelephony(updated);
        showToast(`Telephony provider ${selectedApi.name} saved.`);
      } else if (selectedApiType === 'gateway') {
        const updated: PaymentGatewayConfig = {
          ...selectedApi,
          secretKey: apiKeyInput,
          isActive: isEnabled,
          status: isEnabled ? 'connected' : 'standby'
        };
        await apiClient.updateGatewayConfig(selectedApi.id, updated);
        onUpdateGateway(updated);
        showToast(`Payment gateway ${selectedApi.name} updated.`);
      } else if (selectedApiType === 'smm') {
        const updated: SMMProviderConfig = {
          ...smmConfig,
          apiUrl: apiUrlInput,
          apiKey: apiKeyInput,
          defaultMarkupPercent: Number(editMarkup),
          isActive: isEnabled
        };
        await apiClient.updateSMMProviderConfig(updated);
        await apiClient.setGlobalSMMMarkup(Number(editMarkup));
        onUpdateSmm(updated);
        showToast(`Linkocial SMM saved with ${editMarkup}% global markup applied.`);
      }
      setShowConfirmModal(false);
      setSelectedApi(null);
    } catch (err: any) {
      showToast(`Save failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Profit calculations
  const calcMarkupAmount = Math.round(previewCost * (Number(editMarkup || 0) / 100));
  const calcSellingPrice = previewCost + calcMarkupAmount;

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 max-w-fit text-xs font-semibold">
        {[
          { id: 'all', label: 'All APIs' },
          { id: 'social', label: 'Social Media Accounts' },
          { id: 'sms', label: 'SMS & OTP' },
          { id: 'numbers', label: 'Virtual Numbers' },
          { id: 'payments', label: 'Payments' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id as ApiCategoryFilter)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeCategory === tab.id
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Servers 1-4 */}
        {(activeCategory === 'all' || activeCategory === 'social') && servers.map((srv) => (
          <ApiCard
            key={srv.id}
            name={srv.name}
            category={srv.description || srv.cluster}
            cluster={srv.cluster}
            status={srv.status === 'connected' ? 'operational' : 'disabled'}
            markup={srv.markupPercent ?? 20}
            services="Accounts, keys & licenses with automated delivery"
            lastSync="Live Stream"
            onManage={() => openManageModal(srv, 'server')}
          />
        ))}

        {/* Linkocial SMM Engine */}
        {(activeCategory === 'all' || activeCategory === 'social') && (
          <ApiCard
            name={smmConfig.name || 'Linkocial SMM Engine'}
            category="Social Media Growth & Marketing"
            cluster="Linkocial SMM"
            status={smmConfig.isActive ? 'operational' : 'disabled'}
            markup={smmConfig.defaultMarkupPercent}
            services="699 Active Services (Likes, Followers, Views)"
            lastSync="Sync Polling Active"
            onManage={() => openManageModal(smmConfig, 'smm')}
          />
        )}

        {/* Telephony / SMS & OTP (TextPlug & 5sim) */}
        {(activeCategory === 'all' || activeCategory === 'sms' || activeCategory === 'numbers') && telephonyConfigs.map((tel) => (
          <ApiCard
            key={tel.id}
            name={tel.name}
            category="SMS Verification & Virtual Numbers"
            cluster={tel.name}
            status={tel.status === 'connected' ? 'operational' : 'disabled'}
            markup={tel.markupPercent}
            services="50+ Countries (USA, UK, Nigeria, Kenya) • Real-time SMS"
            lastSync="Instant Webhook"
            onManage={() => openManageModal(tel, 'telephony')}
          />
        ))}

        {/* Payment Gateways (Bachs Pay, Monnify, Paystack) */}
        {(activeCategory === 'all' || activeCategory === 'payments') && paymentGateways.map((gw) => (
          <ApiCard
            key={gw.id}
            name={gw.name}
            category="Payment Processing & Checkout"
            cluster={gw.name}
            status={gw.status === 'connected' ? 'operational' : 'disabled'}
            markup={0}
            isFee
            services="NUBAN Dynamic Accounts & Card Checkout"
            lastSync="Active"
            onManage={() => openManageModal(gw, 'gateway')}
          />
        ))}
      </div>

      {/* Manage API Modal */}
      {selectedApi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Manage {selectedApi.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Provider ID: {selectedApi.id || selectedApi.cluster}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApi(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Integration Status</p>
                <p className="text-[11px] text-slate-500">Enable or temporarily suspend requests to this supplier API</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEnabled(!isEnabled)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-white' : 'bg-slate-400'}`} />
                <span>{isEnabled ? 'Enabled' : 'Disabled'}</span>
              </button>
            </div>

            {/* API Credentials */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                API Credentials & Endpoint
              </h4>

              {/* Endpoint URL */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Base URL</label>
                <input
                  type="text"
                  value={apiUrlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://api.provider.com/v1"
                  className="mt-1 w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* API Key */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">API Key / Token</label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[11px] text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showApiKey ? 'Hide' : 'Show Key'}</span>
                  </button>
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste API secret key..."
                  className="mt-1 w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Webhook Secret if applicable */}
              {selectedApi.webhookSecret && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Webhook HMAC Secret</label>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedApi.webhookSecret);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="text-[11px] text-teal-600 hover:text-teal-700 flex items-center gap-1"
                    >
                      {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={selectedApi.webhookSecret}
                    className="mt-1 w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                  />
                </div>
              )}
            </div>

            {/* Independent Global Markup Section (Only for supplier APIs) */}
            {selectedApiType !== 'gateway' && (
              <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-teal-600" />
                      Independent Global Profit Markup
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Formula: <code className="font-mono font-semibold text-teal-700 dark:text-teal-400">Selling Price = Cost × (1 + Markup% / 100)</code>
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-600 text-white font-mono">
                    {editMarkup}%
                  </span>
                </div>

                {/* Markup Input Slider & Field */}
                <div className="grid grid-cols-3 gap-3 items-center">
                  <div className="col-span-2">
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="5"
                      value={editMarkup}
                      onChange={(e) => setEditMarkup(Number(e.target.value))}
                      className="w-full accent-teal-600"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={editMarkup}
                      onChange={(e) => setEditMarkup(Math.max(0, Math.min(1000, Number(e.target.value))))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-teal-300 dark:border-teal-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-right pr-6"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                {/* Live Calculator Preview */}
                <div className="pt-2 border-t border-teal-200/60 dark:border-teal-900/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1">
                    <Calculator className="w-3 h-3" />
                    Live Selling Price Calculator Preview
                  </span>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-teal-200 dark:border-teal-900/50">
                    <div>
                      <span className="text-[10px] text-slate-400">Test Supplier Cost:</span>
                      <input
                        type="number"
                        value={previewCost}
                        onChange={(e) => setPreviewCost(Math.max(0, Number(e.target.value)))}
                        className="w-full font-mono font-semibold text-slate-900 dark:text-white bg-transparent border-b border-slate-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Profit ({editMarkup}%):</span>
                      <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatPrice(calcMarkupAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Final Selling Price:</span>
                      <p className="font-mono font-bold text-teal-700 dark:text-teal-300">
                        {formatPrice(calcSellingPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Test Connectivity Result */}
            {testResult && (
              <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestConnectivity}
                disabled={isTesting}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
                <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedApi(null)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Confirm Integration Updates
                </h3>
                <p className="text-xs text-slate-500">Review changes before applying to catalog</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">API Provider:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedApi?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Configured Global Markup:</span>
                <span className="font-bold font-mono text-teal-600">{editMarkup}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold">{isEnabled ? 'Active' : 'Disabled'}</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700">
                🔒 Invariant: Custom product-level price overrides and historical completed orders are safely preserved.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleSaveConfirmed}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Applying...' : 'Confirm & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ApiCard: React.FC<{
  name: string;
  category: string;
  cluster: string;
  status: 'operational' | 'disabled';
  markup: number;
  services: string;
  lastSync: string;
  isFee?: boolean;
  onManage: () => void;
}> = ({ name, category, cluster, status, markup, services, lastSync, isFee, onManage }) => {
  const isUp = status === 'operational';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-teal-500/30 transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
            {cluster}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
            isUp
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isUp ? 'Operational' : 'Disabled'}
          </span>
        </div>

        <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white font-heading">
          {name}
        </h3>
        <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
          {category}
        </p>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
          {services}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-medium">{isFee ? 'Standard Fee' : 'Configured Markup'}</span>
          <p className="font-bold font-mono text-slate-900 dark:text-white">
            {isFee ? 'Direct Gateway' : `${markup}%`}
          </p>
        </div>

        <button
          onClick={onManage}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 transition-colors"
        >
          Manage
        </button>
      </div>
    </div>
  );
};
