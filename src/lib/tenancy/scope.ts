import { forbidden, badRequest } from '@/lib/errors';

/**
 * Tenant isolation.
 *
 * Every service function that touches tenant-owned data takes a `TenantScope` as
 * its first argument. Services never read the session directly, and never accept
 * a bare `clinicId` from a caller without running it through `resolveClinicId`.
 * That makes the check impossible to forget: you cannot call the function at all
 * without producing a scope, and the only way to produce one is via the guards
 * in `@/lib/auth/guards`, which derive it from a verified session.
 *
 * Frontend route protection is a convenience, not a control. This is the control.
 */

export type TenantScope =
  /** SUPER_ADMIN: may act across every clinic. */
  | { readonly kind: 'PLATFORM'; readonly actorUserId: string }
  /** CLIENT: hard-bound to exactly one clinic. */
  | { readonly kind: 'CLINIC'; readonly clinicId: string; readonly actorUserId: string }
  /**
   * Non-interactive execution (WhatsApp webhook, AI agent, reminder cron).
   * There is no human actor, but the scope is still pinned to a single clinic.
   */
  | { readonly kind: 'SYSTEM'; readonly clinicId: string; readonly reason: string };

export const platformScope = (actorUserId: string): TenantScope => ({
  kind: 'PLATFORM',
  actorUserId,
});

export const clinicScope = (clinicId: string, actorUserId: string): TenantScope => ({
  kind: 'CLINIC',
  clinicId,
  actorUserId,
});

export const systemScope = (clinicId: string, reason: string): TenantScope => ({
  kind: 'SYSTEM',
  clinicId,
  reason,
});

export const isPlatformScope = (scope: TenantScope): boolean => scope.kind === 'PLATFORM';

/** The clinic a scope is pinned to, or null for platform-wide scopes. */
export function scopedClinicId(scope: TenantScope): string | null {
  return scope.kind === 'PLATFORM' ? null : scope.clinicId;
}

export function actorUserId(scope: TenantScope): string | null {
  return scope.kind === 'SYSTEM' ? null : scope.actorUserId;
}

/**
 * Resolve the clinic a request is *allowed* to operate on.
 *
 * - A tenant-bound scope may only ever resolve to its own clinic. Asking for a
 *   different one is a 403, not a silent narrowing — silent narrowing would hide
 *   authorization bugs and IDOR probes.
 * - A platform scope must name a clinic explicitly; defaulting would make it too
 *   easy to write a query that accidentally spans tenants.
 */
export function resolveClinicId(scope: TenantScope, requestedClinicId?: string | null): string {
  if (scope.kind === 'PLATFORM') {
    if (!requestedClinicId) {
      throw badRequest('A clinic must be specified for this operation.');
    }
    return requestedClinicId;
  }

  if (requestedClinicId && requestedClinicId !== scope.clinicId) {
    throw forbidden('You do not have access to this clinic.');
  }
  return scope.clinicId;
}

/**
 * A Prisma `where` fragment that constrains a query to the scope's tenant.
 *
 * For a platform scope with no requested clinic this returns `{}` — a
 * deliberately cross-tenant query, only reachable by SUPER_ADMIN, used for
 * platform-wide dashboards.
 */
export function clinicWhere(
  scope: TenantScope,
  requestedClinicId?: string | null,
): { clinicId?: string } {
  if (scope.kind === 'PLATFORM') {
    return requestedClinicId ? { clinicId: requestedClinicId } : {};
  }
  if (requestedClinicId && requestedClinicId !== scope.clinicId) {
    throw forbidden('You do not have access to this clinic.');
  }
  return { clinicId: scope.clinicId };
}

/**
 * Post-read ownership assertion for rows fetched by primary key.
 *
 * Fetch-by-id then assert is preferable to encoding the tenant into the `where`
 * clause alone, because it distinguishes "does not exist" from "exists but is
 * not yours" internally while returning an indistinguishable 404 to the caller.
 */
export function assertOwned(
  scope: TenantScope,
  row: { clinicId: string | null } | null | undefined,
  entityLabel = 'Resource',
): void {
  if (!row) throw forbidden(`${entityLabel} not found.`);
  if (scope.kind === 'PLATFORM') return;
  if (row.clinicId !== scope.clinicId) {
    // Same message and status as "not found": never confirm the existence of
    // another tenant's row.
    throw forbidden(`${entityLabel} not found.`);
  }
}

/** Guard for operations that only SUPER_ADMIN may perform. */
export function assertPlatformScope(scope: TenantScope, action = 'perform this action'): void {
  if (scope.kind !== 'PLATFORM') {
    throw forbidden(`You are not permitted to ${action}.`);
  }
}
