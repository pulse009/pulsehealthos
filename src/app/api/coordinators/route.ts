import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import {
  createCoordinatorSchema,
  updateCoordinatorSchema,
  resetCoordinatorPasswordSchema,
} from '@/lib/validation/schemas';
import {
  listClinicCoordinators,
  createClinicCoordinator,
  updateClinicCoordinator,
  resetCoordinatorPassword,
  deleteClinicCoordinator,
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

export async function PUT(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const body = await parseJson(request, updateCoordinatorSchema);
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');

    const coordinator = await updateClinicCoordinator(scope, clinicId, body);
    return NextResponse.json({ ok: true, coordinator });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const body = await parseJson(request, resetCoordinatorPasswordSchema);
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');

    await resetCoordinatorPassword(scope, clinicId, body.coordinatorId, body.password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const url = new URL(request.url);
    const coordinatorId = url.searchParams.get('id');
    if (!coordinatorId) {
      return NextResponse.json({ ok: false, error: 'Coordinator ID is required' }, { status: 400 });
    }
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');

    await deleteClinicCoordinator(scope, clinicId, coordinatorId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
