import { config } from 'dotenv';
import { randomBytes } from 'node:crypto';

/**
 * Test bootstrap.
 *
 * Loads .env for local runs, then fills in anything still missing with
 * throwaway values so pure-logic tests can import modules that read `env`
 * without requiring a configured machine.
 */
config({ path: '.env', quiet: true });

// `NODE_ENV` is declared readonly on ProcessEnv, so widen the type to set it.
const mutableEnv = process.env as Record<string, string | undefined>;
mutableEnv.NODE_ENV ||= 'test';

process.env.APP_URL ??= 'http://localhost:3000';
process.env.AUTH_SECRET ||= randomBytes(32).toString('hex');
process.env.ENCRYPTION_KEY ||= randomBytes(32).toString('base64');
process.env.CRON_SECRET ||= randomBytes(16).toString('hex');
process.env.DATABASE_URL ||= 'postgresql://unused:unused@localhost:5432/unused';

// Integration tests point Prisma at a dedicated database. When TEST_DATABASE_URL
// is unset those suites skip themselves rather than corrupting a real one.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
