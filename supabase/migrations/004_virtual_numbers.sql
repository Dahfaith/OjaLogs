-- =====================================================================
-- 004_VIRTUAL_NUMBERS.SQL
-- Division B: SMS Providers, Countries, Services, and Virtual Lines
-- =====================================================================

CREATE TYPE number_session_status AS ENUM (
  'requesting',
  'active',
  'sms_received',
  'expired',
  'cancelled',
  'refunded'
);

CREATE TYPE rental_type AS ENUM (
  'one_time_sms',
  'long_term_rental'
);

-- SMS Providers Table
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

-- Countries Table
CREATE TABLE IF NOT EXISTS public.provider_countries (
  code VARCHAR(5) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  dial_code VARCHAR(10) NOT NULL,
  flag VARCHAR(10) NOT NULL,
  available_numbers INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Services Table
CREATE TABLE IF NOT EXISTS public.provider_services (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price_ngn NUMERIC(10, 2) NOT NULL,
  success_rate NUMERIC(4, 1) NOT NULL DEFAULT 98.0,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Number Requests (Allocated Sessions)
CREATE TABLE IF NOT EXISTS public.number_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) NOT NULL UNIQUE, -- req_num_...
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id VARCHAR(50) REFERENCES public.sms_providers(id),
  country_code VARCHAR(5) NOT NULL REFERENCES public.provider_countries(code),
  service_id VARCHAR(50) NOT NULL REFERENCES public.provider_services(id),
  phone_number VARCHAR(35) NOT NULL,
  rental_type rental_type NOT NULL DEFAULT 'one_time_sms',
  status number_session_status NOT NULL DEFAULT 'active',
  price_ngn NUMERIC(10, 2) NOT NULL,
  time_remaining_seconds INTEGER NOT NULL DEFAULT 900, -- 15 mins
  expires_at TIMESTAMPTZ NOT NULL,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_num_req_user ON public.number_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_num_req_status ON public.number_requests(status);

-- Incoming SMS Messages
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

