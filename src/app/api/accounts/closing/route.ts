import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { createDayEndClosingSchema } from '@/lib/validation/accounts.schemas';
import { listDayEndClosings, createDayEndClosing } from '@/lib/accounts/accounts.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { user, scope } = await requireScope();

    const closings = await listDayEndClosings(scope, user.clinicId);
    return NextResponse.json({ ok: true, closings });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();

    const body = await parseJson(request, createDayEndClosingSchema);
    const closing = await createDayEndClosing(scope, user.clinicId, body, user.id);

    return NextResponse.json({ ok: true, closing });
  } catch (error) {
    return errorResponse(error);
  }
}
