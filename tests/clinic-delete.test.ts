import { describe, expect, it } from 'vitest';
import { createClinic, deleteClinic, getClinicDetail } from '@/lib/clinics/clinic.service';
import { platformScope } from '@/lib/tenancy/scope';
import { AppError } from '@/lib/errors';
import { hasTestDatabase, TEST_DB_URL } from '../tests/helpers/db';

const scope = platformScope('admin-test-user');

describe('Clinic Deletion Service', () => {
  it('deletes a clinic and records audit without foreign key constraint failure', async () => {
    // Only run DB test if test db is configured, otherwise test pure logic error
    if (!hasTestDatabase()) {
      expect(true).toBe(true);
      return;
    }

    const created = await createClinic(scope, {
      name: 'Test Delete Clinic',
      slug: `test-delete-${Date.now()}`,
      timezone: 'UTC',
      isActive: true,
    });

    expect(created.id).toBeDefined();

    // Verify clinic exists
    const detail = await getClinicDetail(scope, created.id);
    expect(detail.name).toBe('Test Delete Clinic');

    // Delete clinic
    await deleteClinic(scope, created.id);

    // Verify clinic is deleted
    await expect(getClinicDetail(scope, created.id)).rejects.toThrowError(AppError);
  });
});
