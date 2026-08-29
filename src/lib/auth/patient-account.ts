import 'server-only';
import { prisma, type DbClient } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { generateUniqueUsername } from '@/lib/auth/username.service';

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
  username: string;
  temporaryPassword?: string;
  isNewAccount: boolean;
}

/**
 * Ensures a User record with role PATIENT exists for the given patient,
 * assigning a unique PA-NUMBER username and password if it does not yet exist.
 */
export async function ensurePatientUserAccount(
  clinicId: string,
  patientId: string,
  emailOrPhone?: string | null,
  patientName?: string | null,
  fileNumber?: number | null,
  db: DbClient = prisma,
): Promise<PatientAccountResult | null> {
  const patient = await db.patient.findUnique({
    where: { id: patientId },
    select: { id: true, userId: true, phone: true, email: true, fileNumber: true, user: true },
  });
  if (!patient) return null;

  const actualFileNumber = fileNumber ?? patient.fileNumber ?? 1;

  // 1. Check if patient already has a linked user
  if (patient.userId && patient.user) {
    let existingUsername = patient.user.username;
    if (!existingUsername) {
      existingUsername = await generateUniqueUsername('PA', actualFileNumber, db);
      await db.user.update({
        where: { id: patient.userId },
        data: { username: existingUsername },
      });
    }
    return {
      userId: patient.userId,
      email: patient.user.email,
      username: existingUsername,
      isNewAccount: false,
    };
  }

  // 2. Generate unique PA-NUMBER username
  const username = await generateUniqueUsername('PA', actualFileNumber, db);
  
  // Format normalized email or fallback unique username email
  const cleanEmail = emailOrPhone && emailOrPhone.includes('@')
    ? emailOrPhone.trim().toLowerCase()
    : `${username.toLowerCase()}@patient.clinic`;

  // Check if a user exists with this email or username
  const existingUser = await db.user.findFirst({
    where: {
      OR: [{ email: cleanEmail }, { username }],
    },
    select: { id: true, email: true, username: true },
  });

  if (existingUser) {
    await db.patient.update({
      where: { id: patientId },
      data: { userId: existingUser.id },
    });
    return {
      userId: existingUser.id,
      email: existingUser.email,
      username: existingUser.username || username,
      isNewAccount: false,
    };
  }

  // 3. Create new user account with role PATIENT and unique username
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const name = patientName?.trim() || 'Patient';

  const newUser = await db.user.create({
    data: {
      email: cleanEmail,
      username,
      phone: patient.phone,
      name,
      passwordHash,
      role: 'PATIENT',
      clinicId,
      isActive: true,
    },
    select: { id: true, email: true, username: true },
  });

  // Link newly created user to patient record
  await db.patient.update({
    where: { id: patientId },
    data: { userId: newUser.id },
  });

  return {
    userId: newUser.id,
    email: newUser.email,
    username: newUser.username || username,
    temporaryPassword,
    isNewAccount: true,
  };
}
