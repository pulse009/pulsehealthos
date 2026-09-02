import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { doctorSchema } from '@/lib/validation/schemas';
import { listDoctors, saveDoctor } from '@/lib/directory/directory.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { user, scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : undefined;
    const coordinatorId = user.role === 'COORDINATOR' ? user.id : undefined;
    const doctorUserId = user.role === 'DOCTOR' ? user.id : undefined;
    const doctors = await listDoctors(scope, clinicId, coordinatorId, doctorUserId);
    return NextResponse.json({ ok: true, doctors });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const body = await parseJson(request, doctorSchema);
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');

    const doctor = await saveDoctor(scope, clinicId, body);
    return NextResponse.json({ ok: true, doctor });
  } catch (error) {
    return errorResponse(error);
  }
}

