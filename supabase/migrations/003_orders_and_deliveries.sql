-- =====================================================================
-- 003_ORDERS_AND_DELIVERIES.SQL
-- Carts, Orders, Order Items, and Customer Deliveries Vault
-- =====================================================================

CREATE TYPE order_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'cancelled'
);

CREATE TYPE payment_method AS ENUM (
  'wallet',
  'bach_direct'
);

-- Carts Table
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cart Items Table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_ngn NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, product_id)
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) NOT NULL UNIQUE, -- ord_oj_...
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

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_ngn NUMERIC(12, 2) NOT NULL,
  total_ngn NUMERIC(14, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deliveries (Customer Vault)
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  encrypted_secret TEXT NOT NULL, -- AES-256 encrypted payload
  instructions TEXT NOT NULL,
  reveal_count INTEGER NOT NULL DEFAULT 0,
  first_revealed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliv_order ON public.deliveries(order_id);

