import 'server-only';
import { forbidden } from '@/lib/errors';
import { requireSessionUser, getSessionUser, type SessionUser } from '@/lib/auth/session';
import { platformScope, clinicScope, type TenantScope } from '@/lib/tenancy/scope';

/**
 * The bridge from "who is logged in" to "what may this request touch".
 *
 * These are the only sanctioned producers of a `TenantScope` for interactive
 * traffic; the non-interactive counterpart is `systemScope`, which is created
 * exclusively by the webhook, agent and cron entry points after they have
 * identified a clinic by other means.
 */

export async function requireSuperAdmin(): Promise<{ user: SessionUser; scope: TenantScope }> {
  const user = await requireSessionUser();
  if (user.role !== 'SUPER_ADMIN') {
    throw forbidden('This area is restricted to platform administrators.');
  }
  return { user, scope: platformScope(user.id) };
}

/** Any authenticated principal, scoped to whatever they are entitled to. */
export async function requireScope(): Promise<{ user: SessionUser; scope: TenantScope }> {
  const user = await requireSessionUser();
  return { user, scope: scopeFor(user) };
}

/** A clinic-bound user (CLIENT, PATIENT, DOCTOR, COORDINATOR, RECEPTIONIST). Super admins are rejected here so
 *  that portal code paths cannot accidentally run cross-tenant. */
export async function requireClientUser(): Promise<{
  user: SessionUser;
  scope: TenantScope;
  clinicId: string;
}> {
  const user = await requireSessionUser();
  if (
    !user.clinicId ||
    (user.role !== 'CLIENT' &&
      user.role !== 'PATIENT' &&
      user.role !== 'DOCTOR' &&
      user.role !== 'COORDINATOR' &&
      user.role !== 'RECEPTIONIST')
  ) {
    throw forbidden('This area is restricted to clinic accounts.');
  }
  return { user, scope: clinicScope(user.clinicId, user.id), clinicId: user.clinicId };
}

export function scopeFor(user: SessionUser): TenantScope {
  if (user.role === 'SUPER_ADMIN') return platformScope(user.id);
  if (!user.clinicId) {
    // A CLIENT with no clinic is a data integrity fault; fail closed.
    throw forbidden('Your account is not linked to a clinic.');
  }
  return clinicScope(user.clinicId, user.id);
}

/** Non-throwing variant for layouts that render a "signed out" branch. */
export async function optionalScope(): Promise<{ user: SessionUser; scope: TenantScope } | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return { user, scope: scopeFor(user) };
}
