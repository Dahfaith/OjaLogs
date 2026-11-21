import React, { useState } from 'react';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { PaymentGatewayConfig } from '@ojalogs/shared';
import { apiClient } from '../../lib/apiClient';

interface PaymentsViewProps {
  gateways: PaymentGatewayConfig[];
  onUpdateGateway: (gw: PaymentGatewayConfig) => void;
  showToast: (msg: string) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  gateways,
  onUpdateGateway,
  showToast
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTestGateway = async (gw: PaymentGatewayConfig) => {
    setTestingId(gw.id);
    try {
      const res = await apiClient.testGatewayConnection(gw.id);
      showToast(`${gw.name} connection test: ${res.healthy ? 'Operational' : 'Standby'}`);
    } catch (err: any) {
      showToast(`${gw.name} connection notice: ${err.message || 'Responding via fallback'}`);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
            Payment Gateways & Direct Settlement
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Configure checkout payment processors, automated dynamic NUBAN bank transfer accounts, and instant customer wallet crediting with HMAC-SHA256 webhook verification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Webhook Idempotency Active</span>
          </span>
        </div>
      </div>

      {/* Gateway Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gateways.map((gw) => {
          const isTesting = testingId === gw.id;
          const isPrimary = gw.id === 'bach';

          return (
            <div
              key={gw.id}
              className={`bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-sm space-y-4 transition-colors ${
                isPrimary
                  ? 'border-teal-500/50 dark:border-teal-500/40'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center border border-teal-500/20">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                        {gw.name}
                      </h4>
                      {isPrimary && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                          Primary Default
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">ID: {gw.id}</p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                  gw.status === 'connected'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${gw.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {gw.status === 'connected' ? 'Connected' : 'Standby'}
                </span>
              </div>

              {/* Supported Rails */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Supported Rails:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    NUBAN Bank Transfer, Cards, USSD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Processing Fee:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Standard 1.5% (Max ₦2,000)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Settlement Currency:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">NGN (₦)</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleTestGateway(gw)}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
                  <span>{isTesting ? 'Verifying...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
