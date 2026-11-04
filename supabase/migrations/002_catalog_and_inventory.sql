-- =====================================================================
-- 002_CATALOG_AND_INVENTORY.SQL
-- Categories, Products, Inventory Items (Encrypted Vault), and Suppliers
-- =====================================================================

CREATE TYPE product_status AS ENUM ('active', 'draft', 'archived', 'force_disabled');
CREATE TYPE delivery_type AS ENUM ('instant_automated', 'manual');
CREATE TYPE inventory_status AS ENUM ('available', 'reserved', 'sold', 'revoked');

-- Categories Table
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

-- Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  server_tier VARCHAR(50) NOT NULL, -- e.g. Server 1, Server 2, Server 3, Server 4
  api_endpoint TEXT,
  encrypted_credentials TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products Table
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

-- Inventory Items (Encrypted Secret Vault)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id VARCHAR(100) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id),
  encrypted_payload TEXT NOT NULL, -- AES-256-GCM ciphertext
  hash_fingerprint VARCHAR(64) NOT NULL UNIQUE, -- SHA256 of plaintext to avoid duplicates
  status inventory_status NOT NULL DEFAULT 'available',
  reserved_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_product ON public.inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_status ON public.inventory_items(status);

-- Favourites Table
CREATE TABLE IF NOT EXISTS public.favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

