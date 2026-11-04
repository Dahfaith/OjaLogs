# Ojalogs Marketplace Platform

> **A digital essentials and goods marketplace that offers verified digital products, accounts, eSIM profiles, proxies, and professional tools.**

Official production repository for **Ojalogs** (`Ojalogs Marketplace Technologies Ltd`).

---

## 🏛️ Platform Architecture

Ojalogs is structured around a single unified account model: **One marketplace, one customer identity, one NGN wallet, one Super Admin panel**, divided into two synchronized business divisions:

```
+---------------------------------------------------------------------------------------------------------+
|                                        OJALOGS MARKETPLACE                                              |
|                                                                                                         |
|  +---------------------------------------------------+  +--------------------------------------------+  |
|  |           DIVISION A: DIGITAL ASSETS              |  |         DIVISION B: VIRTUAL NUMBERS        |  |
|  |  +---------------------------------------------+  |  |  +--------------------------------------+  |  |
|  |  | Server 1: VPNs, Proxies & Travel eSIMs      |  |  |  | 15-Minute Real-Time SMS Listener     |  |  |
|  |  | Server 2: Verified Aged Accounts & Cloud    |  |  |  | Inbound SMS Webhook Receiver         |  |  |
|  |  | Server 3: Developer & OS Licenses          |  |  |  | Automated 100% Wallet Refund Engine  |  |  |
|  |  | Server 4: AI Subscriptions & API Credits    |  |  |  | Renewable 7-Day Long-Term Rentals    |  |  |
|  |  +---------------------------------------------+  |  +--------------------------------------------+  |
|  +---------------------------------------------------+                                                  |
|                                                                                                         |
|  +---------------------------------------------------------------------------------------------------+  |
|  |                                    CORE WALLET & LEDGER ENGINE                                    |  |
|  |  - Append-Only PostgreSQL Transaction Ledger (UPDATE & DELETE triggers blocked at database level)  |  |
|  |  - Row-Level Balance Locks (FOR UPDATE) & Mathematical Integrity Guarantee                          |  |
|  |  - AES-256-GCM Vault Encryption with customer reveal auditing and SHA-256 fingerprint deduplication |  |
|  +---------------------------------------------------------------------------------------------------+  |
|                                                                                                         |
|  +---------------------------------------------------------------------------------------------------+  |
|  |                                  BACH PAYMENT GATEWAY (bachs.io)                                  |  |
|  |  - Dynamic NGN Bank Account Generation (Wema Bank / BACH Pay)                                     |  |
|  |  - Cryptographic Webhook Verification (X-Bachs-Signature-V2 HMAC-SHA256)                          |  |
|  |  - Anti-Replay Timestamp Tolerance (300s) & Idempotent Event Delivery Sinks                        |  |
|  +---------------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------------+
```

---

## 📁 Monorepo Directory Structure

```
ojalogs/
├── apps/
│   ├── web/                    # React 18, Vite, TypeScript, Tailwind CSS, Framer Motion
│   │   ├── src/
│   │   │   ├── components/     # Shell, Navigation, Cart, Modals, Support Drawer
│   │   │   ├── pages/          # Landing, Dashboard, Shop, PDP, VirtualNumbers, Wallet, Orders, Profile, Admin
│   │   │   ├── context/        # AppContext (Connected to real backend with fallback)
│   │   │   └── lib/            # apiClient.ts, mockData.ts
│   │   └── vercel.json         # Production SPA routing & security headers
│   │
│   └── api/                    # Express, TypeScript, Zod, Helmet, Crypto
│       ├── src/
│       │   ├── adapters/       # Multi-Server API Adapters (Server 1, 2, 3, 4)
│       │   ├── gateways/       # BACH Payment Gateway (bachs.io)
│       │   ├── middleware/     # Auth, RBAC, RateLimiter, Idempotency, ErrorHandler
│       │   ├── routes/         # Catalog, Orders, Numbers, Wallet, Webhooks, Cron, Admin
│       │   ├── services/       # OrderService, WalletService, NumbersService, CatalogService
│       │   └── utils/          # AES-256-GCM Vault Cryptography
│       ├── test/               # api.test.ts, bach.test.ts, e2e_phase5.test.ts
│       └── Dockerfile          # Production container build
│
├── packages/
│   └── shared/                 # Canonical TypeScript types, Zod schemas, constants
│
└── supabase/
    ├── migrations/             # 7 PostgreSQL schema migrations (RBAC, Ledger triggers, RLS)
    └── seed.sql                # Production seed data (Server 1-4 catalog)
```

---

## 🚀 Quickstart: Local Development

### 1. Prerequisites
- Node.js `20.x` or higher
- `pnpm` `9.x` (`npm install -g pnpm`)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Start Development Servers
Start both the Frontend and Backend concurrently:
```bash
# Terminal 1: Frontend (Vite) on http://localhost:3000
pnpm dev:web

# Terminal 2: Backend API on http://localhost:4000
pnpm dev:api
```

### 4. Run Automated Test Suites
Run all 48 automated tests across unit, Bach gateway, and E2E business logic:
```bash
pnpm test
```

---

## 💳 BACH Gateway Webhook Setup (When Domain is Ready)

1. Log in to your merchant dashboard on [bachs.io](https://bachs.io).
2. Navigate to **Developers > Webhooks**.
3. Add your webhook endpoint:
   ```
   https://<your-domain.com>/api/v1/webhooks/bach
   ```
4. Copy the Webhook Secret (`whsec_...`) and update your production environment:
   ```env
   BACHS_WEBHOOK_SECRET=whsec_live_your_actual_secret
   BACHS_API_KEY=sk_live_your_actual_key
   BACHS_BASE_URL=https://api.bachs.io/v1
   ```
5. *Before domain purchase:* You can test webhooks locally anytime using our built-in simulator:
   ```bash
   curl -X POST http://localhost:4000/api/v1/webhooks/bach/simulate \
     -H "Content-Type: application/json" \
     -d '{"amountNgn": 50000, "eventType": "collection.succeeded"}'
   ```

---

## 🗄️ Database Setup (Supabase PostgreSQL)

1. Create a project in [Supabase](https://supabase.com).
2. In the Supabase SQL Editor, execute the migration files sequentially from `supabase/migrations/`:
   - `001_identity_and_rbac.sql`
   - `002_catalog_and_server_clusters.sql`
   - `003_immutable_wallet_ledger.sql` *(creates mutation block trigger)*
   - `004_orders_and_encrypted_vault.sql`
   - `005_virtual_numbers_and_telephony.sql`
   - `006_audit_and_activity_logs.sql`
   - `007_rls_and_security.sql`
3. Execute `supabase/seed.sql` to populate initial product listings.

---

## ⏰ Automated Cron Schedules (Auto-Refund Processor)

To automate 100% refunds for expired numbers and reconcile transactions, configure a recurring HTTP POST request every 1 minute to:
```
POST https://<your-api-domain>/api/v1/cron/reconcile-rentals
```
Can be configured via:
- Vercel Cron (`vercel.json`)
- Upstash QStash
- AWS EventBridge / CloudWatch
- Linux `crontab`

---

## 🛡️ Security & Compliance Standards

- **Strict Cryptography:** AES-256-GCM encryption with unique IVs and HMAC authentication tags for delivered credentials.
- **Append-Only Ledger:** Financial ledger tables have database-level triggers blocking `UPDATE` and `DELETE`.
- **Anti-Replay Attack Mitigation:** Webhooks enforce a 300-second timestamp freshness window and idempotent event deduplication.
- **Strict Content Policies:** Zero stolen, leaked, or abusive content. All social accounts and enterprise keys follow authorized resale and transfer protocols.

---

## 📄 License & Proprietary Rights
© 2026 Ojalogs Marketplace Technologies Ltd. All rights reserved.

