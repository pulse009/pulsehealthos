import { NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api/handler';
import { clearSessionCookie, getSessionUser } from '@/lib/auth/session';
import { logger, Events } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withErrorHandling(async () => {
  const user = await getSessionUser();
  await clearSessionCookie();

  if (user) {
    logger.info(Events.AUTH_LOGOUT, 'User signed out', { userId: user.id });
  }
  return NextResponse.json({ ok: true });
});
