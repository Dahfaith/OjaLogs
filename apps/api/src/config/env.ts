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
  BACHS_API_KEY: z.string().default('sk_live_8023c25e_M1f-1Y5wca1v69aGbZGKTiunGDo4_MEl4e-34g5CDmE'),
  BACHS_WEBHOOK_SECRET: z.string().default('whsec_bb7ceb24462c1308b90bfba04c1d624c9c4d87165247540c043a4d246df5c716'),
  BACHS_BASE_URL: z.string().default('https://api.bachs.io/v1'),
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().default('noreply@ojalogs.com.ng'),
  ADMIN_ALERT_EMAIL: z.string().default('ojalogs@gmail.com'),
  LINKOCIAL_API_KEY: z.string().default('8pydsuH2oVPiQ2Lqq0rkA9cmczHbTZKjjXnWLhXD'),
  LINKOCIAL_BASE_URL: z.string().default('https://linkocial.com/api/v1'),
  TEXTPLUG_API_KEY: z.string().default('tp_8c6e8ab0a682c44c3148c3a7055007c658717577f88ebb67bbc486b6dc00b75e'),
  TEXTPLUG_BASE_URL: z.string().default('https://merchant.textplug.net'),
  TEXTPLUG_WEBHOOK_SECRET: z.string().default('whsec_textplug_ojalogs'),
  LOGSPOLL_API_KEY: z.string().default('lp_live_37f040ba58a25c1178bf850aba5d9b49a11cf47b3e911c6b'),
  LOGSPOLL_BASE_URL: z.string().default('https://logspoll.com/api/v1')
});

export const env = EnvSchema.parse(process.env);

