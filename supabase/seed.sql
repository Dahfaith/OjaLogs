-- =====================================================================
-- SEED.SQL
-- Initial Seed Data for Categories, Countries, Services, and Suppliers
-- =====================================================================

-- Seed Approved Categories
INSERT INTO public.categories (id, name, slug, division, icon, description, is_approved)
VALUES 
  ('social-media', 'Social Media Accounts', 'social-media', 'A', 'Users', 'Verified aged creator accounts, business managers, and profiles', true),
  ('proxies', 'Proxies & Network IPs', 'proxies', 'A', 'Network', 'Rotating residential, mobile LTE, and datacenter proxy packages', true),
  ('esim', 'eSIM Profiles & Data', 'esim', 'A', 'QrCode', 'Global travel eSIM profiles and high-speed data plans', true),
  ('vpn', 'VPN Subscriptions', 'vpn', 'A', 'Shield', 'Official vouchers & premium multi-device VPN subscriptions', true),
  ('ai-tools', 'AI Subscriptions & APIs', 'ai-tools', 'A', 'Sparkles', 'API access keys, credits & authorized productivity tool tiers', true),
  ('software', 'Software Licenses & Keys', 'software', 'A', 'KeyRound', 'Genuine OS activation keys, IDEs, and developer software', true),
  ('cloud-hosting', 'Cloud & Domain Hosting', 'cloud-hosting', 'A', 'Server', 'Cloud VPS vouchers, domain credits, and web hosting subscriptions', true),
  ('virtual-numbers', 'Virtual Phone Numbers', 'virtual-numbers', 'B', 'PhoneCall', 'Authorized verification SMS and long-term phone rentals', true)
ON CONFLICT (id) DO NOTHING;

-- Seed Provider Countries
INSERT INTO public.provider_countries (code, name, dial_code, flag, available_numbers, is_active)
VALUES
  ('US', 'United States', '+1', '🇺🇸', 4210, true),
  ('GB', 'United Kingdom', '+44', '🇬🇧', 1850, true),
  ('NG', 'Nigeria', '+234', '🇳🇬', 940, true),
  ('CA', 'Canada', '+1', '🇨🇦', 1120, true),
  ('DE', 'Germany', '+49', '🇩🇪', 860, true),
  ('FR', 'France', '+33', '🇫🇷', 730, true),
  ('NL', 'Netherlands', '+31', '🇳🇱', 540, true)
ON CONFLICT (code) DO NOTHING;

-- Seed Provider Services
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
ON CONFLICT (id) DO NOTHING;

-- Seed SMS Providers
INSERT INTO public.sms_providers (id, name, adapter_type, base_url, is_active, priority_rank, balance_cached)
VALUES
  ('provider_sim_primary', 'SimGlobal Primary Telephony Hub', 'mock', 'https://api.simglobal.mock/v1', true, 1, 84500.00),
  ('provider_sim_secondary', 'TelcoDirect Secondary Fallover', 'mock', 'https://api.telcodirect.mock/v1', true, 2, 52000.00)
ON CONFLICT (id) DO NOTHING;

