import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Integration tests hit a shared database; run files sequentially so
    // concurrency assertions are not polluted by unrelated parallel writes.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
      // The real `server-only` package throws on import under plain Node — its
      // whole job is to fail outside a React Server Component. Tests run server
      // modules directly, so it is stubbed out here. This does not weaken the
      // guarantee in the app: Next.js still resolves the real package and still
      // fails the build if a Client Component imports server code.
      'server-only': path.resolve(process.cwd(), 'tests/stubs/server-only.ts'),
    },
  },
});
