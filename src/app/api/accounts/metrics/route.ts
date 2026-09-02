import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { getFinancialMetrics } from '@/lib/accounts/accounts.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { user, scope } = await requireScope();

    if (user.role === 'RECEPTIONIST') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const metrics = await getFinancialMetrics(scope, user.clinicId);
    return NextResponse.json({ ok: true, metrics });
  } catch (error) {
    return errorResponse(error);
  }
}
