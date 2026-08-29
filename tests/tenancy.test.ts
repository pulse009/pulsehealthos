import { describe, expect, it } from 'vitest';
import {
  assertOwned,
  assertPlatformScope,
  clinicScope,
  clinicWhere,
  platformScope,
  resolveClinicId,
  scopedClinicId,
  systemScope,
} from '@/lib/tenancy/scope';
import { AppError } from '@/lib/errors';

/**
 * Tenant isolation.
 *
 * The whole cross-clinic guarantee rests on these four functions, so each is
 * tested for the hostile case as well as the happy one. A regression here would
 * not be a visible bug — it would be a silent data leak.
 */

const CLINIC_A = 'clinic-a';
const CLINIC_B = 'clinic-b';

const clientA = clinicScope(CLINIC_A, 'user-a');
const clientB = clinicScope(CLINIC_B, 'user-b');
const admin = platformScope('admin-1');
const system = systemScope(CLINIC_A, 'ai-agent');

describe('resolveClinicId', () => {
  it('resolves a client scope to its own clinic', () => {
    expect(resolveClinicId(clientA)).toBe(CLINIC_A);
    expect(resolveClinicId(clientA, CLINIC_A)).toBe(CLINIC_A);
  });

  it('refuses a client asking for another clinic', () => {
    expect(() => resolveClinicId(clientA, CLINIC_B)).toThrowError(AppError);
    try {
      resolveClinicId(clientA, CLINIC_B);
    } catch (error) {
      expect((error as AppError).code).toBe('FORBIDDEN');
    }
  });

  it('does not silently narrow — an unauthorised id must fail loudly', () => {
    // Returning CLINIC_A here would hide an IDOR probe and make the bug
    // invisible in logs.
    expect(() => resolveClinicId(clientA, CLINIC_B)).toThrow();
  });

  it('requires a platform scope to name a clinic explicitly', () => {
    expect(() => resolveClinicId(admin)).toThrowError(AppError);
    expect(resolveClinicId(admin, CLINIC_B)).toBe(CLINIC_B);
  });

  it('pins a system scope to its clinic', () => {
    expect(resolveClinicId(system)).toBe(CLINIC_A);
    expect(() => resolveClinicId(system, CLINIC_B)).toThrow();
  });
});

describe('clinicWhere', () => {
  it('constrains a client query to its own clinic', () => {
    expect(clinicWhere(clientA)).toEqual({ clinicId: CLINIC_A });
    expect(clinicWhere(clientA, CLINIC_A)).toEqual({ clinicId: CLINIC_A });
  });

  it('refuses a client filtering by another clinic', () => {
    expect(() => clinicWhere(clientA, CLINIC_B)).toThrow();
  });

  it('lets a platform scope query across tenants only when no clinic is named', () => {
    expect(clinicWhere(admin)).toEqual({});
    expect(clinicWhere(admin, CLINIC_B)).toEqual({ clinicId: CLINIC_B });
  });

  it('never produces an unconstrained filter for a tenant-bound scope', () => {
    for (const scope of [clientA, clientB, system]) {
      expect(clinicWhere(scope)).toHaveProperty('clinicId');
    }
  });
});

describe('assertOwned', () => {
  it('accepts a row belonging to the scope', () => {
    expect(() => assertOwned(clientA, { clinicId: CLINIC_A })).not.toThrow();
  });

  it('rejects a row from another tenant', () => {
    expect(() => assertOwned(clientA, { clinicId: CLINIC_B })).toThrow();
  });

  it('rejects a missing row', () => {
    expect(() => assertOwned(clientA, null)).toThrow();
  });

  it('gives an identical message whether the row is missing or foreign', () => {
    // Distinguishable messages would confirm the existence of another tenant's
    // record to anyone probing ids.
    const missing = captureMessage(() => assertOwned(clientA, null, 'Appointment'));
    const foreign = captureMessage(() =>
      assertOwned(clientA, { clinicId: CLINIC_B }, 'Appointment'),
    );
    expect(missing).toBe(foreign);
  });

  it('lets a platform scope read any tenant', () => {
    expect(() => assertOwned(admin, { clinicId: CLINIC_B })).not.toThrow();
  });
});

describe('assertPlatformScope', () => {
  it('permits a super admin', () => {
    expect(() => assertPlatformScope(admin)).not.toThrow();
  });

  it('refuses clients and system callers', () => {
    expect(() => assertPlatformScope(clientA)).toThrow();
    expect(() => assertPlatformScope(system)).toThrow();
  });
});

describe('scopedClinicId', () => {
  it('reports null only for a platform scope', () => {
    expect(scopedClinicId(admin)).toBeNull();
    expect(scopedClinicId(clientA)).toBe(CLINIC_A);
    expect(scopedClinicId(system)).toBe(CLINIC_A);
  });
});

function captureMessage(fn: () => void): string {
  try {
    fn();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error('Expected the function to throw.');
}
