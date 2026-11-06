import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),
  SUPABASE_URL: z.string().default('https://mock-project.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('mock-anon-key-ojalogs-development-only'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('mock-service-role-key-ojalogs-development-only'),
  SERVER_ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  BACHS_API_KEY: z.string().default('sk_sandbox_1e154c00_0BVnqwslBHTZ0amGc9VsYFKVyZC2_Vx43TiwFGe6CHg'),
  BACHS_WEBHOOK_SECRET: z.string().default('whsec_sandbox_ojalogs_secret_2026'),
  BACHS_BASE_URL: z.string().default('https://sandbox-api.bachs.io/v1'),
  ADMIN_ALERT_EMAIL: z.string().default('ojalogs@gmail.com')
});

export const env = EnvSchema.parse(process.env);

