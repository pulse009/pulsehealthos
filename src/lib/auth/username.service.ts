import 'server-only';
import { prisma, type DbClient } from '@/lib/db/prisma';

export type UserRolePrefix = 'PA' | 'COORD' | 'RC';

/**
 * Generate a unique role-based username:
 * - Patient: PA-{fileNumber} or next available incremental index (e.g. PA-101)
 * - Coordinator: COORD-{number} (e.g. COORD-101)
 * - Doctor: RC-{number} (e.g. RC-101)
 */
export async function generateUniqueUsername(
  rolePrefix: UserRolePrefix,
  fileNumberOrCustomNum?: number | null,
  db: DbClient = prisma,
): Promise<string> {
  if (rolePrefix === 'PA' && typeof fileNumberOrCustomNum === 'number' && fileNumberOrCustomNum > 0) {
    const candidate = `PA-${fileNumberOrCustomNum}`;
    const exists = await db.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!exists) {
      return candidate;
    }
  }

  // Find the highest existing number with this prefix across all users
  const usersWithPrefix = await db.user.findMany({
    where: {
      username: {
        startsWith: `${rolePrefix}-`,
      },
    },
    select: { username: true },
  });

  let maxNum = 0;
  for (const u of usersWithPrefix) {
    if (!u.username) continue;
    const parts = u.username.split('-');
    if (parts.length >= 2) {
      const parsed = parseInt(parts[1] ?? '0', 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  // Default starting base numbers
  const baseStartingNum = rolePrefix === 'PA' ? (fileNumberOrCustomNum ?? 1) : 101;
  let nextNum = Math.max(maxNum + 1, baseStartingNum);

  // Guarantee uniqueness
  while (true) {
    const candidate = `${rolePrefix}-${nextNum}`;
    const exists = await db.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!exists) {
      return candidate;
    }
    nextNum++;
  }
}

export async function generateDoctorUsername(
  name: string,
  db: DbClient = prisma,
): Promise<string> {
  // Strip common prefixes like 'Dr.', 'Doctor', 'Dr '
  let cleanName = name
    .toLowerCase()
    .trim()
    .replace(/^(dr\.?|doctor)\s*/i, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  if (!cleanName || cleanName.length < 2) {
    cleanName = 'doctor';
  }

  const baseUsername = `dr.${cleanName}`;
  let uniqueUsername = baseUsername;
  let attempt = 0;

  while (true) {
    const candidate = attempt === 0 ? baseUsername : `${baseUsername}${Math.floor(10 + Math.random() * 90)}`;
    const existing = await db.user.findFirst({
      where: {
        OR: [{ username: candidate }, { username: candidate.toUpperCase() }],
      },
      select: { id: true },
    });
    if (!existing) {
      uniqueUsername = candidate;
      break;
    }
    attempt++;
    if (attempt > 20) {
      uniqueUsername = `${baseUsername}${Date.now().toString().slice(-4)}`;
      break;
    }
  }

  return uniqueUsername;
}
