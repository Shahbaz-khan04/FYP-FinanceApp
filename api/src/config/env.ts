import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const currentDir = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(currentDir, '..', '..');
const workspaceRoot = resolve(apiRoot, '..');

loadEnv({ path: resolve(workspaceRoot, '.env') });
loadEnv({ path: resolve(apiRoot, '.env'), override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(16).default('dev-only-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  RECURRING_JOB_TOKEN: z.string().optional(),
  OCR_SPACE_API_KEY: z.string().optional(),
  OCR_SPACE_API_URL: z.string().url().default('https://api.ocr.space/parse/image'),
  EXCHANGE_RATE_API_KEY: z.string().optional(),
  EXCHANGE_RATE_API_BASE_URL: z.string().url().default('https://v6.exchangerate-api.com/v6'),
});

export const env = envSchema.parse(process.env);
