import { describe, expect, it, vi } from 'vitest';
import { clinicScope, platformScope } from '@/lib/tenancy/scope';
import { AppError } from '@/lib/errors';
import { deleteDoctor } from '@/lib/directory/directory.service';
import { prisma } from '@/lib/db/prisma';

vi.mock('@/lib/db/prisma', () => {
  const mockDoctor = {
    findFirst: vi.fn(),
    delete: vi.fn(),
  };
  const mockAppointment = {
    count: vi.fn(),
  };
  const mockUser = {
    findUnique: vi.fn(),
    delete: vi.fn(),
  };

  return {
    prisma: {
      doctor: mockDoctor,
      appointment: mockAppointment,
      user: mockUser,
      $transaction: vi.fn(async (cb) => {
        return cb({
          doctor: mockDoctor,
          user: mockUser,
        });
      }),
    },
  };
});

vi.mock('@/lib/audit', () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}));

describe('deleteDoctor', () => {
  const CLINIC_ID = 'clinic-123';
  const OTHER_CLINIC_ID = 'clinic-456';
  const DOCTOR_ID = 'doc-999';

  it('throws FORBIDDEN if client attempts to delete a doctor from another clinic', async () => {
    const clientScope = clinicScope(CLINIC_ID, 'user-owner');
    await expect(deleteDoctor(clientScope, OTHER_CLINIC_ID, DOCTOR_ID)).rejects.toThrowError(
      AppError,
    );
  });

  it('throws NOT_FOUND if doctor does not exist in the clinic', async () => {
    const clientScope = clinicScope(CLINIC_ID, 'user-owner');
    (prisma.doctor.findFirst as any).mockResolvedValueOnce(null);

    await expect(deleteDoctor(clientScope, CLINIC_ID, DOCTOR_ID)).rejects.toThrowError(
      'Doctor not found.',
    );
  });

  it('throws CONFLICT if doctor has existing appointments', async () => {
    const clientScope = clinicScope(CLINIC_ID, 'user-owner');
    (prisma.doctor.findFirst as any).mockResolvedValueOnce({
      id: DOCTOR_ID,
      name: 'Dr. John',
      userId: 'user-doc-1',
    });
    (prisma.appointment.count as any).mockResolvedValueOnce(3);

    await expect(deleteDoctor(clientScope, CLINIC_ID, DOCTOR_ID)).rejects.toThrowError(
      'This doctor has appointments and cannot be deleted. Deactivate them instead.',
    );
  });

  it('successfully deletes doctor and linked user account when no appointments exist', async () => {
    const clientScope = clinicScope(CLINIC_ID, 'user-owner');
    (prisma.doctor.findFirst as any).mockResolvedValueOnce({
      id: DOCTOR_ID,
      name: 'Dr. John',
      userId: 'user-doc-1',
    });
    (prisma.appointment.count as any).mockResolvedValueOnce(0);
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: 'user-doc-1',
      role: 'DOCTOR',
    });

    const result = await deleteDoctor(clientScope, CLINIC_ID, DOCTOR_ID);

    expect(result).toEqual({ ok: true });
    expect(prisma.doctor.delete).toHaveBeenCalledWith({ where: { id: DOCTOR_ID } });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-doc-1' } });
  });

  it('allows PLATFORM scope (super admin) to delete doctor', async () => {
    const superAdminScope = platformScope('superadmin-1');
    (prisma.doctor.findFirst as any).mockResolvedValueOnce({
      id: DOCTOR_ID,
      name: 'Dr. John',
      userId: null,
    });
    (prisma.appointment.count as any).mockResolvedValueOnce(0);

    const result = await deleteDoctor(superAdminScope, CLINIC_ID, DOCTOR_ID);

    expect(result).toEqual({ ok: true });
    expect(prisma.doctor.delete).toHaveBeenCalledWith({ where: { id: DOCTOR_ID } });
  });
});
