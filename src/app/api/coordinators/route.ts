import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { createCoordinatorSchema } from '@/lib/validation/schemas';
import {
  listClinicCoordinators,
  createClinicCoordinator,
} from '@/lib/directory/directory.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');
    const coordinators = await listClinicCoordinators(scope, clinicId);
    return NextResponse.json({ ok: true, coordinators });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const body = await parseJson(request, createCoordinatorSchema);
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');

    const coordinator = await createClinicCoordinator(scope, clinicId, body);
    return NextResponse.json({ ok: true, coordinator });
  } catch (error) {
    return errorResponse(error);
  }
}
