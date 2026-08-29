import { NextResponse } from 'next/server';
import { env } from '@/env';
import { safeEqual } from '@/lib/crypto';
import { logger } from '@/lib/logger';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, withErrorHandling } from '@/lib/api/handler';
import { dispatchDueReminders } from '@/lib/reminders/dispatcher';

/**
 * Reminder dispatch job.
 *
 * Intended to be called every few minutes by a scheduler (Vercel Cron, a
 * Kubernetes CronJob, or plain `curl` from cron) with:
 *
 *   Authorization: Bearer $CRON_SECRET
 *
 * The job is safe to run concurrently and safe to retry: each reminder is
 * claimed with a conditional update, so an overlapping invocation cannot send
 * the same reminder twice.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Dispatch talks to WhatsApp for each reminder; give it room beyond the default.
export const maxDuration = 60;

function isAuthorised(request: Request): boolean {
  const header = request.headers.get('authorization') ?? '';
  const [scheme, token] = header.split(' ', 2);
  if (scheme !== 'Bearer' || !token) return false;
  return safeEqual(env.CRON_SECRET, token);
}

async function handle(request: Request): Promise<NextResponse> {
  limitByIp(request, 'cron', RateLimits.CRON);

  if (!isAuthorised(request)) {
    logger.warn('cron.unauthorised', 'Rejected unauthenticated cron invocation', {
      path: new URL(request.url).pathname,
    });
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } }, { status: 403 });
  }

  const summary = await dispatchDueReminders();
  logger.info('cron.reminders', 'Reminder dispatch completed', { ...summary });
  return NextResponse.json({ ok: true, ...summary });
}

export const POST = withErrorHandling(handle);
// GET is accepted because several managed schedulers only issue GET requests.
export const GET = withErrorHandling(handle);
