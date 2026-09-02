import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { generateDoctorPayoutSchema } from '@/lib/validation/accounts.schemas';
import {
  listDoctorPayouts,
  createDoctorPayout,
  calculateDoctorEarnings,
} from '@/lib/accounts/accounts.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { user, scope } = await requireScope();
    const url = new URL(request.url);

    if (user.role === 'RECEPTIONIST') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const doctorId = url.searchParams.get('doctorId');
    const status = url.searchParams.get('status');
    const calculateOnly = url.searchParams.get('calculate');
    const periodStart = url.searchParams.get('periodStart');
    const periodEnd = url.searchParams.get('periodEnd');

    if (calculateOnly === 'true' && doctorId && periodStart && periodEnd) {
      const calculation = await calculateDoctorEarnings(
        scope,
        doctorId,
        new Date(periodStart),
        new Date(periodEnd),
      );
      return NextResponse.json({ ok: true, calculation });
    }

    const payouts = await listDoctorPayouts(scope, user.clinicId, {
      doctorId: user.role === 'DOCTOR' ? (user as any).doctorId : doctorId,
      status,
    });

    return NextResponse.json({ ok: true, payouts });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();

    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await parseJson(request, generateDoctorPayoutSchema);
    const payout = await createDoctorPayout(scope, user.clinicId, body, user.id);

    return NextResponse.json({ ok: true, payout });
  } catch (error) {
    return errorResponse(error);
  }
}
