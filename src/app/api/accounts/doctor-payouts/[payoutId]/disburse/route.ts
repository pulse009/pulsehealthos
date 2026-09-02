import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { disburseDoctorPayoutSchema } from '@/lib/validation/accounts.schemas';
import { disburseDoctorPayout } from '@/lib/accounts/accounts.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ payoutId: string }> },
) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();

    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { payoutId } = await params;
    const body = await parseJson(request, disburseDoctorPayoutSchema);
    const payout = await disburseDoctorPayout(scope, payoutId, body, user.id);

    return NextResponse.json({ ok: true, payout });
  } catch (error) {
    return errorResponse(error);
  }
}
