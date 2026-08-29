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
