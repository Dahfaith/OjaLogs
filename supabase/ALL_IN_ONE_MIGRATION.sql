-- =====================================================================
-- OJALOGS PLATFORM - COMPLETE ALL-IN-ONE SUPABASE DATABASE SCHEMA & SEED
-- Ojalogs Marketplace Technologies Ltd (2026)
--
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/vbhvorgjeivvvjktspee
-- 2. Go to the "SQL Editor" on the left navigation bar.
-- 3. Click "+ New query", paste this entire script, and click "Run".
-- 4. That is all! All tables, RLS policies, triggers, and products will be created.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. ENUM TYPES (Idempotent: Safe to run multiple times)
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE app_role AS ENUM (
    'guest',
    'customer',
    'support_agent',
    'administrator',
    'super_administrator',
    'seller'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('active', 'draft', 'archived', 'force_disabled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE delivery_type AS ENUM ('instant_automated', 'manual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_status AS ENUM ('available', 'reserved', 'sold', 'revoked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('wallet', 'bach_direct');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE number_session_status AS ENUM ('requesting', 'active', 'sms_received', 'expired', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE rental_type AS ENUM ('one_time_sms', 'long_term_rental');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ledger_entry_type AS ENUM ('credit', 'debit');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ledger_category AS ENUM (
    'deposit',
    'order_payment',
    'virtual_number_order',
    'refund',
    'adjustment',
    'rental_renewal'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'successful', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_category AS ENUM ('order_issue', 'number_issue', 'wallet_payment', 'general');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE abuse_category AS ENUM ('fraud', 'spam', 'unauthorized_access', 'policy_violation');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE abuse_status AS ENUM ('investigating', 'actioned', 'dismissed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================================
-- 2. USER PROFILES & RBAC TABLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(30),
  avatar_url TEXT,
  role app_role NOT NULL DEFAULT 'customer',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  preferences JSONB NOT NULL DEFAULT '{"theme": "light", "hide_wallet_balance": false, "transaction_alerts": true, "currency": "NGN"}'::jsonb,
  acceptable_use_accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role app_role NOT NULL,
  permission_slug VARCHAR(100) NOT NULL REFERENCES public.permissions(slug) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_slug)
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip_address VARCHAR(45),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  before_state JSONB,
  after_state JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.admin_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.admin_audit_logs(created_at);

-- =====================================================================
-- 3. CATALOG, INVENTORY & SUPPLIERS TABLES (DIVISION A)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  division VARCHAR(5) NOT NULL DEFAULT 'A',
  icon VARCHAR(50) NOT NULL DEFAULT 'Sparkles',
  description TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  approval_status VARCHAR(30) NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  server_tier VARCHAR(50) NOT NULL,
  api_endpoint TEXT,
  encrypted_credentials TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id VARCHAR(100) PRIMARY KEY,
  slug VARCHAR(150) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  category_id VARCHAR(50) NOT NULL REFERENCES public.categories(id),
  division VARCHAR(5) NOT NULL DEFAULT 'A',
  server_cluster VARCHAR(50) NOT NULL DEFAULT 'Server 1',
  price_ngn NUMERIC(12, 2) NOT NULL CHECK (price_ngn >= 0),
  in_stock BOOLEAN NOT NULL DEFAULT true,
  stock_count INTEGER NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  rating NUMERIC(3, 1) NOT NULL DEFAULT 5.0,
  verified_resale BOOLEAN NOT NULL DEFAULT true,
  cover_image TEXT NOT NULL,
  summary TEXT NOT NULL,
  description_html TEXT NOT NULL,
  delivery_format VARCHAR(100) NOT NULL,
  validity_duration VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL DEFAULT 'Global',
  delivery_type delivery_type NOT NULL DEFAULT 'instant_automated',
  status product_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id VARCHAR(100) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id),
  encrypted_payload TEXT NOT NULL, -- AES-256-GCM ciphertext
  hash_fingerprint VARCHAR(64) NOT NULL UNIQUE,
  status inventory_status NOT NULL DEFAULT 'available',
  reserved_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_product ON public.inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_status ON public.inventory_items(status);

CREATE TABLE IF NOT EXISTS public.favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- =====================================================================
-- 4. CARTS, ORDERS & ENCRYPTED VAULT TABLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_ngn NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'pending',
  payment_method payment_method NOT NULL DEFAULT 'wallet',
  total_ngn NUMERIC(14, 2) NOT NULL CHECK (total_ngn >= 0),
  idempotency_key VARCHAR(128) UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON public.orders(reference);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_ngn NUMERIC(12, 2) NOT NULL,
  total_ngn NUMERIC(14, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  encrypted_secret TEXT NOT NULL,
  instructions TEXT NOT NULL,
  reveal_count INTEGER NOT NULL DEFAULT 0,
  first_revealed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliv_order ON public.deliveries(order_id);

-- =====================================================================
-- 5. VIRTUAL NUMBERS & TELEPHONY TABLES (DIVISION B)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.sms_providers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  adapter_type VARCHAR(50) NOT NULL DEFAULT 'mock',
  base_url TEXT,
  encrypted_credentials TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority_rank INTEGER NOT NULL DEFAULT 1,
  balance_cached NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  last_health_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_countries (
  code VARCHAR(5) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  dial_code VARCHAR(10) NOT NULL,
  flag VARCHAR(10) NOT NULL,
  available_numbers INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.provider_services (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price_ngn NUMERIC(10, 2) NOT NULL,
  success_rate NUMERIC(4, 1) NOT NULL DEFAULT 98.0,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.number_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id VARCHAR(50) REFERENCES public.sms_providers(id),
  country_code VARCHAR(5) NOT NULL REFERENCES public.provider_countries(code),
  service_id VARCHAR(50) NOT NULL REFERENCES public.provider_services(id),
  phone_number VARCHAR(35) NOT NULL,
  rental_type rental_type NOT NULL DEFAULT 'one_time_sms',
  status number_session_status NOT NULL DEFAULT 'active',
  price_ngn NUMERIC(10, 2) NOT NULL,
  time_remaining_seconds INTEGER NOT NULL DEFAULT 900,
  expires_at TIMESTAMPTZ NOT NULL,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_num_req_user ON public.number_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_num_req_status ON public.number_requests(status);

CREATE TABLE IF NOT EXISTS public.sms_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number_request_id UUID NOT NULL REFERENCES public.number_requests(id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL,
  full_text TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_request ON public.sms_messages(number_request_id);

-- =====================================================================
-- 6. WALLET, IMMUTABLE LEDGER & BACH PAYMENTS TABLES
-- =====================================================================

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

CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) NOT NULL UNIQUE,
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

-- Trigger: Block UPDATE or DELETE on wallet_ledger
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

-- Payments Table (BACH Gateway records)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) NOT NULL UNIQUE,
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

-- Gateway Events (Idempotency Sink for Bachs Webhooks)
CREATE TABLE IF NOT EXISTS public.gateway_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway VARCHAR(30) NOT NULL DEFAULT 'bach',
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  raw_body_redacted JSONB NOT NULL,
  processing_status VARCHAR(30) NOT NULL DEFAULT 'processed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 7. SUPPORT TICKETS, ABUSE & NOTIFICATIONS TABLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(30) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category ticket_category NOT NULL DEFAULT 'order_issue',
  subject VARCHAR(200) NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  is_staff_reply BOOLEAN NOT NULL DEFAULT false,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.abuse_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_email VARCHAR(255) NOT NULL,
  reporter_ip VARCHAR(45),
  violation_category abuse_category NOT NULL,
  target_identifier VARCHAR(150) NOT NULL,
  details TEXT NOT NULL,
  status abuse_status NOT NULL DEFAULT 'investigating',
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abuse_status ON public.abuse_reports(status);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notifications(user_id);

-- =====================================================================
-- 8. AUTOMATIC MAGIC-LINK PROFILE & WALLET PROVISIONING TRIGGER
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_name TEXT;
  name_first TEXT;
  name_last TEXT;
BEGIN
  extracted_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  name_first := split_part(extracted_name, ' ', 1);
  name_last := COALESCE(nullif(split_part(extracted_name, ' ', 2), ''), 'Customer');

  -- 1. Create or update profile
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email,
    role,
    is_verified
  ) VALUES (
    new.id,
    INITCAP(name_first),
    INITCAP(name_last),
    new.email,
    'customer',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- 2. Create personal NGN wallet automatically
  INSERT INTO public.wallets (
    user_id,
    currency,
    balance
  ) VALUES (
    new.id,
    'NGN',
    0.00
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 9. ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- =====================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('administrator', 'super_administrator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Catalog Policies
DROP POLICY IF EXISTS "Public can view approved categories" ON public.categories;
CREATE POLICY "Public can view approved categories" ON public.categories FOR SELECT USING (is_approved = true OR public.is_admin());

DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (status = 'active' OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
CREATE POLICY "Admins have full access to products" ON public.products FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to inventory" ON public.inventory_items;
CREATE POLICY "Admins have full access to inventory" ON public.inventory_items FOR ALL USING (public.is_admin());

-- Carts & Orders Policies
DROP POLICY IF EXISTS "Users can access own cart" ON public.carts;
CREATE POLICY "Users can access own cart" ON public.carts FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can access own cart items" ON public.cart_items;
CREATE POLICY "Users can access own cart items" ON public.cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.carts WHERE id = cart_id AND user_id = auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "Users can view own deliveries" ON public.deliveries;
CREATE POLICY "Users can view own deliveries" ON public.deliveries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()) OR public.is_admin()
);

-- Virtual Numbers Policies
DROP POLICY IF EXISTS "Public can view active countries" ON public.provider_countries;
CREATE POLICY "Public can view active countries" ON public.provider_countries FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Public can view active services" ON public.provider_services;
CREATE POLICY "Public can view active services" ON public.provider_services FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Users can access own number requests" ON public.number_requests;
CREATE POLICY "Users can access own number requests" ON public.number_requests FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can view own sms messages" ON public.sms_messages;
CREATE POLICY "Users can view own sms messages" ON public.sms_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.number_requests WHERE id = number_request_id AND user_id = auth.uid()) OR public.is_admin()
);

-- Wallet & Ledger Policies
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can view own ledger" ON public.wallet_ledger;
CREATE POLICY "Users can view own ledger" ON public.wallet_ledger FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins view gateway events" ON public.gateway_events;
CREATE POLICY "Admins view gateway events" ON public.gateway_events FOR SELECT USING (public.is_admin());

-- Support & Abuse Policies
DROP POLICY IF EXISTS "Users can access own tickets" ON public.support_tickets;
CREATE POLICY "Users can access own tickets" ON public.support_tickets FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can access messages for own tickets" ON public.support_messages;
CREATE POLICY "Users can access messages for own tickets" ON public.support_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "Public can insert abuse reports" ON public.abuse_reports;
CREATE POLICY "Public can insert abuse reports" ON public.abuse_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view abuse reports" ON public.abuse_reports;
CREATE POLICY "Admins can view abuse reports" ON public.abuse_reports FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- =====================================================================
-- 10. INITIAL PRODUCTION SEED DATA (CATEGORIES, COUNTRIES, SERVICES, PRODUCTS)
-- =====================================================================

-- 1. Seed Categories
INSERT INTO public.categories (id, name, slug, division, icon, description, is_approved)
VALUES 
  ('social-media', 'Social Media Accounts', 'social-media', 'A', 'Users', 'Verified aged creator accounts, business managers, and creator profiles', true),
  ('proxies', 'Proxies & Network IPs', 'proxies', 'A', 'Network', 'Clean residential, mobile LTE, and datacenter proxy packages', true),
  ('esim', 'eSIM Profiles & Data', 'esim', 'A', 'QrCode', 'Instant global travel eSIM profiles and high-speed data plans', true),
  ('vpn', 'VPN Subscriptions', 'vpn', 'A', 'Shield', 'Official vouchers & premium multi-device VPN subscriptions', true),
  ('ai-tools', 'AI Subscriptions & APIs', 'ai-tools', 'A', 'Sparkles', 'API access keys, credits & authorized productivity tool tiers', true),
  ('software', 'Software Licenses & Keys', 'software', 'A', 'KeyRound', 'Genuine OS activation keys, IDEs, and developer software', true),
  ('cloud-hosting', 'Cloud & Domain Hosting', 'cloud-hosting', 'A', 'Server', 'Cloud VPS vouchers, domain credits, and web hosting subscriptions', true),
  ('virtual-numbers', 'Virtual Phone Numbers', 'virtual-numbers', 'B', 'PhoneCall', 'Authorized verification SMS and long-term phone rentals', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 2. Seed Provider Countries (Division B)
INSERT INTO public.provider_countries (code, name, dial_code, flag, available_numbers, is_active)
VALUES
  ('US', 'United States', '+1', '🇺🇸', 4210, true),
  ('GB', 'United Kingdom', '+44', '🇬🇧', 1850, true),
  ('NG', 'Nigeria', '+234', '🇳🇬', 940, true),
  ('CA', 'Canada', '+1', '🇨🇦', 1120, true),
  ('DE', 'Germany', '+49', '🇩🇪', 860, true),
  ('FR', 'France', '+33', '🇫🇷', 730, true),
  ('NL', 'Netherlands', '+31', '🇳🇱', 540, true)
ON CONFLICT (code) DO UPDATE SET
  available_numbers = EXCLUDED.available_numbers;

-- 3. Seed Provider Services (Division B)
INSERT INTO public.provider_services (id, name, category, price_ngn, success_rate, is_popular, is_active)
VALUES
  ('whatsapp', 'WhatsApp Business / Messenger', 'Messaging', 1450.00, 98.4, true, true),
  ('telegram', 'Telegram Messenger', 'Messaging', 1200.00, 99.1, true, true),
  ('google', 'Google / Gmail Workspace', 'Email & Cloud', 1100.00, 97.5, true, true),
  ('openai', 'OpenAI / ChatGPT Verification', 'AI Tools', 1650.00, 96.8, true, true),
  ('claude', 'Anthropic Claude AI', 'AI Tools', 1750.00, 95.2, false, true),
  ('microsoft', 'Microsoft / Outlook / Azure', 'Cloud', 980.00, 98.0, false, true),
  ('apple', 'Apple ID / iCloud', 'Identity', 2100.00, 94.6, false, true),
  ('discord', 'Discord Community Verification', 'Social', 850.00, 99.3, false, true),
  ('twitter', 'X / Twitter Verification', 'Social', 1350.00, 96.0, false, true)
ON CONFLICT (id) DO UPDATE SET
  price_ngn = EXCLUDED.price_ngn,
  success_rate = EXCLUDED.success_rate;

-- 4. Seed SMS Providers
INSERT INTO public.sms_providers (id, name, adapter_type, base_url, is_active, priority_rank, balance_cached)
VALUES
  ('provider_sim_primary', 'SimGlobal Primary Telephony Hub', 'mock', 'https://api.simglobal.mock/v1', true, 1, 84500.00),
  ('provider_sim_secondary', 'TelcoDirect Secondary Fallover', 'mock', 'https://api.telcodirect.mock/v1', true, 2, 52000.00)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Canonical Multi-Server Products (Server 1 to Server 4)
INSERT INTO public.products (
  id, slug, title, category_id, division, server_cluster, price_ngn, in_stock, stock_count, rating,
  verified_resale, cover_image, summary, description_html, delivery_format, validity_duration, region, delivery_type, status
) VALUES
  (
    'prod_esim_01', 'global-travel-esim-10gb-5g',
    'Global Travel eSIM 10GB High-Speed 5G/4G Data Profile (140+ Countries)',
    'esim', 'A', 'Server 1', 16500.00, true, 74, 5.0, true,
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    'Instant QR code activation for seamless roaming across 140+ countries. Zero roaming bill shock.',
    'High-speed local breakout connectivity. Works with all unlocked eSIM-compatible devices.',
    'Instant QR Code & SM-DP+ Address', '30 Days', 'Global', 'instant_automated', 'active'
  ),
  (
    'prod_proxy_01', 'premium-residential-rotating-proxies-5gb',
    'Premium Residential Rotating Proxies (5GB High-Speed Bandwidth)',
    'proxies', 'A', 'Server 1', 18500.00, true, 95, 4.9, true,
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    '99.9% uptime real residential IP pool. HTTP and SOCKS5 endpoints with sticky session support.',
    'Clean IP pool across US, UK, Germany, and Nigeria. Ideal for web scraping, ad verification, and automation.',
    'API Host:Port:User:Pass Access', '30 Days', 'Global', 'instant_automated', 'active'
  ),
  (
    'prod_vpn_01', 'nordvpn-complete-1year-license',
    'NordVPN Complete 1-Year Premium License Key',
    'vpn', 'A', 'Server 1', 18500.00, true, 42, 5.0, true,
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    'Official redemption voucher code for 12 months unlimited VPN, Threat Protection & NordPass password manager.',
    'Enjoy high-speed encrypted connectivity across up to 10 simultaneous devices.',
    'Alphanumeric Redemption Voucher', '12 Months', 'Global', 'instant_automated', 'active'
  ),
  (
    'prod_social_01', 'instagram-aged-verified-profile-2fa',
    'Instagram Aged Creator Profile (2019-2022 Established with 2FA)',
    'social-media', 'A', 'Server 2', 14500.00, true, 140, 5.0, true,
    'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80',
    'Aged account with high trust score, verified email linkage, full cookies and 2FA secret key.',
    'High-reputation profile configured for business outreach, marketing, and creators.',
    'Encrypted Vault Credentials & 2FA Key', 'Lifetime', 'Global', 'instant_automated', 'active'
  ),
  (
    'prod_social_02', 'facebook-agency-business-manager-unlimited',
    'Facebook Agency Business Manager (BM50 / Unlimited Daily Spend Limit)',
    'social-media', 'A', 'Server 2', 22000.00, true, 85, 4.9, true,
    'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?auto=format&fit=crop&w=600&q=80',
    'High-limit advertising container ready for immediate campaigns with zero initial spend restrictions.',
    'Includes invitation link, admin handover guidelines, and high-trust status for smooth ad approval.',
    'Secure Admin Handover Link', 'Permanent', 'Global', 'instant_automated', 'active'
  ),
  (
    'prod_soft_01', 'windows-11-pro-retail-license',
    'Microsoft Windows 11 Pro Genuine Retail Digital License Key',
    'software', 'A', 'Server 3', 8500.00, true, 120, 5.0, true,
    'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=600&q=80',
    'Lifetime binding 25-character digital product key for 1 PC with BitLocker and remote desktop support.',
    'Activates online through official Microsoft servers. Supports multi-language and clean re-installations.',
    '25-Digit Retail License Key', 'Lifetime', 'Global', 'instant_automated', 'active'
  ),
  (
    'prod_ai_01', 'chatgpt-plus-official-subscription-voucher',
    'OpenAI ChatGPT Plus 1-Month Official Subscription Voucher',
    'ai-tools', 'A', 'Server 4', 31500.00, true, 65, 5.0, true,
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
    'Redeemable code granting 30 days of GPT-4o, Canvas, advanced voice mode, and DALL-E 3 image generation.',
    'Apply voucher code directly to your personal OpenAI account. Zero credentials exchanged.',
    'Official Gift / Voucher Code', '1 Month', 'Global', 'instant_automated', 'active'
  ),
  (
    'prod_ai_02', 'claude-pro-anthropic-voucher',
    'Anthropic Claude Pro 1-Month Access Pass Voucher',
    'ai-tools', 'A', 'Server 4', 31000.00, true, 40, 4.9, true,
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80',
    'Priority access to Claude 3.5 Sonnet, 5x more usage allowance, and early access to Artifacts.',
    'Redeem code applied directly on claude.ai. No account sharing; user connects their own verified email.',
    'Prepaid Digital Voucher', '1 Month', 'Global', 'instant_automated', 'active'
  )
ON CONFLICT (id) DO UPDATE SET
  price_ngn = EXCLUDED.price_ngn,
  stock_count = EXCLUDED.stock_count,
  in_stock = EXCLUDED.in_stock;

-- =====================================================================
-- SCHEMA INITIALIZATION COMPLETE
-- Ojalogs is 100% operational and ready.
-- =====================================================================
