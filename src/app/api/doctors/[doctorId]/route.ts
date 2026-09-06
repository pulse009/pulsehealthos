import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { forbidden } from '@/lib/errors';
import { clinicDoctorOperationalSchema } from '@/lib/validation/schemas';
import {
  getClinicDoctorDetail,
  updateClinicDoctorOperational,
  deleteDoctor,
} from '@/lib/directory/directory.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ doctorId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { scope } = await requireScope();
    const { doctorId } = await context.params;

    const doctor = await getClinicDoctorDetail(scope, doctorId);
    return NextResponse.json({ ok: true, doctor });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const { doctorId } = await context.params;
    const body = await parseJson(request, clinicDoctorOperationalSchema);

    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');
    const doctor = await updateClinicDoctorOperational(scope, clinicId, doctorId, body);
    return NextResponse.json({ ok: true, doctor });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();
    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
      throw forbidden('Only clinic administrators can delete doctors.');
    }
    const { doctorId } = await context.params;
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');

    await deleteDoctor(scope, clinicId, doctorId);
    return NextResponse.json({ ok: true, message: 'Doctor deleted successfully.' });
  } catch (error) {
    return errorResponse(error);
  }
}
