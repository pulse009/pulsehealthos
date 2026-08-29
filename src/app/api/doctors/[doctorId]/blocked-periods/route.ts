import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { doctorTimeOffSchema } from '@/lib/validation/schemas';
import {
  addDoctorTimeOff,
  deleteDoctorTimeOff,
} from '@/lib/directory/directory.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ doctorId: string }> };

export async function POST(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const { doctorId } = await context.params;
    const body = await parseJson(request, doctorTimeOffSchema);

    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');
    const timeOff = await addDoctorTimeOff(scope, clinicId, doctorId, body);
    return NextResponse.json({ ok: true, timeOff });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const { doctorId } = await context.params;
    const { searchParams } = new URL(request.url);
    const timeOffId = searchParams.get('id');

    if (!timeOffId) {
      return NextResponse.json({ error: 'Blocked period id is required' }, { status: 400 });
    }

    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');
    await deleteDoctorTimeOff(scope, clinicId, timeOffId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
