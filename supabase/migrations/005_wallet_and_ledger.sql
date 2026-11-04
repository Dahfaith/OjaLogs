-- =====================================================================
-- 005_WALLET_AND_LEDGER.SQL
-- Wallets, Immutable Double-Entry Ledger, Payments, and Gateway Events
-- =====================================================================

CREATE TYPE ledger_entry_type AS ENUM ('credit', 'debit');
CREATE TYPE ledger_category AS ENUM (
  'deposit',
  'order_payment',
  'virtual_number_order',
  'refund',
  'adjustment',
  'rental_renewal'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'successful',
  'failed',
  'refunded'
);

-- Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  currency VARCHAR(5) NOT NULL DEFAULT 'NGN',
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_wallet_non_negative CHECK (balance >= 0.00)
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);

-- Wallet Ledger (Strictly Append-Only)
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) NOT NULL UNIQUE, -- ref_oj_...
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type ledger_entry_type NOT NULL,
  category ledger_category NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  balance_after NUMERIC(14, 2) NOT NULL CHECK (balance_after >= 0),
  description TEXT NOT NULL,
  idempotency_key VARCHAR(128) UNIQUE,
  related_order_reference VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_wallet ON public.wallet_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON public.wallet_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON public.wallet_ledger(reference);

-- Enforce Append-Only on wallet_ledger: Disallow UPDATE & DELETE via Trigger
CREATE OR REPLACE FUNCTION public.block_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Immutable Ledger Violation: Modifications or deletions from wallet_ledger are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_ledger_mutation ON public.wallet_ledger;
CREATE TRIGGER trg_block_ledger_mutation
BEFORE UPDATE OR DELETE ON public.wallet_ledger
FOR EACH ROW EXECUTE FUNCTION public.block_ledger_mutation();

-- Payments Table (BACH Gateway)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) NOT NULL UNIQUE, -- ref_oj_...
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gateway VARCHAR(30) NOT NULL DEFAULT 'bach',
  gateway_reference VARCHAR(100),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(5) NOT NULL DEFAULT 'NGN',
  status payment_status NOT NULL DEFAULT 'pending',
  raw_payload_redacted JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);

-- Gateway Events (Idempotency Sink for Webhooks)
CREATE TABLE IF NOT EXISTS public.gateway_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway VARCHAR(30) NOT NULL DEFAULT 'bach',
  event_id VARCHAR(255) NOT NULL UNIQUE, -- Unique Gateway Event Identifier
  event_type VARCHAR(100) NOT NULL,
  raw_body_redacted JSONB NOT NULL,
  processing_status VARCHAR(30) NOT NULL DEFAULT 'processed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

