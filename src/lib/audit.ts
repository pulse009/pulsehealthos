import 'server-only';
import { prisma, type DbClient } from '@/lib/db/prisma';
import { redact, logger } from '@/lib/logger';
import { actorUserId, type TenantScope } from '@/lib/tenancy/scope';

/**
 * Append-only audit trail for anything a human changed or a privileged action
 * the system took on their behalf. Distinct from SystemLog: audit answers "who
 * did what to which record", SystemLog answers "what happened in the process".
 */

export interface AuditInput {
  action: string;
  entityType: string;
  entityId?: string | null;
  clinicId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  actorLabel?: string | null;
}

export async function recordAudit(
  scope: TenantScope,
  input: AuditInput,
  db: DbClient = prisma,
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        clinicId: input.clinicId ?? (scope.kind === 'PLATFORM' ? null : scope.clinicId),
        actorUserId: actorUserId(scope),
        actorLabel:
          input.actorLabel ?? (scope.kind === 'SYSTEM' ? `system:${scope.reason}` : null),
        metadata: input.metadata ? (redact(input.metadata) as object) : undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent?.slice(0, 500) ?? null,
      },
    });
  } catch (error) {
    // An audit write must never break the operation it is describing, but a
    // silent loss is unacceptable — surface it loudly instead.
    logger.error('audit.write_failed', 'Failed to write audit log entry', {
      action: input.action,
      entityType: input.entityType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Shallow field-level diff, for readable "what changed" audit metadata. */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const [key, next] of Object.entries(after)) {
    const prev = before[key];
    if (next === undefined) continue;
    const changed =
      prev instanceof Date && next instanceof Date
        ? prev.getTime() !== next.getTime()
        : JSON.stringify(prev) !== JSON.stringify(next);
    if (changed) changes[key] = { from: prev, to: next };
  }
  return changes;
}
