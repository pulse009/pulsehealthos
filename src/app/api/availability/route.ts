import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseQuery, withErrorHandling } from '@/lib/api/handler';
import { availabilityQuerySchema } from '@/lib/validation/schemas';
import { requireScope } from '@/lib/auth/guards';
import { getAvailableSlots } from '@/lib/booking/availability.service';
import { formatInstant } from '@/lib/time/timezone';

/**
 * Availability lookup for the admin booking UI.
 *
 * `requireScope` produces a tenant scope from the session, and
 * `getAvailableSlots` resolves the clinic through it — so a CLIENT passing
 * another clinic's id gets a 403 rather than that clinic's calendar.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withErrorHandling(async (request: Request) => {
  limitByIp(request, 'api-read', RateLimits.API_READ);

  const { scope } = await requireScope();
  const query = parseQuery(request, availabilityQuerySchema);

  const slots = await getAvailableSlots(scope, {
    clinicId: query.clinicId,
    serviceId: query.serviceId,
    doctorId: query.doctorId,
    fromDateKey: query.fromDate,
    toDateKey: query.toDate,
    limit: query.limit ?? 100,
  });

  return NextResponse.json({
    slots: slots.map((s) => ({
      slotToken: s.slotToken,
      startsAt: s.start.toISOString(),
      endsAt: s.end.toISOString(),
      label: formatInstant(s.start, s.timezone),
      doctorId: s.doctorId,
      doctorName: s.doctorName,
      serviceName: s.serviceName,
      durationMinutes: s.durationMinutes,
    })),
  });
});
