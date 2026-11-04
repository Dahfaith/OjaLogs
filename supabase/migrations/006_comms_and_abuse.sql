-- =====================================================================
-- 006_COMMS_AND_ABUSE.SQL
-- Support Tickets, Messages, Abuse Reports, and Notifications
-- =====================================================================

CREATE TYPE ticket_category AS ENUM (
  'order_issue',
  'number_issue',
  'wallet_payment',
  'general'
);

CREATE TYPE ticket_status AS ENUM (
  'open',
  'in_progress',
  'resolved',
  'closed'
);

CREATE TYPE abuse_category AS ENUM (
  'fraud',
  'spam',
  'unauthorized_access',
  'policy_violation'
);

CREATE TYPE abuse_status AS ENUM (
  'investigating',
  'actioned',
  'dismissed'
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(30) NOT NULL UNIQUE, -- TCK-9921
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category ticket_category NOT NULL DEFAULT 'order_issue',
  subject VARCHAR(200) NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Support Messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  is_staff_reply BOOLEAN NOT NULL DEFAULT false,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Abuse Reports (Acceptable Use Policy Guardrail)
CREATE TABLE IF NOT EXISTS public.abuse_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_email VARCHAR(255) NOT NULL,
  reporter_ip VARCHAR(45),
  violation_category abuse_category NOT NULL,
  target_identifier VARCHAR(150) NOT NULL, -- Phone number, SKU, or user ID
  details TEXT NOT NULL,
  status abuse_status NOT NULL DEFAULT 'investigating',
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abuse_status ON public.abuse_reports(status);

-- Notifications
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

