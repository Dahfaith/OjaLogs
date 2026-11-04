-- =====================================================================
-- 001_IDENTITY_AND_RBAC.SQL
-- Ojalogs Platform Identity, User Profiles, Roles, and Permissions
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role Enum
CREATE TYPE app_role AS ENUM (
  'guest',
  'customer',
  'support_agent',
  'administrator',
  'super_administrator',
  'seller'
);

-- Profiles Table (Extends Supabase auth.users)
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

-- Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Role-Permissions Mapping
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role app_role NOT NULL,
  permission_slug VARCHAR(100) NOT NULL REFERENCES public.permissions(slug) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_slug)
);

-- User Sessions Tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip_address VARCHAR(45),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Audit Logs (Immutable)
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

