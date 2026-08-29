import 'server-only';
import { z } from 'zod';

/**
 * Server-side environment contract.
 *
 * Importing this module from a Client Component is a build error (`server-only`),
 * which is the mechanism that keeps secrets out of the browser bundle.
 */

const booleanish = z
  .string()
  .optional()
  .transform((v) => v === '1' || v?.toLowerCase() === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  TEST_DATABASE_URL: z.string().optional(),

  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  ENCRYPTION_KEY: z
    .string()
    .min(1, 'ENCRYPTION_KEY is required')
    .refine(
      (v) => {
        try {
          return Buffer.from(v, 'base64').length === 32;
        } catch {
          return false;
        }
      },
      'ENCRYPTION_KEY must be a base64-encoded 32-byte key (openssl rand -base64 32)',
    ),
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(28_800),
  OPENROUTER_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('google/gemma-4-26b-a4b-it:free'),
  GEMINI_API_BASE_URL: z.string().url().default('https://generativelanguage.googleapis.com/v1beta'),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),

  WHATSAPP_API_BASE_URL: z.string().url().default('https://graph.facebook.com/v21.0'),
  WHATSAPP_VERIFY_TOKEN: z.string().optional().default(''),
  WHATSAPP_APP_SECRET: z.string().optional().default(''),
  WHATSAPP_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),

  RATE_LIMIT_REDIS_URL: z.string().optional().default(''),
  SKIP_ENV_VALIDATION: booleanish,
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  // Escape hatch so `next build` can run in image-build stages that legitimately
  // have no secrets. Never set this at runtime.
  if (process.env.SKIP_ENV_VALIDATION === '1' || process.env.SKIP_ENV_VALIDATION === 'true') {
    return envSchema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://build:build@localhost:5432/build',
      AUTH_SECRET: process.env.AUTH_SECRET ?? 'build-time-placeholder-secret-000000000000',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ?? Buffer.alloc(32).toString('base64'),
      CRON_SECRET: process.env.CRON_SECRET ?? 'build-time-placeholder',
    });
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Print variable names and messages only — never the offending values.
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

let cached: Env | null = null;

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    cached ??= loadEnv();
    return cached[prop as keyof Env];
  },
});

export const isProduction = () => env.NODE_ENV === 'production';
export const isTest = () => env.NODE_ENV === 'test';
