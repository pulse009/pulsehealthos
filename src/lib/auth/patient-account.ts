import 'server-only';
import { prisma, type DbClient } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';

/**
 * Generate a random 12-character password satisfying the password policy
 * (uppercase, lowercase, digits, symbols).
 */
export function generateTemporaryPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const symbols = '!@#$%&*';

  let pwd = 'Cln';
  pwd += uppers.charAt(Math.floor(Math.random() * uppers.length));
  pwd += symbols.charAt(Math.floor(Math.random() * symbols.length));
  pwd += '2026';

  for (let i = 0; i < 4; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export interface PatientAccountResult {
  userId: string;
  email: string;
  temporaryPassword?: string;
  isNewAccount: boolean;
}

/**
 * Ensures a User record with role PATIENT exists for the given patient,
 * creating one with a temporary password if it does not yet exist.
 */
export async function ensurePatientUserAccount(
  clinicId: string,
  patientId: string,
  email: string,
  patientName?: string | null,
  db: DbClient = prisma,
): Promise<PatientAccountResult | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) return null;

  // 1. Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, role: true, clinicId: true },
  });

  if (existingUser) {
    // Link existing user to patient record
    await db.patient.update({
      where: { id: patientId },
      data: { userId: existingUser.id, email: normalizedEmail },
    });
    return {
      userId: existingUser.id,
      email: normalizedEmail,
      isNewAccount: false,
    };
  }

  // 2. Create new user account with role PATIENT
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const name = patientName?.trim() || 'Patient';

  const newUser = await db.user.create({
    data: {
      email: normalizedEmail,
      name,
      passwordHash,
      role: 'PATIENT',
      clinicId,
      isActive: true,
    },
    select: { id: true },
  });

  // Link newly created user to patient record
  await db.patient.update({
    where: { id: patientId },
    data: { userId: newUser.id, email: normalizedEmail },
  });

  return {
    userId: newUser.id,
    email: normalizedEmail,
    temporaryPassword,
    isNewAccount: true,
  };
}
