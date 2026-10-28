import 'dotenv/config';
import { z } from 'zod';

const boolFromString = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  FRONTEND_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string().min(1),

  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),

  MIDTRANS_SERVER_KEY: z.string().min(1),
  MIDTRANS_CLIENT_KEY: z.string().min(1),
  MIDTRANS_IS_PRODUCTION: boolFromString.default('false'),
  MIDTRANS_NOTIFICATION_URL: z.string().url(),

  MIN_TOPUP_AMOUNT: z.coerce.number().int().positive().default(10_000),
  MAX_TOPUP_AMOUNT: z.coerce.number().int().positive().default(1_000_000),
  DEFAULT_CURRENCY: z.string().length(3).default('IDR'),
});

export type AppEnv = z.infer<typeof schema>;

function loadEnv(): AppEnv {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Jangan dump nilai mentah (bisa berisi secret). Hanya daftar field yang salah.
    const fields = Object.keys(parsed.error.flatten().fieldErrors);
    // eslint-disable-next-line no-console
    console.error(`[startup] Invalid env vars: ${fields.join(', ')}`);
    process.exit(1);
  }
  if (parsed.data.MIN_TOPUP_AMOUNT > parsed.data.MAX_TOPUP_AMOUNT) {
    // eslint-disable-next-line no-console
    console.error('[startup] MIN_TOPUP_AMOUNT > MAX_TOPUP_AMOUNT');
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();

export const allowedOrigins = env.ALLOWED_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Handle newline escape di env var Railway / .env
export const firebasePrivateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
