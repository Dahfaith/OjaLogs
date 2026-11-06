import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Server, Copy, Check, Terminal, Sparkles, Shield, Code, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ApiDocsPage: React.FC = () => {
  const { showToast } = useApp();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    showToast('Copied cURL snippet to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const endpoints = [
    {
      server: 'Server 1 API',
      category: 'VPNs, Residential Proxies & eSIM',
      endpoint: 'GET /api/v1/server1/stock',
      description: 'Fetches real-time inventory levels, proxy subnet allocations, and travel eSIM profiles.',
      curl: `curl -X GET "https://ojalogs-api.onrender.com/api/v1/catalog/products?cluster=Server%201" \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Accept: application/json"`
    },
    {
      server: 'Server 2 API',
      category: 'Social Accounts & Cloud Credits',
      endpoint: 'POST /api/v1/server2/provision',
      description: 'Dispatches instant aged social profiles, Facebook Business Managers, and AWS/DigitalOcean cloud codes.',
      curl: `curl -X POST "https://ojalogs-api.onrender.com/api/v1/orders/checkout" \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items": [{"productId": "prod_soc_01", "quantity": 1}],
    "paymentMethod": "wallet"
  }'`
    },
    {
      server: 'Telephony Gateway API',
      category: 'Division B: Virtual Numbers',
      endpoint: 'POST /api/v1/numbers/allocate',
      description: 'Provisions a carrier-backed phone number for SMS verification with a 15-minute listener countdown.',
      curl: `curl -X POST "https://ojalogs-api.onrender.com/api/v1/numbers/request" \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "countryCode": "US",
    "serviceId": "whatsapp",
    "rentalType": "one_time_sms"
  }'`
    },
    {
      server: 'BACH Payment Gateway',
      category: 'Fintech & NGN Ledger',
      endpoint: 'POST /api/v1/wallet/fund',
      description: 'Initiates a funding request provisioning a safe dynamic bank transfer virtual account.',
      curl: `curl -X POST "https://ojalogs-api.onrender.com/api/v1/wallet/fund" \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 25000,
    "currency": "NGN"
  }'`
    },
    {
      server: 'Standard SMM Reseller API',
      category: 'Social Media Marketing (SMM Protocol v1.0)',
      endpoint: 'POST /api/v1/smm/api',
      description: 'Industry-standard SMM protocol for external panels, bots, and resellers. Supports actions: services, add, status, and balance.',
      curl: `curl -X POST "https://ojalogs-api.onrender.com/api/v1/smm/api" \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "<YOUR_OJALOGS_API_KEY>",
    "action": "services"
  }'`
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-24 md:pb-12 text-oj-midnight dark:text-white">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-oj-muted dark:text-oj-dark-muted">
        <Link to="/" className="hover:text-oj-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-oj-midnight dark:text-white font-semibold">Server API Documentation</span>
      </div>

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-oj-midnight text-white border border-oj-navy relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-oj-cyan/20 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-oj-cyan uppercase tracking-wider">
            <Terminal className="w-4 h-4" />
            <span>Developer Reference · v1.0.0-PRO</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl">
            Logical Server API Gateway
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Direct REST API interfaces connecting to Ojalogs 4 logical server clusters, telephony SMS listener, and BACH banking gateway.
          </p>
        </div>
      </div>

      {/* Base URL & Auth info */}
      <div className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-oj-primary">
            Production Endpoint
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Live on Render
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs flex items-center justify-between overflow-x-auto">
          <code>https://ojalogs-api.onrender.com/api/v1</code>
          <button
            onClick={() => handleCopy('https://ojalogs-api.onrender.com/api/v1', 999)}
            className="p-1 text-slate-400 hover:text-white"
          >
            {copiedIndex === 999 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-xs text-oj-muted">
          All requests must include your secret API key in the <code className="px-1.5 py-0.5 rounded bg-oj-surface-alt dark:bg-oj-dark-surface-alt font-mono text-[11px]">Authorization: Bearer &lt;key&gt;</code> header.
        </p>
      </div>

      {/* Endpoint Cards */}
      <div className="space-y-6">
        <h2 className="font-heading font-bold text-lg">
          Primary Logical Endpoints
        </h2>

        {endpoints.map((ep, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-oj-dark-surface border border-oj-border dark:border-oj-dark-border shadow-soft space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-oj-primary/10 text-oj-primary dark:bg-oj-primary/20 dark:text-oj-cyan">
                  {ep.server}
                </span>
                <span className="text-xs text-oj-muted font-medium">({ep.category})</span>
              </div>
              <span className="font-mono text-xs font-bold text-oj-midnight dark:text-white">
                {ep.endpoint}
              </span>
            </div>

            <p className="text-xs text-oj-muted leading-relaxed">
              {ep.description}
            </p>

            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto">
                <code>{ep.curl}</code>
              </pre>
              <button
                onClick={() => handleCopy(ep.curl, idx)}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Copy snippet"
              >
                {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

