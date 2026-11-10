import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),
  SUPABASE_URL: z.string().default('https://vbhvorgjeivvvjktspee.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiaHZvcmdqZWl2dnZqa3RzcGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MDQ4ODYsImV4cCI6MjEwOTM4MDg4Nn0.qexsyw5N3lPbU4jlXXkwBkVVzDthifHWjaWwsiOcwCE'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiaHZvcmdqZWl2dnZqa3RzcGVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzgwNDg4NiwiZXhwIjoyMTA5MzgwODg2fQ.D-HbBiuX5ZD7XeVgRXnVrq6TbhGQ6qE2YoojBEdKZqI'),
  SERVER_ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  BACHS_API_KEY: z.string().default('sk_sandbox_1e154c00_0BVnqwslBHTZ0amGc9VsYFKVyZC2_Vx43TiwFGe6CHg'),
  BACHS_WEBHOOK_SECRET: z.string().default('whsec_sandbox_ojalogs_secret_2026'),
  BACHS_BASE_URL: z.string().default('https://api.bachs.io/v1'),
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().default('noreply@ojalogs.com.ng'),
  ADMIN_ALERT_EMAIL: z.string().default('ojalogs@gmail.com'),
  LINKOCIAL_API_KEY: z.string().default('linkocial_live_token_default'),
  LINKOCIAL_BASE_URL: z.string().default('https://linkocial.com/api/v1'),
  TEXTPLUG_API_KEY: z.string().optional().default(''),
  TEXTPLUG_BASE_URL: z.string().default('https://merchant.textplug.net'),
  TEXTPLUG_WEBHOOK_SECRET: z.string().default('whsec_textplug_ojalogs'),
  LOGSPOLL_API_KEY: z.string().optional().default(''),
  LOGSPOLL_BASE_URL: z.string().default('https://logspoll.com/api/v1')
});

export const env = EnvSchema.parse(process.env);

