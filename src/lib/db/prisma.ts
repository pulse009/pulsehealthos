import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Singleton Prisma client. Next.js dev-mode hot reloading re-evaluates modules,
 * so without the global cache each edit would leak a new connection pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [{ emit: 'stdout', level: 'warn' }, { emit: 'stdout', level: 'error' }]
        : [{ emit: 'stdout', level: 'error' }],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/** Anything usable as a Prisma executor — the client itself or a transaction handle. */
export type DbClient = PrismaClient | Prisma.TransactionClient;

// --- PostgreSQL error classification -------------------------------------
// Prisma surfaces native Postgres errors as P2010 (raw query) or as typed
// errors (P2002 unique). Constraint-driven booking needs to distinguish
// "someone beat me to this slot" from a genuine fault.

const PG_UNIQUE_VIOLATION = '23505';
const PG_EXCLUSION_VIOLATION = '23P01';

/** Matches a five-character SQLSTATE, e.g. 23505 or 23P01. */
const SQLSTATE = /^\d{2}[0-9A-Z]{3}$/;

/**
 * Recover the PostgreSQL SQLSTATE from whatever Prisma threw.
 *
 * Prisma only maps a handful of driver errors onto its own `P####` codes and
 * `PrismaClientKnownRequestError`. Anything it does not model — notably an
 * exclusion-constraint violation (23P01), which is precisely what guards
 * against double booking — arrives as `PrismaClientUnknownRequestError` with no
 * structured code at all, and the SQLSTATE only present inside the message.
 * Parsing the message is therefore not a shortcut here; it is the only channel
 * that carries the information.
 */
function pgCodeOf(error: unknown): string | undefined {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 is Prisma's own mapping of a unique violation.
    if (error.code === 'P2002') return PG_UNIQUE_VIOLATION;
    const meta = error.meta as { code?: unknown } | undefined;
    if (typeof meta?.code === 'string' && SQLSTATE.test(meta.code)) return meta.code;
  }

  // A raw driver error (e.g. from $queryRaw) exposes `code` directly.
  const candidate = error as { code?: unknown } | null;
  if (candidate && typeof candidate.code === 'string' && SQLSTATE.test(candidate.code)) {
    return candidate.code;
  }

  const message = error instanceof Error ? error.message : '';
  const match = /code:\s*"(\d{2}[0-9A-Z]{3})"/.exec(message);
  return match?.[1];
}

/**
 * True when the database rejected a write because it would have created a
 * conflicting appointment — either an exact duplicate start (unique index) or an
 * overlapping interval (gist exclusion constraint).
 */
export function isSlotConflictError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  // Named constraints are the most reliable signal when one is present.
  if (message.includes('Appointment_no_overlap_per_doctor')) return true;
  if (message.includes('Appointment_doctor_start_active_key')) return true;

  const code = pgCodeOf(error);
  // Any exclusion violation on this schema can only come from the booking
  // constraint — it is the only one defined.
  if (code === PG_EXCLUSION_VIOLATION) return true;
  if (code !== PG_UNIQUE_VIOLATION) return false;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const target = (error.meta as { target?: unknown } | undefined)?.target;
    const fields = Array.isArray(target) ? target.map(String) : [];
    if (fields.includes('doctorId') && fields.includes('startsAt')) return true;
  }
  return false;
}

/** True when a write collided with an existing `idempotencyKey`. */
export function isIdempotencyConflictError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }
  const target = (error.meta as { target?: unknown } | undefined)?.target;
  const fields = Array.isArray(target) ? target.map(String) : [];
  return fields.includes('idempotencyKey') || String(target).includes('idempotencyKey');
}

/** True when a write collided with the ProcessedEvent (scope, key) ledger. */
export function isDuplicateEventError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }
  const target = String((error.meta as { target?: unknown } | undefined)?.target ?? '');
  return target.includes('scope') || target.includes('ProcessedEvent');
}

export { Prisma };
