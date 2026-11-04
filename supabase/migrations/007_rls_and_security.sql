-- =====================================================================
-- 007_RLS_AND_SECURITY.SQL
-- Comprehensive Row Level Security (RLS) On Every Table
-- =====================================================================

-- Helper function: Is caller an Administrator or Super Administrator?
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

-- Enable RLS On All Tables
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

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Catalog Policies
CREATE POLICY "Public can view approved categories" ON public.categories
  FOR SELECT USING (is_approved = true OR public.is_admin());

CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (status = 'active' OR public.is_admin());

CREATE POLICY "Admins have full access to products" ON public.products
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins have full access to inventory" ON public.inventory_items
  FOR ALL USING (public.is_admin());

-- 3. Carts & Orders Policies
CREATE POLICY "Users can access own cart" ON public.carts
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can access own cart items" ON public.cart_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.carts WHERE id = cart_id AND user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Users can view own deliveries" ON public.deliveries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
    OR public.is_admin()
  );

-- 4. Virtual Numbers Policies
CREATE POLICY "Public can view active countries" ON public.provider_countries
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Public can view active services" ON public.provider_services
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Users can access own number requests" ON public.number_requests
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can view own sms messages" ON public.sms_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.number_requests WHERE id = number_request_id AND user_id = auth.uid())
    OR public.is_admin()
  );

-- 5. Wallet & Ledger Policies
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can view own ledger" ON public.wallet_ledger
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins view gateway events" ON public.gateway_events
  FOR SELECT USING (public.is_admin());

-- 6. Support & Abuse Policies
CREATE POLICY "Users can access own tickets" ON public.support_tickets
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can access messages for own tickets" ON public.support_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Public can insert abuse reports" ON public.abuse_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view abuse reports" ON public.abuse_reports
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

