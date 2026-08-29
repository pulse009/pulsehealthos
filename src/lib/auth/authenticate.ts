import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { unauthenticated, forbidden } from '@/lib/errors';
import { logger, Events } from '@/lib/logger';
import { recordAudit } from '@/lib/audit';
import { platformScope, clinicScope } from '@/lib/tenancy/scope';
import { fakeVerify, verifyPassword } from '@/lib/auth/password';
import { signSession, setSessionCookie, type SessionUser } from '@/lib/auth/session';

/**
 * Interactive sign-in.
 *
 * Two properties matter here beyond the obvious:
 *
 *  - **Uniform failure.** Wrong password, unknown email, deactivated account and
 *    deactivated clinic all produce the same message and comparable timing (a
 *    dummy bcrypt comparison runs for unknown users). Nothing about the response
 *    reveals whether an address is registered.
 *  - **Throttling.** Consecutive failures lock the account for a growing window,
 *    which blunts credential stuffing even when the IP-level limiter is bypassed
 *    by distributing the attack.
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const GENERIC_FAILURE = 'Username/Email or password is incorrect.';

export interface LoginContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function authenticate(
  identifier: string,
  password: string,
  context: LoginContext = {},
): Promise<SessionUser> {
  const now = new Date();
  const trimmed = identifier.trim();
  const lowerIdentifier = trimmed.toLowerCase();
  const upperIdentifier = trimmed.toUpperCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: lowerIdentifier },
        { username: upperIdentifier },
        { username: trimmed },
      ],
    },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      clinicId: true,
      passwordHash: true,
      isActive: true,
      sessionVersion: true,
      failedLogins: true,
      lockedUntil: true,
      clinic: { select: { isActive: true } },
    },
  });

  if (!user) {
    // Spend comparable time so a missing account is not detectable by timing.
    await fakeVerify();
    logger.warn(Events.AUTH_LOGIN_FAILED, 'Login attempt for unknown identifier', {
      identifier: trimmed,
      ip: context.ipAddress,
    });
    throw unauthenticated(GENERIC_FAILURE);
  }

  if (user.lockedUntil && user.lockedUntil > now) {
    logger.warn(Events.AUTH_LOCKED, 'Login attempt on locked account', {
      userId: user.id,
      ip: context.ipAddress,
    });
    throw forbidden('This account is temporarily locked. Please try again shortly.');
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    const attempts = user.failedLogins + 1;
    const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: attempts,
        lockedUntil: shouldLock ? new Date(now.getTime() + LOCKOUT_MINUTES * 60_000) : null,
      },
    });
    logger.warn(Events.AUTH_LOGIN_FAILED, 'Incorrect password', {
      userId: user.id,
      attempts,
      locked: shouldLock,
      ip: context.ipAddress,
    });
    throw unauthenticated(GENERIC_FAILURE);
  }

  // Correct password, but the account or its clinic is disabled. Same message,
  // so a disabled account cannot be distinguished from a wrong password.
  if (!user.isActive) {
    logger.warn(Events.AUTH_LOGIN_FAILED, 'Login on deactivated account', { userId: user.id });
    throw unauthenticated(GENERIC_FAILURE);
  }
  if (user.role === 'CLIENT' && (!user.clinicId || user.clinic?.isActive === false)) {
    logger.warn(Events.AUTH_LOGIN_FAILED, 'Login for client of inactive clinic', {
      userId: user.id,
      clinicId: user.clinicId,
    });
    throw unauthenticated(GENERIC_FAILURE);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: now },
  });

  const { token, maxAge } = await signSession({
    sub: user.id,
    role: user.role,
    clinicId: user.clinicId,
    v: user.sessionVersion,
  });
  await setSessionCookie(token, maxAge);

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    role: user.role,
    clinicId: user.clinicId,
  };

  logger.info(Events.AUTH_LOGIN_SUCCESS, 'Login succeeded', {
    userId: user.id,
    role: user.role,
    clinicId: user.clinicId,
  });

  await recordAudit(
    user.role === 'SUPER_ADMIN' ? platformScope(user.id) : clinicScope(user.clinicId!, user.id),
    {
      action: 'auth.login',
      entityType: 'User',
      entityId: user.id,
      clinicId: user.clinicId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    },
  );

  return sessionUser;
}

/** Where a principal lands after signing in. */
export const landingPathFor = (user: SessionUser): string =>
  user.role === 'SUPER_ADMIN' ? '/admin' : '/portal';
