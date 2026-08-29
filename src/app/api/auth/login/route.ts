import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, withErrorHandling } from '@/lib/api/handler';
import { loginSchema } from '@/lib/validation/schemas';
import { authenticate, landingPathFor } from '@/lib/auth/authenticate';
import { clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withErrorHandling(async (request: Request) => {
  limitByIp(request, 'login', RateLimits.LOGIN);

  const { email, password } = await parseJson(request, loginSchema);

  const user = await authenticate(email, password, {
    ipAddress: clientIp(request.headers),
    userAgent: request.headers.get('user-agent'),
  });

  // The session cookie was set by `authenticate`. Return only what the client
  // needs to route — never the role's underlying permissions or the clinic's
  // configuration.
  return NextResponse.json({
    ok: true,
    user: { name: user.name, role: user.role },
    redirectTo: landingPathFor(user),
  });
});
