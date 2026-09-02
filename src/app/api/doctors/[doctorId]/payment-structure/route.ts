import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { doctorPaymentStructureSchema } from '@/lib/validation/schemas';
import {
  getDoctorPaymentStructure,
  saveDoctorPaymentStructure,
} from '@/lib/directory/directory.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ doctorId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { user, scope } = await requireScope();
    if (user.role === 'DOCTOR') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    const { doctorId } = await context.params;

    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');
    const paymentStructure = await getDoctorPaymentStructure(scope, clinicId, doctorId);
    return NextResponse.json({ ok: true, paymentStructure });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();
    if (user.role === 'DOCTOR') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    const { doctorId } = await context.params;
    const body = await parseJson(request, doctorPaymentStructureSchema);

    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');
    const paymentStructure = await saveDoctorPaymentStructure(scope, clinicId, doctorId, body);
    return NextResponse.json({ ok: true, paymentStructure });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: Context) {
  return PATCH(request, context);
}
