import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cache } from 'react';
import type { Role } from '@prisma/client';
import { env } from '@/env';
import { prisma } from '@/lib/db/prisma';
import { unauthenticated } from '@/lib/errors';

export const SESSION_COOKIE = 'clinic_session';

const ISSUER = 'clinic-ai-platform';
const AUDIENCE = 'clinic-ai-platform:web';

export interface SessionClaims extends JWTPayload {
  sub: string;
  role: Role;
  clinicId: string | null;
  /** Mirrors `User.sessionVersion`; a mismatch revokes the token. */
  v: number;
}

/** The authenticated principal, re-validated against the database. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  clinicId: string | null;
  clinicName?: string | null;
}

const secretKey = (): Uint8Array => new TextEncoder().encode(env.AUTH_SECRET);

export interface SessionInput {
  sub: string;
  role: Role;
  clinicId: string | null;
  v: number;
}

export async function signSession(claims: SessionInput) {
  const ttl = env.SESSION_TTL_SECONDS;
  const token = await new SignJWT({ role: claims.role, clinicId: claims.clinicId, v: claims.v })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(secretKey());
  return { token, maxAge: ttl };
}

/**
 * Cryptographic verification only — no database access, so this is safe to call
 * from Edge middleware. It proves the token was issued by us and has not
 * expired; it does NOT prove the user is still active or the session still
 * valid. Always pair with `getSessionUser` before granting data access.
 */
export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });
    if (typeof payload.sub !== 'string') return null;
    return payload as SessionClaims;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string, maxAge: number): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.APP_URL.startsWith('https://'),
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: env.APP_URL.startsWith('https://'),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Resolve the current principal.
 *
 * Deliberately hits the database on every request rather than trusting the JWT
 * body: it is what makes deactivation, role changes and session revocation take
 * effect immediately instead of at token expiry. `cache()` collapses that to one
 * query per request, no matter how many components ask.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      clinicId: true,
      isActive: true,
      sessionVersion: true,
      clinic: { select: { name: true, isActive: true } },
    },
  });

  if (!user || !user.isActive) return null;
  if (user.sessionVersion !== claims.v) return null;
  // A CLIENT of a deactivated clinic loses access immediately.
  if (user.role === 'CLIENT' && (!user.clinicId || user.clinic?.isActive === false)) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clinicId: user.clinicId,
    clinicName: user.clinic?.name || null,
  };
});

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw unauthenticated();
  return user;
}
