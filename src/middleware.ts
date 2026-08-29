import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Edge route protection.
 *
 * This is a *fast reject*, not an authorization boundary. It runs on the edge,
 * where there is no database, so it can only check that a session cookie is
 * present and cryptographically valid. It deliberately does not decide what the
 * request may read.
 *
 * The real checks — is the user still active, is their session still valid, does
 * this row belong to their clinic — happen in the server components and route
 * handlers via `requireScope`/`requireSuperAdmin`, which do hit the database.
 * Middleware exists so an anonymous visitor gets a clean redirect instead of a
 * flash of an empty dashboard.
 */

const SESSION_COOKIE = 'clinic_session';

const ADMIN_PREFIX = '/admin';
const PORTAL_PREFIX = '/portal';

interface MinimalClaims {
  sub?: string;
  role?: string;
}

async function readClaims(token: string, secret: string): Promise<MinimalClaims | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: 'clinic-ai-platform',
      audience: 'clinic-ai-platform:web',
      algorithms: ['HS256'],
    });
    return payload as MinimalClaims;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const needsAuth = pathname.startsWith(ADMIN_PREFIX) || pathname.startsWith(PORTAL_PREFIX);
  if (!needsAuth) return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // Misconfiguration must fail closed rather than silently allowing traffic.
    return NextResponse.redirect(new URL('/login?error=configuration', request.url));
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await readClaims(token, secret) : null;

  if (!claims?.sub) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  // Send each role to its own area. Server-side guards enforce this too; this
  // just avoids rendering a page the user would immediately be refused.
  if (pathname.startsWith(ADMIN_PREFIX) && claims.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/portal', request.url));
  }
  if (pathname.startsWith(PORTAL_PREFIX) && claims.role === 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*'],
};
