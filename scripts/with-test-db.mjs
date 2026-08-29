#!/usr/bin/env node
/**
 * Spin up a throwaway PostgreSQL instance, apply the migrations, run a command
 * against it, and tear it down.
 *
 * This exists so the booking integration tests — the ones that prove double
 * booking is impossible — can run on a machine with no PostgreSQL installed.
 * The guarantee under test is a database guarantee (a gist exclusion
 * constraint), so it cannot be demonstrated against a mock.
 *
 * Usage:
 *   node scripts/with-test-db.mjs npx vitest run
 */
import EmbeddedPostgres from 'embedded-postgres';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = Number(process.env.TEST_PG_PORT ?? 54329);
const USER = 'postgres';
const PASSWORD = 'postgres';
const DATABASE = 'clinic_ai_test';

function run(command, args, env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'inherit', env: { ...process.env, ...env } });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

const dataDir = await mkdtemp(join(tmpdir(), 'clinic-pg-'));
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: false,
});

let exitCode = 1;
try {
  console.log('› initialising temporary PostgreSQL…');
  await pg.initialise();
  await pg.start();
  await pg.createDatabase(DATABASE);

  const url = `postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE}`;
  console.log(`› database ready on port ${PORT}`);

  console.log('› applying migrations…');
  const migrated = await run('npx', ['prisma', 'migrate', 'deploy'], { DATABASE_URL: url });
  if (migrated !== 0) {
    console.error('✗ migrations failed');
    process.exit(migrated);
  }

  const [command, ...args] = process.argv.slice(2);
  if (!command) {
    console.error('Usage: node scripts/with-test-db.mjs <command> [...args]');
    process.exit(2);
  }

  console.log(`› running: ${command} ${args.join(' ')}\n`);
  exitCode = await run(command, args, { DATABASE_URL: url, TEST_DATABASE_URL: url });
} finally {
  console.log('\n› shutting down temporary PostgreSQL…');
  await pg.stop().catch(() => undefined);
  await rm(dataDir, { recursive: true, force: true }).catch(() => undefined);
}

process.exit(exitCode);
